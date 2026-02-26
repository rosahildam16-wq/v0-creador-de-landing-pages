import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || "sensei"

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No connection" }, { status: 500 })

    const { data: user, error: userErr } = await supabase
        .from("community_members")
        .select("*")
        .or(`username.eq."${query}",email.eq."${query}"`)
        .maybeSingle()

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({ user })
}
