import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || null

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No connection" }, { status: 500 })

    let q = supabase
        .from("leads")
        .select("*")
        .order("fecha_ingreso", { ascending: false })
        .limit(10)

    if (query) {
        q = q.or(`asignado_a.eq."${query}",email.eq."${query}"`)
    }

    const { data: leads, error } = await q

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
        leads,
        count: leads?.length || 0,
        timestamp: new Date().toISOString()
    })
}
