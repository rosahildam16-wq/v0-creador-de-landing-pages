import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const SUPER_ADMIN_EMAIL = "iajorgeleon21@gmail.com"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminEmail = searchParams.get("email")

    if (adminEmail !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: users, error } = await supabase
      .from("community_members")
      .select("id, member_id, name, username, email, password_plain, password_hash, role, community_id, sponsor_username, activo, trial_ends_at, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // For each user, show password_plain if available, otherwise password_hash (which may be plain text for older users)
    const usersWithPasswords = (users || []).map((u) => ({
      id: u.id,
      memberId: u.member_id,
      name: u.name,
      username: u.username,
      email: u.email,
      password: u.password_plain || u.password_hash || "N/A",
      role: u.role,
      communityId: u.community_id,
      sponsorUsername: u.sponsor_username,
      activo: u.activo,
      trialEndsAt: u.trial_ends_at,
      createdAt: u.created_at,
    }))

    return NextResponse.json({ users: usersWithPasswords })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
