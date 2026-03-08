import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ community: null, members: [], stats: {} })
  }

  const supabase = createAdminClient()
  if (!supabase) return NextResponse.json({ community: null, members: [], stats: {} })

  const normalized = email.toLowerCase().trim()

  // Find the member record to get communityId and role
  const { data: member } = await supabase
    .from("community_members")
    .select("*")
    .eq("email", normalized)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ community: null, members: [], stats: {} })
  }

  // Find the community
  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("id", member.community_id)
    .maybeSingle()

  // Get all members of this community
  const { data: members } = await supabase
    .from("community_members")
    .select("member_id, name, email, username, sponsor_username, role, activo, created_at, trial_ends_at, discount_code")
    .eq("community_id", member.community_id)
    .order("created_at", { ascending: false })

  const allMembers = members || []
  const now = new Date()

  const totalMembers = allMembers.length
  const activeMembers = allMembers.filter((m) => m.activo).length
  const inTrial = allMembers.filter((m) => m.trial_ends_at && new Date(m.trial_ends_at) > now).length
  const thisWeek = allMembers.filter((m) => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(m.created_at) >= weekAgo
  }).length

  // Referrals of this leader
  const { data: directReferrals } = await supabase
    .from("community_members")
    .select("member_id, name, email, username, activo, created_at, trial_ends_at")
    .eq("sponsor_username", member.username)
    .order("created_at", { ascending: false })

  return NextResponse.json({
    community: community || {
      id: member.community_id,
      nombre: `Comunidad de ${member.name}`,
      color: "#8b5cf6",
      codigo: null,
      cuota_miembro: 27,
      activa: true,
    },
    member,
    members: allMembers.slice(0, 20),
    directReferrals: directReferrals || [],
    stats: {
      totalMembers,
      activeMembers,
      inTrial,
      thisWeek,
      mrr: activeMembers * (community?.cuota_miembro || 27),
    },
  })
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre, color, free_trial_days, settings } = body

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

    // Find the member's community and verify role
    const { data: member } = await supabase
      .from("community_members")
      .select("community_id, role")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Only leaders (or owner) can edit the community
    if (member.role !== "leader" && member.role !== "owner") {
      return NextResponse.json(
        { error: "Se requiere rol leader para editar la comunidad" },
        { status: 403 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (nombre) updates.nombre = nombre
    if (color) updates.color = color
    if (free_trial_days !== undefined) updates.free_trial_days = parseInt(free_trial_days)
    if (settings) updates.settings = settings

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("communities")
        .update(updates)
        .eq("id", member.community_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST (create community) ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre, codigo, descripcion, color } = body

    if (!email || !nombre || !codigo) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCodigo = codigo.trim().toUpperCase()

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

    const { data: member } = await supabase
      .from("community_members")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 403 })
    }

    const { data: existingComm } = await supabase
      .from("communities")
      .select("id")
      .eq("codigo", normalizedCodigo)
      .maybeSingle()

    if (existingComm) {
      return NextResponse.json({ error: "Este codigo de comunidad ya esta en uso" }, { status: 409 })
    }

    const communityId = `comm-${member.username || member.id}`
    const { error: commError } = await supabase.from("communities").insert({
      id: communityId,
      nombre,
      codigo: normalizedCodigo,
      descripcion: descripcion || `Comunidad de ${member.name}`,
      color: color || "#8b5cf6",
      leader_email: normalizedEmail,
      leader_name: member.name,
      owner_username: member.username,
      activa: true,
      cuota_miembro: 17,
    })

    if (commError) {
      return NextResponse.json({ error: commError.message }, { status: 500 })
    }

    await supabase
      .from("community_members")
      .update({ community_id: communityId, discount_code: normalizedCodigo })
      .eq("id", member.id)

    return NextResponse.json({ success: true, communityId })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
