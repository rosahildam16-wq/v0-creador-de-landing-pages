import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim()

  if (!username || username.length < 3) {
    return NextResponse.json({ exists: false })
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from("community_members")
    .select("name, username")
    .eq("username", username)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({ exists: true, name: data.name, username: data.username })
}
