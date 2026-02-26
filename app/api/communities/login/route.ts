import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body as { email: string; password: string }

    const normalizedEmail = email.toLowerCase().trim()

    const supabase = await createClient()

    const { data: member } = await supabase
      .from("community_members")
      .select("member_id, name, username, community_id, role")
      .or(`email.eq."${normalizedEmail}",username.eq."${normalizedEmail}"`)
      .or(`password_hash.eq."${password}",password_plain.eq."${password}"`)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      memberId: member.member_id,
      name: member.name,
      username: member.username,
      communityId: member.community_id,
      role: member.role || "member",
    })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
