import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body as { email: string; password: string }

    if (!email || !password) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const supabase = await createClient()

    // Use safe .eq() calls to avoid SQL injection via string interpolation in .or()
    // Step 1: Find member by email, then by username if not found
    let memberQuery = await supabase
      .from("community_members")
      .select("member_id, name, username, community_id, role, password_hash, password_plain")
      .eq("email", normalizedEmail)
      .maybeSingle()

    let memberRow = memberQuery.data

    if (!memberRow) {
      const byUsername = await supabase
        .from("community_members")
        .select("member_id, name, username, community_id, role, password_hash, password_plain")
        .eq("username", normalizedEmail)
        .maybeSingle()
      memberRow = byUsername.data
    }

    // Step 2: Validate password in application code (not in DB filter)
    if (
      !memberRow ||
      (memberRow.password_hash !== password && memberRow.password_plain !== password)
    ) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    // Strip password fields before using member data
    const { password_hash: _ph, password_plain: _pp, ...member } = memberRow

    if (!member) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const userData = {
      memberId: member.member_id,
      name: member.name,
      username: member.username,
      communityId: member.community_id,
      role: member.role || "member",
      email: normalizedEmail
    }

    // Shield Phase 2: Create secure session cookie
    const { createSession } = await import("@/lib/auth/session")
    await createSession(userData)

    return NextResponse.json({
      success: true,
      ...userData
    })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
