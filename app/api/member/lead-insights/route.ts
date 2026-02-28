import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get("leadId")

    if (!leadId) return NextResponse.json({ error: "Lead ID required" }, { status: 400 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "No storage" }, { status: 500 })

    const { data, error } = await supabase
        .from("lead_insights")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || { score: 0 })
}
