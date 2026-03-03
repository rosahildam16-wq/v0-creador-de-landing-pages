import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"
import { TEAM_MEMBERS } from "@/lib/team-data"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, username, discountCode, sponsorUsername } = body as {
      name: string
      email: string
      password: string
      username: string
      discountCode?: string
      sponsorUsername?: string
    }

    const normalizedEmail = email.toLowerCase().trim()
    const trimmedName = name.trim()
    const normalizedUsername = (username || "").toLowerCase().trim()
    const code = (discountCode || "").trim().toUpperCase()
    const normalizedSponsor = (sponsorUsername || "").toLowerCase().trim()

    // Validations
    if (!trimmedName || !normalizedEmail || !password || password.length < 6) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
    }

    if (!normalizedUsername || normalizedUsername.length < 3 || !/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json({ error: "Username invalido (min. 3 caracteres, letras, numeros y _)." }, { status: 400 })
    }

    if (!normalizedSponsor) {
      return NextResponse.json({ error: "Se requiere un patrocinador para registrarse en Skalia VIP." }, { status: 403 })
    }

    const supabase = await createClient()

    // Check duplicate email
    const { data: existingEmail } = await supabase
      .from("community_members")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existingEmail) {
      return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 409 })
    }

    // Check duplicate username
    const { data: existingUsername } = await supabase
      .from("community_members")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json({ error: "Este nombre de usuario ya esta en uso" }, { status: 409 })
    }

    // Validate sponsor exists and find their community
    let sponsorData = null
    if (normalizedSponsor) {
      const { data: dbSponsor } = await supabase
        .from("community_members")
        .select("id, name, community_id, username")
        .eq("username", normalizedSponsor)
        .maybeSingle()

      if (dbSponsor) {
        sponsorData = dbSponsor
      } else {
        // Check static team members
        const staticSponsor = TEAM_MEMBERS.find(m => m.id.toLowerCase() === normalizedSponsor || m.email.toLowerCase() === normalizedSponsor)
        if (staticSponsor) {
          sponsorData = {
            id: staticSponsor.id,
            name: staticSponsor.nombre,
            username: staticSponsor.id,
            community_id: "general"
          }
        }
      }

      if (!sponsorData) {
        return NextResponse.json({ error: "El nombre de usuario del patrocinador no es valido." }, { status: 404 })
      }
    }

    // Role is always member now
    const userRole = "member"

    // Find community (for members) or create one (for leaders)
    let communityId = "general"
    let communityName = "General"
    let freeTrialDays = 5 // default 5 day trial for everyone

    // 1. If we have a code, try to find community by code
    if (code) {
      const { data: commByCode } = await supabase
        .from("communities")
        .select("id, nombre, free_trial_days")
        .eq("codigo", code)
        .maybeSingle()

      if (commByCode) {
        communityId = commByCode.id
        communityName = commByCode.nombre
        freeTrialDays = commByCode.free_trial_days || 5
      }
    }
    // 2. Otherwise use sponsor's community if available
    else if (sponsorData?.community_id) {
      communityId = sponsorData.community_id
      const { data: comm } = await supabase
        .from("communities")
        .select("nombre, free_trial_days")
        .eq("id", communityId)
        .maybeSingle()
      if (comm) {
        communityName = comm.nombre
        freeTrialDays = comm.free_trial_days || 5
      }
    }

    // Insert member
    const memberId = `reg-${normalizedUsername}`

    // Calculate trial end date
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + freeTrialDays)
    const trialEndsAt = trialEnd.toISOString()

    const { error: insertError } = await supabase.from("community_members").insert({
      member_id: memberId,
      community_id: communityId,
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
      activo: true, // AUTO-ACTIVATE: Remove need for leader validation
    })

    if (insertError) {
      console.error("Insert member error:", insertError)
      return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
    }

    // Create trial subscription in subscriptions table so SubscriptionGuard works
    try {
      const adminSupabase = createAdminClient()
      if (adminSupabase) {
        // Get the cheapest active plan (Basico)
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
      // Non-blocking: user is still registered
    }

    // Create notification for admin
    const codeLabel = code ? ` | Codigo: ${code}` : ""
    const sponsorLabel = normalizedSponsor ? ` | Patrocinador: @${normalizedSponsor}` : ""
    await supabase.from("admin_notifications").insert({
      tipo: "team",
      titulo: `Nuevo registro`,
      mensaje: `${trimmedName} (@${normalizedUsername}) se registro como miembro en ${communityName}${codeLabel}${sponsorLabel}.`,
      destinatario: "admin",
    })

    // Create notification for sponsor
    if (sponsorData) {
      await supabase.from("admin_notifications").insert({
        tipo: "team",
        titulo: `¡Nuevo socio en tu equipo!`,
        mensaje: `${trimmedName} (@${normalizedUsername}) se ha unido a tu red.`,
        destinatario: sponsorData.username,
      })
    }

    // Send Welcome Email (non-blocking)
    const isSkalia = code === "DIAMANTECELION"
    sendWelcomeEmail({
      email: normalizedEmail,
      name: trimmedName,
      communityCode: isSkalia ? "DIAMANTECELION" : (code || normalizedUsername.toUpperCase()),
    }).catch(e => console.error("Async email error:", e))

    const welcomeCode = isSkalia ? "DIAMANTECELION" : (code || normalizedUsername.toUpperCase())

    return NextResponse.json({
      success: true,
      memberId,
      username: normalizedUsername,
      communityId,
      communityName,
      communityCode: welcomeCode,
      role: userRole,
      trialEndsAt,
      freeTrialDays,
    })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
