import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"

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
    const normalizedSponsor = (sponsorUsername || "").toLowerCase().trim() || null

    // Validations
    if (!trimmedName || !normalizedEmail || !password || password.length < 6) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
    }

    if (!normalizedUsername || normalizedUsername.length < 3 || !/^[a-z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json({ error: "Username invalido. Minimo 3 caracteres, solo letras, numeros y guion bajo." }, { status: 400 })
    }

    // Block super admin email
    if (normalizedEmail === "iajorgeleon21@gmail.com") {
      return NextResponse.json({ error: "Email no permitido" }, { status: 403 })
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

    // Validate sponsor exists (if provided)
    let sponsorValid = false
    if (normalizedSponsor) {
      const { data: sponsor } = await supabase
        .from("community_members")
        .select("id")
        .eq("username", normalizedSponsor)
        .maybeSingle()
      sponsorValid = !!sponsor
    }

    // Determine role: with community code = member, without = leader
    const isLeader = !code
    const userRole = isLeader ? "leader" : "member"

    // Find community (for members) or create one (for leaders)
    let communityId = "general"
    let communityName = "General"
    let freeTrialDays = 5 // default 5 day trial for everyone

    if (isLeader) {
      // Leader: create their own community automatically
      const communityCode = normalizedUsername.toUpperCase()
      const newCommunityId = `comm-${normalizedUsername}`

      const { error: commError } = await supabase.from("communities").insert({
        id: newCommunityId,
        nombre: `${trimmedName}`,
        descripcion: `Comunidad de ${trimmedName}`,
        codigo: communityCode,
        color: "#8b5cf6",
        leader_name: trimmedName,
        leader_email: normalizedEmail,
        owner_username: normalizedUsername,
        activa: true,
        cuota_miembro: 27.00,
        free_trial_days: 5,
      })

      if (commError) {
        console.error("Create community error:", commError)
        // Fallback: if community creation fails, assign to general
      } else {
        communityId = newCommunityId
        communityName = trimmedName
      }
    } else {
      // Member with community code
      const { data: comm } = await supabase
        .from("communities")
        .select("id, nombre, free_trial_days")
        .eq("codigo", code)
        .eq("activa", true)
        .maybeSingle()

      if (comm) {
        communityId = comm.id
        communityName = comm.nombre
        // Use community config or default 5
        freeTrialDays = comm.free_trial_days && comm.free_trial_days > 0
          ? comm.free_trial_days
          : 5
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
      sponsor_username: sponsorValid ? normalizedSponsor : null,
      sponsor_name: normalizedSponsor || null, // keep for backwards compat
      role: userRole,
      trial_ends_at: trialEndsAt,
    })

    if (insertError) {
      console.error("Insert member error:", insertError)
      return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
    }

    // Create trial subscription in subscriptions table so SubscriptionGuard works
    try {
      const adminSupabase = createAdminClient()

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
          user_role: isLeader ? "admin" : "member",
          plan_id: plans[0].id,
          status: "trial",
          trial_starts_at: now.toISOString(),
          trial_ends_at: trialEndsAt,
        })
      }
    } catch (subErr) {
      console.error("Trial subscription creation error:", subErr)
      // Non-blocking: user is still registered
    }

    // Create notification for admin
    const codeLabel = code ? ` | Codigo: ${code}` : ""
    const sponsorLabel = normalizedSponsor ? ` | Patrocinador: @${normalizedSponsor}` : ""
    const roleLabel = isLeader ? " [LIDER]" : ""
    await supabase.from("admin_notifications").insert({
      tipo: "team",
      titulo: `Nuevo registro${roleLabel}`,
      mensaje: `${trimmedName} (@${normalizedUsername}) se registro como ${isLeader ? "lider" : "miembro"} en ${communityName}${codeLabel}${sponsorLabel}.`,
      destinatario: "admin",
    })

    // Send Welcome Email (non-blocking)
    const welcomeCode = isLeader ? normalizedUsername.toUpperCase() : code
    sendWelcomeEmail({
      email: normalizedEmail,
      name: trimmedName,
      communityCode: welcomeCode || "GENERAL",
    }).catch(e => console.error("Async email error:", e))

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
