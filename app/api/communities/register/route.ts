import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, discountCode } = body as {
      name: string
      email: string
      password: string
      discountCode?: string
    }

    const normalizedEmail = email.toLowerCase().trim()
    const trimmedName = name.trim()
    const code = (discountCode || "").trim().toUpperCase()

    if (!trimmedName || !normalizedEmail || !password || password.length < 6) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 })
    }

    // Block super admin email
    if (normalizedEmail === "iajorgeleon21@gmail.com") {
      return NextResponse.json({ error: "Email no permitido" }, { status: 403 })
    }

    const supabase = await createClient()

    // Check if email is already registered
    const { data: existing } = await supabase
      .from("community_members")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 409 })
    }

    // Find community by code
    let communityId = "general"
    let communityName = "General"
    if (code) {
      const { data: comm } = await supabase
        .from("communities")
        .select("id, nombre")
        .eq("codigo", code)
        .eq("activa", true)
        .maybeSingle()

      if (comm) {
        communityId = comm.id
        communityName = comm.nombre
      }
    }

    // Insert member into community_members
    const memberId = `reg-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`
    const { error: insertError } = await supabase.from("community_members").insert({
      member_id: memberId,
      community_id: communityId,
      email: normalizedEmail,
      name: trimmedName,
      password_hash: password, // In production, hash with bcrypt
      discount_code: code || null,
    })

    if (insertError) {
      console.error("Insert member error:", insertError)
      return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
    }

    // Create notification for admin
    const codeLabel = code ? ` | Codigo: ${code}` : ""
    await supabase.from("admin_notifications").insert({
      tipo: "team",
      titulo: "Nuevo registro de miembro",
      mensaje: `${trimmedName} (${normalizedEmail}) se unio a la comunidad ${communityName}${codeLabel}. Ve a Comunidades para gestionar su acceso.`,
      destinatario: "admin",
    })

    return NextResponse.json({
      success: true,
      memberId,
      communityId,
      communityName,
    })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
