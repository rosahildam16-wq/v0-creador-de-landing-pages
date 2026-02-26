import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || "sensei"

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No connection" }, { status: 500 })

    console.log("Checking user:", query)

    // Try email or username
    const { data: user, error: userErr } = await supabase
        .from("community_members")
        .select("*")
        .or(`username.eq."${query}",email.eq."${query}"`)
        .maybeSingle()

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Check subscription
    const { data: sub, error: subErr } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_email", user.email)
        .maybeSingle()

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            activo: user.activo,
            role: user.role,
            trial_ends_at: user.trial_ends_at,
            community_id: user.community_id,
            created_at: user.created_at,
            password_plain: user.password_plain // for debugging
        },
        subscription: sub
    })
}
