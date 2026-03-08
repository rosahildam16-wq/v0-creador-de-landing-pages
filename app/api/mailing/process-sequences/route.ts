import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getResend } from "@/lib/resend"

/**
 * POST /api/mailing/process-sequences
 * Processes all pending sequence enrollments and sends due emails.
 * Can be triggered manually from the admin panel.
 */
export async function POST(req: NextRequest) {
    return processSequences()
}

async function processSequences() {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const now = new Date().toISOString()

        // Get all active enrollments where next_send_at has passed
        const { data: dueEnrollments, error: enrollErr } = await supabase
            .from("sequence_enrollments")
            .select(`
                *,
                email_sequences!inner(
                    id, nombre, estado,
                    email_sequence_steps(*)
                )
            `)
            .eq("estado", "activo")
            .lte("next_send_at", now)
            .order("next_send_at", { ascending: true })
            .limit(50) // Process max 50 at a time

        if (enrollErr) {
            if (enrollErr.code === "42P01") return NextResponse.json({ processed: 0, message: "Tables not set up yet" })
            throw enrollErr
        }

        if (!dueEnrollments || dueEnrollments.length === 0) {
            return NextResponse.json({ processed: 0, message: "No emails due" })
        }

        let sent = 0
        let failed = 0

        for (const enrollment of dueEnrollments) {
            const sequence = enrollment.email_sequences
            if (!sequence || sequence.estado !== "activa") {
                // Sequence was paused/deleted, cancel enrollment
                await supabase
                    .from("sequence_enrollments")
                    .update({ estado: "cancelado" })
                    .eq("id", enrollment.id)
                continue
            }

            const steps = (sequence.email_sequence_steps || []).sort(
                (a: any, b: any) => a.step_order - b.step_order
            )

            const currentStepIndex = enrollment.current_step
            const step = steps[currentStepIndex]

            if (!step || !step.activo) {
                // Step doesn't exist or is inactive, move to next
                const nextStep = steps[currentStepIndex + 1]
                if (!nextStep) {
                    await supabase
                        .from("sequence_enrollments")
                        .update({ estado: "completado", completed_at: now })
                        .eq("id", enrollment.id)
                } else {
                    const nextDelay = (nextStep.delay_days * 24 * 60 * 60 * 1000) + (nextStep.delay_hours * 60 * 60 * 1000)
                    const nextSendAt = new Date(Date.now() + nextDelay).toISOString()
                    await supabase
                        .from("sequence_enrollments")
                        .update({ current_step: currentStepIndex + 1, next_send_at: nextSendAt })
                        .eq("id", enrollment.id)
                }
                continue
            }

            // Build personalized email content
            const personalizedHtml = (step.contenido_html || "")
                .replace(/{nombre}/g, enrollment.lead_nombre || enrollment.lead_email)
                .replace(/{email}/g, enrollment.lead_email)

            try {
                // Send the email
                const resend = await getResend()
                const { error: sendErr } = await resend.emails.send({
                    from: process.env.EMAIL_FROM || "noreply@magicfunnel.io",
                    to: enrollment.lead_email,
                    subject: step.asunto || "Mensaje de la secuencia",
                    html: personalizedHtml || `<p>Hola ${enrollment.lead_nombre},</p><p>Este es el email #${currentStepIndex + 1} de tu secuencia.</p>`
                })

                if (sendErr) throw sendErr

                // Log the send
                await supabase.from("sequence_email_logs").insert({
                    enrollment_id: enrollment.id,
                    sequence_id: sequence.id,
                    step_index: currentStepIndex,
                    lead_email: enrollment.lead_email,
                    asunto: step.asunto,
                    sent_at: now
                }).then(() => { }) // fire and forget

                sent++

                // Move to next step or complete
                const nextStep = steps[currentStepIndex + 1]
                if (!nextStep) {
                    await supabase
                        .from("sequence_enrollments")
                        .update({ estado: "completado", completed_at: now, current_step: currentStepIndex + 1 })
                        .eq("id", enrollment.id)
                } else {
                    const nextDelay = (nextStep.delay_days * 24 * 60 * 60 * 1000) + (nextStep.delay_hours * 60 * 60 * 1000)
                    const nextSendAt = new Date(Date.now() + nextDelay).toISOString()
                    await supabase
                        .from("sequence_enrollments")
                        .update({ current_step: currentStepIndex + 1, next_send_at: nextSendAt })
                        .eq("id", enrollment.id)
                }
            } catch (emailErr: any) {
                console.error(`Failed to send email to ${enrollment.lead_email}:`, emailErr)
                failed++
            }
        }

        return NextResponse.json({
            success: true,
            processed: dueEnrollments.length,
            sent,
            failed,
            timestamp: now
        })
    } catch (err: any) {
        console.error("process-sequences error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * GET /api/mailing/process-sequences
 * Called by Vercel Cron every 15 min.
 * Also returns enrollment stats if called with ?stats=true
 */
export async function GET(req: NextRequest) {
    // If ?stats=true, return stats only
    if (req.nextUrl.searchParams.get("stats") === "true") {
        return getStats()
    }

    // Verify Vercel Cron secret (optional security)
    const authHeader = req.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow without secret in dev, but log warning
        if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
    }

    // Process sequences (same logic as POST)
    return processSequences()
}

async function getStats() {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ stats: {} })

        const { data, error } = await supabase
            .from("sequence_enrollments")
            .select("estado")

        if (error) {
            if (error.code === "42P01") return NextResponse.json({ stats: { total: 0 } })
            throw error
        }

        const stats = {
            total: data?.length || 0,
            activo: data?.filter(e => e.estado === "activo").length || 0,
            completado: data?.filter(e => e.estado === "completado").length || 0,
            cancelado: data?.filter(e => e.estado === "cancelado").length || 0,
        }

        return NextResponse.json({ stats })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

