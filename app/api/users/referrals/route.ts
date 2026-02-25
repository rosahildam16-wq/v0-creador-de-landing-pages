import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim()

  if (!username) {
    return NextResponse.json({ referrals: [] })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("community_members")
    .select("name, email, username, community_id, activo, created_at")
    .eq("sponsor_username", username)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ referrals: [] })
  }

  return NextResponse.json({ referrals: data || [] })
}
