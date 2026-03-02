import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/mailing/trigger-sequence
 * Called internally when a lead triggers a sequence condition.
 * Enrolls the lead into all matching active sequences.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { trigger_type, trigger_value, lead_id, lead_email, lead_nombre, community_id } = body

        if (!trigger_type || !lead_id || !lead_email) {
            return NextResponse.json({ error: "trigger_type, lead_id, lead_email required" }, { status: 400 })
        }

        // Find all active sequences matching this trigger
        let query = supabase
            .from("email_sequences")
            .select("*, email_sequence_steps(*)")
            .eq("estado", "activa")
            .eq("trigger_type", trigger_type)

        // If trigger has a value (e.g. specific funnel or tag), filter by it
        if (trigger_value) {
            query = query.eq("trigger_value", trigger_value)
        }

        if (community_id) {
            query = query.or(`community_id.eq.${community_id},community_id.eq.general`)
        }

        const { data: sequences, error: seqErr } = await query

        if (seqErr) {
            if (seqErr.code === "42P01") return NextResponse.json({ enrolled: 0, message: "Table not found" })
            throw seqErr
        }

        if (!sequences || sequences.length === 0) {
            return NextResponse.json({ enrolled: 0, message: "No matching sequences" })
        }

        let enrolled = 0

        for (const sequence of sequences) {
            // Check if already enrolled
            const { data: existing } = await supabase
                .from("sequence_enrollments")
                .select("id")
                .eq("sequence_id", sequence.id)
                .eq("lead_id", lead_id)
                .eq("estado", "activo")
                .maybeSingle()

            if (existing) continue // Skip if already enrolled

            // Sort steps by step_order
            const steps = (sequence.email_sequence_steps || []).sort(
                (a: any, b: any) => a.step_order - b.step_order
            )

            if (steps.length === 0) continue

            // Calculate next_send_at for the first step
            const firstStep = steps[0]
            const delayMs = (firstStep.delay_days * 24 * 60 * 60 * 1000) + (firstStep.delay_hours * 60 * 60 * 1000)
            const nextSendAt = new Date(Date.now() + delayMs).toISOString()

            // Enroll lead
            const { error: enrollErr } = await supabase
                .from("sequence_enrollments")
                .insert({
                    sequence_id: sequence.id,
                    lead_id,
                    lead_email,
                    lead_nombre: lead_nombre || lead_email,
                    estado: "activo",
                    current_step: 0,
                    next_send_at: nextSendAt,
                    started_at: new Date().toISOString(),
                })

            if (enrollErr) {
                console.error("Enrollment error:", enrollErr)
                continue
            }

            enrolled++
        }

        return NextResponse.json({ success: true, enrolled, sequences_checked: sequences.length })
    } catch (err: any) {
        console.error("trigger-sequence error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
