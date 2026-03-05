import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/invites/[token]
// Validates an invite link and returns the associated community + sponsor info.
// Called by the registration form before submitting, so the UI can pre-fill
// community and sponsor fields and confirm the invite is still valid.

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  if (!token || token.length < 3) {
    return NextResponse.json({ valid: false, error: "Token inválido" }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ valid: false, error: "DB no disponible" }, { status: 500 })
  }

  // 1. Fetch the invite row
  const { data: invite, error } = await supabase
    .from("community_invites")
    .select("id, token, community_id, role, sponsor_username, max_uses, uses, expires_at")
    .eq("token", token.toLowerCase().trim())
    .maybeSingle()

  if (error) {
    console.error("[invites] DB error:", error.message)
    return NextResponse.json({ valid: false, error: "Error al verificar invitación" }, { status: 500 })
  }

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invitación no encontrada" }, { status: 404 })
  }

  // 2. Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Esta invitación ha expirado" }, { status: 410 })
  }

  // 3. Check usage cap
  if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
    return NextResponse.json({ valid: false, error: "Esta invitación ha alcanzado su límite de usos" }, { status: 410 })
  }

  // 4. Fetch community details
  const { data: community } = await supabase
    .from("communities")
    .select("id, nombre, color, descripcion, activa")
    .eq("id", invite.community_id)
    .maybeSingle()

  if (!community || !community.activa) {
    return NextResponse.json({ valid: false, error: "La comunidad ya no está activa" }, { status: 410 })
  }

  return NextResponse.json({
    valid: true,
    invite: {
      token: invite.token,
      community_id: invite.community_id,
      role: invite.role,
      sponsor_username: invite.sponsor_username,
      uses_remaining: invite.max_uses > 0 ? invite.max_uses - invite.uses : null,
    },
    community: {
      id: community.id,
      nombre: community.nombre,
      color: community.color,
    },
  })
}
