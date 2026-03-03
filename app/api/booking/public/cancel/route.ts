import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

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

        // Find booking by cancel token
        const { data: booking, error } = await supabase
            .from("bookings")
            .select("id, status, calendar_id, guest_name, guest_email, start_time")
            .eq("cancel_token", token)
            .single()

        if (error || !booking) {
            return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
        }

        if (booking.status === "cancelled") {
            return NextResponse.json({ error: "Esta cita ya fue cancelada" }, { status: 400 })
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
            event_type: "booking_cancelled",
            details: { reason, cancelled_by: "guest" },
        })

        return NextResponse.json({ success: true, message: "Cita cancelada exitosamente" })
    } catch (err) {
        console.error("Cancel error:", err)
        return NextResponse.json({ error: "Error al cancelar" }, { status: 500 })
    }
}
