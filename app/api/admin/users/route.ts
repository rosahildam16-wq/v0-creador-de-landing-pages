import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "iajorgeleon21@gmail.com"

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { adminEmail, userData } = body

    if (adminEmail !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Simplified creation (similar to register route)
    const { error } = await supabase.from("community_members").insert({
      member_id: `reg-${userData.username.toLowerCase()}`,
      community_id: userData.communityId || "general",
      email: userData.email,
      name: userData.name,
      username: userData.username.toLowerCase(),
      password_hash: userData.password,
      password_plain: userData.password,
      role: userData.role || "member",
      trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminEmail = searchParams.get("email")
    const userId = searchParams.get("id")

    if (adminEmail !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    if (!userId) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const supabase = createAdminClient()

    // Find user first to get username/email for cleanup
    const { data: user } = await supabase.from("community_members").select("username, email").eq("id", userId).single()

    if (user) {
      // Cleanup related data
      await supabase.from("communities").delete().eq("owner_username", user.username)
      await supabase.from("subscriptions").delete().eq("user_email", user.email)
    }

    const { error } = await supabase.from("community_members").delete().eq("id", userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
