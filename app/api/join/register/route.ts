import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createSession } from "@/lib/auth/session"
import { registerReferral } from "@/lib/server/referrals"
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
      refUsername,   // referrer's username (from URL ?ref=)
    } = body as {
      name: string
      email: string
      password: string
      username: string
      communitySlug: string
      refUsername?: string
    }

    // ── Validate inputs ───────────────────────────────────────────────────────
    const normalizedEmail = (email ?? "").toLowerCase().trim()
    const trimmedName = (name ?? "").trim()
    const normalizedUsername = (username ?? "").toLowerCase().trim()
    const normalizedRef = (refUsername ?? "").toLowerCase().trim()
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

    if (!normalizedSlug) {
      return NextResponse.json({ error: "community_slug requerido" }, { status: 400 })
    }

    const db = createAdminClient()
    if (!db) {
      return NextResponse.json({ error: "Error de configuracion" }, { status: 500 })
    }

    // ── Check community exists ────────────────────────────────────────────────
    const { data: community } = await db
      .from("communities")
      .select("id, nombre, free_trial_days, default_trial_days, allow_trial, activa")
      .or(`slug.eq.${normalizedSlug},id.eq.${normalizedSlug}`)
      .maybeSingle()

    if (!community || !community.activa) {
      return NextResponse.json({ error: "Comunidad no encontrada o inactiva" }, { status: 404 })
    }

    const communityId = community.id
    const communityName = community.nombre
    const trialDays = community.default_trial_days ?? community.free_trial_days ?? 7

    // ── Check duplicates ──────────────────────────────────────────────────────
    const [{ data: existingEmail }, { data: existingUsername }] = await Promise.all([
      db.from("community_members").select("id").eq("email", normalizedEmail).maybeSingle(),
      db.from("community_members").select("id").eq("username", normalizedUsername).maybeSingle(),
    ])

    if (existingEmail) {
      return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 409 })
    }
    if (existingUsername) {
      return NextResponse.json({ error: "Este nombre de usuario ya esta en uso" }, { status: 409 })
    }

    // ── Resolve sponsor ───────────────────────────────────────────────────────
    let sponsorData: { id: string; name: string; username: string; community_id: string } | null = null
    if (normalizedRef) {
      const { data: dbSponsor } = await db
        .from("community_members")
        .select("member_id, name, username, community_id")
        .eq("username", normalizedRef)
        .maybeSingle()

      if (dbSponsor) {
        sponsorData = {
          id: dbSponsor.member_id,
          name: dbSponsor.name,
          username: dbSponsor.username,
          community_id: dbSponsor.community_id,
        }
      }
    }

    // ── Create member ─────────────────────────────────────────────────────────
    const memberId = `reg-${normalizedUsername}`
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + trialDays)
    const trialEndsAt = trialEnd.toISOString()

    const { error: insertError } = await db.from("community_members").insert({
      member_id: memberId,
      community_id: communityId,
      email: normalizedEmail,
      name: trimmedName,
      username: normalizedUsername,
      password_hash: password,
      password_plain: password,
      sponsor_username: sponsorData?.username ?? null,
      sponsor_name: sponsorData?.name ?? null,
      role: "member",
      trial_ends_at: trialEndsAt,
      activo: true,
    })

    if (insertError) {
      console.error("[join/register] insert member:", insertError)
      return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
    }

    // ── Create community_members record (also in community_memberships) ────────
    // The user is now registered in community_members.
    // Also create a community_memberships row so billing tracking works.
    await db.from("community_memberships").insert({
      community_id: communityId,
      user_id: memberId,
      status: "active",  // will be upgraded to trialing when they pick a paid plan
    }).then(({ error }) => {
      if (error && error.code !== "23505") {
        console.error("[join/register] community_memberships:", error)
      }
    })

    // ── Create platform subscription (student) ────────────────────────────────
    await db.from("user_platform_subscription").insert({
      user_id: memberId,
      platform_plan_code: "student",
      status: "active",
    }).then(({ error }) => {
      if (error && error.code !== "23505") {
        console.error("[join/register] user_platform_subscription:", error)
      }
    })

    // ── Register referral (immutable) ─────────────────────────────────────────
    if (sponsorData) {
      await registerReferral(memberId, sponsorData.id)
    }

    // ── Admin notification ────────────────────────────────────────────────────
    const sponsorLabel = sponsorData ? ` | Ref: @${sponsorData.username}` : ""
    await db.from("admin_notifications").insert({
      tipo: "team",
      titulo: "Nuevo registro via /join",
      mensaje: `${trimmedName} (@${normalizedUsername}) se registro en ${communityName}${sponsorLabel}.`,
      destinatario: "admin",
    })

    if (sponsorData) {
      await db.from("admin_notifications").insert({
        tipo: "team",
        titulo: "¡Nuevo referido en tu equipo!",
        mensaje: `${trimmedName} (@${normalizedUsername}) se unio a traves de tu enlace.`,
        destinatario: sponsorData.username,
      })
    }

    // ── Welcome email (non-blocking) ──────────────────────────────────────────
    sendWelcomeEmail({
      email: normalizedEmail,
      name: trimmedName,
      communityCode: normalizedUsername.toUpperCase(),
    }).catch((e) => console.error("[join/register] welcome email:", e))

    // ── Create session so user is logged in after registration ────────────────
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
      trialEndsAt,
    })
  } catch (err) {
    console.error("[join/register] error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
