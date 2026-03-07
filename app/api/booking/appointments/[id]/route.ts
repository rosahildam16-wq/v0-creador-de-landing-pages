import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/auth/session"

type BookingStatus = "confirmed" | "cancelled" | "rescheduled" | "no_show" | "completed"
const VALID_STATUSES: BookingStatus[] = ["confirmed", "cancelled", "rescheduled", "no_show", "completed"]

/**
 * PATCH /api/booking/appointments/[id]
 * Update booking status. Requires auth and ownership of the calendar.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = (await cookies()).get("mf_session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
        const payload = await decrypt(session)
        const user = payload?.user
        if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 })

        const body = await req.json()
        const { status, cancel_reason } = body

        if (!status || !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Estado inválido. Opciones: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Verify the booking belongs to the authenticated user's calendar
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("id, status, calendar_id, booking_calendars!inner(owner_email)")
            .eq("id", id)
            .single()

        if (fetchError || !booking) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
        }

        const ownerEmail = (booking as any).booking_calendars?.owner_email
        if (ownerEmail !== user.email) {
            return NextResponse.json({ error: "No tienes permiso para modificar esta cita" }, { status: 403 })
        }

        const updateData: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        }

        if (status === "cancelled") {
            updateData.cancelled_at = new Date().toISOString()
            if (cancel_reason) updateData.cancel_reason = cancel_reason
        }

        const { data: updated, error: updateError } = await supabase
            .from("bookings")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (updateError) throw updateError

        // Audit log
        await supabase.from("booking_audit_log").insert({
            booking_id: id,
            event_type: `status_changed_to_${status}`,
            details: { previous_status: booking.status, new_status: status, cancel_reason },
        })

        return NextResponse.json({ booking: updated })
    } catch (err: any) {
        console.error("Error updating appointment:", err)
        return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
    }
}
