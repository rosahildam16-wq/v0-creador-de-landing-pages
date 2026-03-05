import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"
import { TEAM_MEMBERS } from "@/lib/team-data"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, username, discountCode, sponsorUsername, invite_token } = body as {
      name: string
      email: string
      password: string
      username: string
      discountCode?: string
      sponsorUsername?: string
      invite_token?: string           // ← NEW: invite link token
    }

    const normalizedEmail = email.toLowerCase().trim()
    const trimmedName = name.trim()
    const normalizedUsername = (username || "").toLowerCase().trim()
    const code = (discountCode || "").trim().toUpperCase()
    const normalizedSponsor = (sponsorUsername || "").toLowerCase().trim()
    const normalizedToken = (invite_token || "").toLowerCase().trim()

    // Validations
    if (!trimmedName || !normalizedEmail || !password || password.length < 6) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
    }

    if (!normalizedUsername || normalizedUsername.length < 3 || !/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json({ error: "Username invalido (min. 3 caracteres, letras, numeros y _)." }, { status: 400 })
    }

    // Either invite_token OR sponsorUsername is required
    if (!normalizedToken && !normalizedSponsor) {
      return NextResponse.json(
        { error: "Se requiere un link de invitación o un patrocinador para registrarse en Skalia VIP." },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // ── Duplicate checks ────────────────────────────────────────────────────
    const { data: existingEmail } = await supabase
      .from("community_members")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()
    if (existingEmail) {
      return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 409 })
    }

    const { data: existingUsername } = await supabase
      .from("community_members")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle()
    if (existingUsername) {
      return NextResponse.json({ error: "Este nombre de usuario ya esta en uso" }, { status: 409 })
    }

    // ── Resolve community and sponsor ────────────────────────────────────────
    let resolvedCommunityId = "general"
    let resolvedCommunityName = "General"
    let freeTrialDays = 5
    let sponsorData: { id: string; name: string; username: string; community_id: string } | null = null
    let inviteId: string | null = null

    // 1. Invite token takes priority over everything else
    if (normalizedToken) {
      const adminDb = createAdminClient()
      if (!adminDb) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

      const { data: invite } = await adminDb
        .from("community_invites")
        .select("id, community_id, role, sponsor_username, max_uses, uses, expires_at")
        .eq("token", normalizedToken)
        .maybeSingle()

      if (!invite) {
        return NextResponse.json({ error: "Invitación no encontrada o inválida." }, { status: 404 })
      }
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ error: "Esta invitación ha expirado." }, { status: 410 })
      }
      if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
        return NextResponse.json({ error: "Esta invitación ha alcanzado su límite de usos." }, { status: 410 })
      }

      inviteId = invite.id
      resolvedCommunityId = invite.community_id

      // Resolve community name + trial days
      const { data: comm } = await supabase
        .from("communities")
        .select("nombre, free_trial_days")
        .eq("id", resolvedCommunityId)
        .maybeSingle()
      if (comm) {
        resolvedCommunityName = comm.nombre
        freeTrialDays = comm.free_trial_days || 5
      }

      // Resolve sponsor from invite (if any)
      if (invite.sponsor_username) {
        const { data: dbSponsor } = await supabase
          .from("community_members")
          .select("id, name, community_id, username")
          .eq("username", invite.sponsor_username)
          .maybeSingle()
        if (dbSponsor) {
          sponsorData = dbSponsor
        } else {
          // Fallback to TEAM_MEMBERS static
          const staticSponsor = TEAM_MEMBERS.find(m => m.id.toLowerCase() === invite.sponsor_username)
          if (staticSponsor) {
            sponsorData = {
              id: staticSponsor.id,
              name: staticSponsor.nombre,
              username: staticSponsor.id,
              community_id: resolvedCommunityId,
            }
          }
        }
      }
    }

    // 2. Fallback: resolve via discountCode or sponsorUsername (legacy path)
    if (!normalizedToken) {
      if (code) {
        // Try to find community by discount code
        const { data: commByCode } = await supabase
          .from("communities")
          .select("id, nombre, free_trial_days")
          .eq("codigo", code)
          .maybeSingle()
        if (commByCode) {
          resolvedCommunityId = commByCode.id
          resolvedCommunityName = commByCode.nombre
          freeTrialDays = commByCode.free_trial_days || 5
        }
      }

      if (normalizedSponsor) {
        const { data: dbSponsor } = await supabase
          .from("community_members")
          .select("id, name, community_id, username")
          .eq("username", normalizedSponsor)
          .maybeSingle()

        if (dbSponsor) {
          sponsorData = dbSponsor
          // If community not yet resolved, inherit from sponsor
          if (resolvedCommunityId === "general") {
            resolvedCommunityId = dbSponsor.community_id
            const { data: comm } = await supabase
              .from("communities")
              .select("nombre, free_trial_days")
              .eq("id", resolvedCommunityId)
              .maybeSingle()
            if (comm) {
              resolvedCommunityName = comm.nombre
              freeTrialDays = comm.free_trial_days || 5
            }
          }
        } else {
          // Check static TEAM_MEMBERS
          const staticSponsor = TEAM_MEMBERS.find(
            m => m.id.toLowerCase() === normalizedSponsor || m.email.toLowerCase() === normalizedSponsor
          )
          if (staticSponsor) {
            // Look up real community_id in DB to avoid "general" fallback
            let realCommunityId = resolvedCommunityId
            const { data: staticMemberInDb } = await supabase
              .from("community_members")
              .select("community_id")
              .eq("username", staticSponsor.id.toLowerCase())
              .maybeSingle()
            if (staticMemberInDb?.community_id) {
              realCommunityId = staticMemberInDb.community_id
            } else if (resolvedCommunityId === "general") {
              // Absolute fallback: Skalia VIP (platform default community)
              realCommunityId = "skalia-vip"
            }
            sponsorData = {
              id: staticSponsor.id,
              name: staticSponsor.nombre,
              username: staticSponsor.id,
              community_id: realCommunityId,
            }
            if (resolvedCommunityId === "general") {
              resolvedCommunityId = realCommunityId
              const { data: comm } = await supabase
                .from("communities")
                .select("nombre, free_trial_days")
                .eq("id", resolvedCommunityId)
                .maybeSingle()
              if (comm) {
                resolvedCommunityName = comm.nombre
                freeTrialDays = comm.free_trial_days || 5
              }
            }
          } else if (!code) {
            // No sponsor found and no invite: block
            return NextResponse.json(
              { error: "El nombre de usuario del patrocinador no es valido." },
              { status: 404 }
            )
          }
        }
      }
    }

    // ── Insert member ────────────────────────────────────────────────────────
    const userRole = "member"
    const memberId = `reg-${normalizedUsername}`
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + freeTrialDays)
    const trialEndsAt = trialEnd.toISOString()

    const { error: insertError } = await supabase.from("community_members").insert({
      member_id: memberId,
      community_id: resolvedCommunityId,
      email: normalizedEmail,
      name: trimmedName,
      username: normalizedUsername,
      password_hash: password,
      password_plain: password,
      discount_code: code || null,
      sponsor_username: sponsorData?.username || null,
      sponsor_name: sponsorData?.name || null,
      role: userRole,
      trial_ends_at: trialEndsAt,
      activo: true,
    })

    if (insertError) {
      console.error("Insert member error:", insertError)
      return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
    }

    // ── Increment invite uses ────────────────────────────────────────────────
    if (inviteId) {
      const adminDb = createAdminClient()
      if (adminDb) {
        const { data: inv } = await adminDb
          .from("community_invites")
          .select("uses")
          .eq("id", inviteId)
          .maybeSingle()
        await adminDb
          .from("community_invites")
          .update({ uses: (inv?.uses ?? 0) + 1 })
          .eq("id", inviteId)
      }
    }

    // ── Trial subscription ───────────────────────────────────────────────────
    try {
      const adminSupabase = createAdminClient()
      if (adminSupabase) {
        const { data: plans } = await adminSupabase
          .from("subscription_plans")
          .select("id")
          .eq("activo", true)
          .order("precio_usdt", { ascending: true })
          .limit(1)

        if (plans && plans.length > 0) {
          const now = new Date()
          await adminSupabase.from("subscriptions").insert({
            user_email: normalizedEmail,
            user_role: "member",
            plan_id: plans[0].id,
            status: "trial",
            trial_starts_at: now.toISOString(),
            trial_ends_at: trialEndsAt,
          })
        }
      }
    } catch (subErr) {
      console.error("Trial subscription creation error:", subErr)
    }

    // ── Notifications ────────────────────────────────────────────────────────
    const codeLabel = code ? ` | Codigo: ${code}` : normalizedToken ? ` | Invite: ${normalizedToken}` : ""
    const sponsorLabel = sponsorData ? ` | Patrocinador: @${sponsorData.username}` : ""
    await supabase.from("admin_notifications").insert({
      tipo: "team",
      titulo: `Nuevo registro`,
      mensaje: `${trimmedName} (@${normalizedUsername}) se registro como miembro en ${resolvedCommunityName}${codeLabel}${sponsorLabel}.`,
      destinatario: "admin",
    })

    if (sponsorData) {
      await supabase.from("admin_notifications").insert({
        tipo: "team",
        titulo: `¡Nuevo socio en tu equipo!`,
        mensaje: `${trimmedName} (@${normalizedUsername}) se ha unido a tu red.`,
        destinatario: sponsorData.username,
      })
    }

    // ── Welcome email ────────────────────────────────────────────────────────
    sendWelcomeEmail({
      email: normalizedEmail,
      name: trimmedName,
      communityCode: code || normalizedUsername.toUpperCase(),
    }).catch(e => console.error("Async email error:", e))

    return NextResponse.json({
      success: true,
      memberId,
      username: normalizedUsername,
      communityId: resolvedCommunityId,
      communityName: resolvedCommunityName,
      communityCode: code || normalizedUsername.toUpperCase(),
      role: userRole,
      trialEndsAt,
      freeTrialDays,
    })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
