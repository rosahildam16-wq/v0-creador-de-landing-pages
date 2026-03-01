import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get("username")

    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No storage" }, { status: 500 })

    const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .eq("owner_username", username)
        .order("order_index", { ascending: true })

    if (error) {
        // Fallback for table not existence
        if (error.code === '42P01') {
            return NextResponse.json([])
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
}

export async function POST(req: Request) {
    const body = await req.json()
    const { username, label, color, order_index } = body

    if (!username || !label) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No storage" }, { status: 500 })

    const { data, error } = await supabase
        .from("pipeline_stages")
        .upsert({ owner_username: username, label, color, order_index }, { onConflict: "owner_username,label" })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No storage" }, { status: 500 })

    const { error } = await supabase.from("pipeline_stages").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
