import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Get tags for a lead
export async function GET(req: NextRequest) {
    const leadId = req.nextUrl.searchParams.get("leadId")
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 })

    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ tags: [] })

        const { data, error } = await supabase
            .from("leads")
            .select("tags")
            .eq("id", leadId)
            .single()

        if (error) throw error
        return NextResponse.json({ tags: data?.tags || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST - Add a tag to a lead
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const { leadId, tag } = await req.json()
        if (!leadId || !tag) return NextResponse.json({ error: "leadId and tag required" }, { status: 400 })

        // Get current tags
        const { data: lead, error: fetchErr } = await supabase
            .from("leads")
            .select("tags, email, nombre")
            .eq("id", leadId)
            .single()

        if (fetchErr) throw fetchErr

        const currentTags: string[] = lead?.tags || []
        if (currentTags.includes(tag)) {
            return NextResponse.json({ success: true, tags: currentTags, message: "Tag already exists" })
        }

        const newTags = [...currentTags, tag]

        // Update lead tags
        const { error: updateErr } = await supabase
            .from("leads")
            .update({ tags: newTags })
            .eq("id", leadId)

        if (updateErr) throw updateErr

        // Trigger sequences with tag_added trigger
        try {
            await fetch(`${req.nextUrl.origin}/api/mailing/trigger-sequence`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trigger_type: "tag_added",
                    trigger_value: tag,
                    lead_id: leadId,
                    lead_email: lead.email,
                    lead_nombre: lead.nombre
                })
            })
        } catch (triggerErr) {
            console.warn("Sequence trigger failed (non-fatal):", triggerErr)
        }

        return NextResponse.json({ success: true, tags: newTags })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE - Remove a tag from a lead
export async function DELETE(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const { leadId, tag } = await req.json()
        if (!leadId || !tag) return NextResponse.json({ error: "leadId and tag required" }, { status: 400 })

        const { data: lead, error: fetchErr } = await supabase
            .from("leads")
            .select("tags")
            .eq("id", leadId)
            .single()

        if (fetchErr) throw fetchErr

        const newTags = (lead?.tags || []).filter((t: string) => t !== tag)

        const { error: updateErr } = await supabase
            .from("leads")
            .update({ tags: newTags })
            .eq("id", leadId)

        if (updateErr) throw updateErr

        return NextResponse.json({ success: true, tags: newTags })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
