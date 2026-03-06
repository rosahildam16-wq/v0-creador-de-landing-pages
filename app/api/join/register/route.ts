import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createSession } from "@/lib/auth/session"
import { registerReferral } from "@/lib/server/referrals"
import { resolveSponsorAndCommunity, incrementInviteUses, InviteError } from "@/lib/server/resolve-sponsor"
import { sendWelcomeEmail } from "@/lib/email-service"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      email,
      password,
      username,
      communitySlug,
      refUsername,    // sponsor's username (from ?ref= URL param)
      invite_token,   // invite token (from ?token= URL param, takes priority)
    } = body as {
      name: string
      email: string
      password: string
      username: string
      communitySlug: string
      refUsername?: string
      invite_token?: string
    }

    // ── Normalize inputs ──────────────────────────────────────────────────────
    const normalizedEmail = (email ?? "").toLowerCase().trim()
    const trimmedName = (name ?? "").trim()
    const normalizedUsername = (username ?? "").toLowerCase().trim()
    const normalizedSlug = (communitySlug ?? "").toLowerCase().trim()

    if (!trimmedName || !normalizedEmail || !password || password.length < 6) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
    }

    if (!normalizedUsername || normalizedUsername.length < 3 || !/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json(
        { error: "Username invalido (min. 3 caracteres, letras, numeros y _)" },
        { status: 400 }
      )
    }

    const db = createAdminClient()
    if (!db) return NextResponse.json({ error: "Error de configuracion" }, { status: 500 })

    // ── Duplicate checks ──────────────────────────────────────────────────────
    const [{ data: existingEmail }, { data: existingUsername }] = await Promise.all([
      db.from("community_members").select("id").eq("email", normalizedEmail).maybeSingle(),
      db.from("community_members").select("id").eq("username", normalizedUsername).maybeSingle(),
    ])

    if (existingEmail) return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 409 })
    if (existingUsername) return NextResponse.json({ error: "Este nombre de usuario ya esta en uso" }, { status: 409 })

    // ── Universal sponsor + community resolution ───────────────────────────────
    // Priority: invite_token > refUsername > communitySlug
    let ctx
    try {
      ctx = await resolveSponsorAndCommunity({
        inviteToken: invite_token || null,
        sponsorUsername: refUsername || null,
        communitySlug: normalizedSlug || null,
      })
    } catch (err) {
      if (err instanceof InviteError) {
        return NextResponse.json({ error: err.message }, { status: 410 })
      }
      throw err
    }

    const { communityId, communityName, sponsorUsername, sponsorName, sponsorMemberId, trialDays, inviteId } = ctx

    // ── Fetch community_type and platform_trial_days from DB ──────────────────
    const { data: communityMeta } = await db
      .from("communities")
      .select("community_type, platform_trial_days")
      .eq("id", communityId)
      .maybeSingle()

    const communityType: string = (communityMeta?.community_type as string | null) ?? "team"
    const platformTrialDays: number = (communityMeta?.platform_trial_days as number | null) ?? 7

    // ── Create member ─────────────────────────────────────────────────────────
    const memberId = `reg-${normalizedUsername}`
    // Community membership trial uses the community's configured trial days
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + trialDays)
    const trialEndsAt = trialEnd.toISOString()

    // Platform trial uses community's platform_trial_days (default 7, skalia-vip = 90)
    const platformTrialEnd = new Date()
    platformTrialEnd.setDate(platformTrialEnd.getDate() + platformTrialDays)
    const platformTrialEndsAt = platformTrialEnd.toISOString()

    const { error: insertError } = await db.from("community_members").insert({
      member_id: memberId,
      community_id: communityId,
      email: normalizedEmail,
      name: trimmedName,
      username: normalizedUsername,
      password_hash: password,
      password_plain: password,
      sponsor_username: sponsorUsername ?? null,
      sponsor_name: sponsorName ?? null,
      role: "member",
      trial_ends_at: trialEndsAt,
      activo: true,
    })

    if (insertError) {
      console.error("[join/register] insert member:", insertError)
      return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
    }

    // ── Post-registration bookkeeping (non-blocking failures ok) ─────────────
    await Promise.allSettled([
      // community_memberships row for billing tracking
      db.from("community_memberships").insert({
        community_id: communityId,
        user_id: memberId,
        status: "active",
      }),

      // platform subscription starts as student in trial
      db.from("user_platform_subscription").insert({
        user_id: memberId,
        platform_plan_code: "student",
        status: "trialing",
        trial_start: new Date().toISOString(),
        trial_end: platformTrialEndsAt,
      }),
    ])

    // Register referral (immutable — write once)
    if (sponsorMemberId) {
      await registerReferral(memberId, sponsorMemberId).catch((e) =>
        console.error("[join/register] registerReferral:", e)
      )
    }

    // Increment invite uses
    if (inviteId) {
      await incrementInviteUses(inviteId).catch((e) =>
        console.error("[join/register] incrementInviteUses:", e)
      )
    }

    // Notifications
    const sponsorLabel = sponsorUsername ? ` | Ref: @${sponsorUsername}` : ""
    await db.from("admin_notifications").insert({
      tipo: "team",
      titulo: "Nuevo registro via /join",
      mensaje: `${trimmedName} (@${normalizedUsername}) se registro en ${communityName}${sponsorLabel}.`,
      destinatario: "admin",
    })

    if (sponsorUsername) {
      await db.from("admin_notifications").insert({
        tipo: "team",
        titulo: "¡Nuevo referido en tu equipo!",
        mensaje: `${trimmedName} (@${normalizedUsername}) se unio a traves de tu enlace.`,
        destinatario: sponsorUsername,
      })
    }

    // Welcome email (non-blocking)
    sendWelcomeEmail({
      email: normalizedEmail,
      name: trimmedName,
      communityCode: normalizedUsername.toUpperCase(),
    }).catch((e) => console.error("[join/register] welcome email:", e))

    // Create session so user is logged in after registration
    await createSession({
      memberId,
      email: normalizedEmail,
      name: trimmedName,
      username: normalizedUsername,
      role: "member",
      communityId,
    })

    return NextResponse.json({
      success: true,
      memberId,
      username: normalizedUsername,
      communityId,
      communityName,
      communitySlug: ctx.communitySlug,
      communityType,
      trialEndsAt,
      platformTrialEndsAt,
    })
  } catch (err) {
    console.error("[join/register] error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
