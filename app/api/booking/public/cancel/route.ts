import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/booking/public/cancel?token=...
 * Fetch booking details for the cancellation confirmation page.
 */
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token")
    if (!token) return NextResponse.json({ error: "token requerido" }, { status: 400 })

    const supabase = await createClient()
    const { data: booking, error } = await supabase
        .from("bookings")
        .select("id, status, guest_name, start_time, end_time, booking_calendars!inner(name, timezone, allow_cancellation)")
        .eq("cancel_token", token)
        .maybeSingle()

    if (error || !booking) {
        return NextResponse.json({ error: "Token inválido o cita no encontrada" }, { status: 404 })
    }

    const cal = (booking as any).booking_calendars
    return NextResponse.json({
        booking: {
            id: booking.id,
            status: booking.status,
            guest_name: booking.guest_name,
            start_time: booking.start_time,
            end_time: booking.end_time,
            calendar_name: cal?.name,
            timezone: cal?.timezone || "America/Mexico_City",
            allow_cancellation: cal?.allow_cancellation ?? true,
        },
    })
}

/**
 * POST /api/booking/public/cancel
 * Cancel a booking with token (public, no auth)
 */
export async function POST(req: NextRequest) {
    try {
        const { token, reason } = await req.json()

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 })
        }

        const supabase = await createClient()

        // Find booking by cancel token including calendar settings
        const { data: booking, error } = await supabase
            .from("bookings")
            .select("id, status, calendar_id, guest_name, guest_email, start_time, booking_calendars!inner(name, owner_email, allow_cancellation, timezone)")
            .eq("cancel_token", token)
            .maybeSingle()

        if (error || !booking) {
            return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
        }

        if (booking.status === "cancelled") {
            return NextResponse.json({ error: "Esta cita ya fue cancelada" }, { status: 400 })
        }

        if (booking.status === "completed") {
            return NextResponse.json({ error: "No se puede cancelar una cita ya completada" }, { status: 400 })
        }

        const cal = (booking as any).booking_calendars
        if (cal?.allow_cancellation === false) {
            return NextResponse.json({ error: "Este calendario no permite cancelaciones en línea" }, { status: 403 })
        }

        // Cancel the booking
        const { error: updateError } = await supabase
            .from("bookings")
            .update({
                status: "cancelled",
                cancelled_at: new Date().toISOString(),
                cancel_reason: reason || "Cancelada por el invitado",
                updated_at: new Date().toISOString(),
            })
            .eq("id", booking.id)

        if (updateError) throw updateError

        // Audit log
        await supabase.from("booking_audit_log").insert({
            booking_id: booking.id,
            event_type: "booking_cancelled_by_guest",
            details: { reason, cancelled_by: "guest" },
        })

        return NextResponse.json({ success: true, message: "Cita cancelada exitosamente" })
    } catch (err) {
        console.error("Cancel error:", err)
        return NextResponse.json({ error: "Error al cancelar" }, { status: 500 })
    }
}
