import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/auth/session"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = (await cookies()).get("mf_session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
        const payload = await decrypt(session)
        const user = payload?.user
        if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 })

        const { id } = await params
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("booking_calendars")
            .select("*, availability_rules(*), booking_questions(*), blackout_dates(*), notification_rules(*)")
            .eq("id", id)
            .eq("owner_email", user.email)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: "Calendar not found" }, { status: 404 })
        }

        // Sort questions by sort_order
        if (data.booking_questions) {
            data.booking_questions.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }

        return NextResponse.json({ calendar: data })
    } catch (err) {
        console.error("Error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = (await cookies()).get("mf_session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
        const payload = await decrypt(session)
        const user = payload?.user
        if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 })

        const { id } = await params
        const body = await req.json()
        const supabase = await createClient()

        // Update calendar fields
        const updateFields: Record<string, any> = { updated_at: new Date().toISOString() }
        const allowed = [
            "name", "description", "type", "duration_minutes", "timezone",
            "location_type", "location_value", "max_bookings_per_day",
            "min_notice_hours", "buffer_before_minutes", "buffer_after_minutes",
            "max_group_size", "confirmation_message", "confirmation_cta_url",
            "confirmation_cta_label", "active",
            "host_image_url", "allow_cancellation", "allow_reschedule"
        ]
        for (const key of allowed) {
            if (body[key] !== undefined) updateFields[key] = body[key]
        }

        const { data, error } = await supabase
            .from("booking_calendars")
            .update(updateFields)
            .eq("id", id)
            .eq("owner_email", user.email)
            .select()
            .single()

        if (error) {
            if (error.message?.includes("schema cache") || error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("column")) {
                await triggerMigration()
            }
            throw error
        }

        // Update availability rules if provided
        if (body.availability_rules) {
            await supabase.from("availability_rules").delete().eq("calendar_id", id)
            const rules = body.availability_rules.map((r: any) => ({
                calendar_id: id,
                day_of_week: r.day_of_week,
                start_time: r.start_time,
                end_time: r.end_time,
                active: r.active ?? true,
            }))
            await supabase.from("availability_rules").insert(rules)
        }

        // Update questions if provided
        if (body.booking_questions) {
            await supabase.from("booking_questions").delete().eq("calendar_id", id)
            const questions = body.booking_questions.map((q: any, i: number) => ({
                calendar_id: id,
                label: q.label,
                type: q.type || "text",
                placeholder: q.placeholder || null,
                required: q.required ?? true,
                options: q.options || null,
                sort_order: i,
            }))
            await supabase.from("booking_questions").insert(questions)
        }

        // Update blackout dates if provided
        if (body.blackout_dates) {
            await supabase.from("blackout_dates").delete().eq("calendar_id", id)
            if (body.blackout_dates.length > 0) {
                const dates = body.blackout_dates.map((d: any) => ({
                    calendar_id: id,
                    date: d.date,
                    reason: d.reason || null,
                }))
                await supabase.from("blackout_dates").insert(dates)
            }
        }

        return NextResponse.json({ calendar: data })
    } catch (err: any) {
        console.error("Error updating calendar:", err)
        const msg = err?.message?.includes("column") || err?.message?.includes("does not exist")
            ? "Error de esquema. Las tablas se están actualizando, intenta de nuevo en 15 segundos."
            : "Error interno"
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}

async function triggerMigration() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        await fetch(`${baseUrl}/api/admin/migrate-forms`, { method: "POST" })
    } catch {}
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = (await cookies()).get("mf_session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
        const payload = await decrypt(session)
        const user = payload?.user
        if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 })

        const { id } = await params
        const supabase = await createClient()

        const { error } = await supabase
            .from("booking_calendars")
            .delete()
            .eq("id", id)
            .eq("owner_email", user.email)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Error deleting calendar:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
