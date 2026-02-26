import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No connection" }, { status: 500 })

    const { data: leads, error } = await supabase
        .from("leads")
        .select("id, nombre, email, community_id, asignado_a, fecha_ingreso")
        .order("fecha_ingreso", { ascending: false })
        .limit(5)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ leads })
}
