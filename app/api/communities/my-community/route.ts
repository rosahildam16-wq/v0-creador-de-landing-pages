import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ community: null, members: [], stats: {} })
  }

  const normalized = email.toLowerCase().trim()

  // First find the member record to get communityId and role
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

  // Stats
  const totalMembers = allMembers.length
  const activeMembers = allMembers.filter((m) => m.activo).length
  const inTrial = allMembers.filter((m) => m.trial_ends_at && new Date(m.trial_ends_at) > now).length
  const thisWeek = allMembers.filter((m) => {
    const d = new Date(m.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  }).length

  // Referrals of this leader (people who listed this leader as sponsor)
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre, color, free_trial_days } = body

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    // Find the member's community
    const { data: member } = await supabase
      .from("community_members")
      .select("community_id, role")
      .eq("email", email.toLowerCase().trim())
      .eq("role", "leader")
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (nombre) updates.nombre = nombre
    if (color) updates.color = color
    if (free_trial_days !== undefined) updates.free_trial_days = parseInt(free_trial_days)

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre, codigo, descripcion, color } = body

    if (!email || !nombre || !codigo) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCodigo = codigo.trim().toUpperCase()

    // Find the member
    const { data: member } = await supabase
      .from("community_members")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (!member || member.role !== "leader") {
      return NextResponse.json({ error: "No tienes permisos de lider" }, { status: 403 })
    }

    // Check if code is taken
    const { data: existingComm } = await supabase
      .from("communities")
      .select("id")
      .eq("codigo", normalizedCodigo)
      .maybeSingle()

    if (existingComm) {
      return NextResponse.json({ error: "Este codigo de comunidad ya esta en uso" }, { status: 409 })
    }

    // Create community
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

    // Update member to point to this new community
    await supabase
      .from("community_members")
      .update({ community_id: communityId, discount_code: normalizedCodigo })
      .eq("id", member.id)

    return NextResponse.json({ success: true, communityId })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
