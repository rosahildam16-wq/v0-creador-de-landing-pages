import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim()

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, error: "Minimo 3 caracteres" })
  }

  // Only allow letters, numbers, underscores
  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, error: "Solo letras, numeros y guion bajo" })
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from("community_members")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
