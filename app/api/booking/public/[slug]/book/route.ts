import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/booking/public/[slug]/book
 * Creates a new booking (public, no auth required)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const body = await req.json()
        const { datetime, guest_name, guest_email, guest_phone, answers } = body

        if (!datetime || !guest_name || !guest_email) {
            return NextResponse.json(
                { error: "Se requiere fecha/hora, nombre y email" },
                { status: 400 }
            )
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest_email)) {
            return NextResponse.json({ error: "Email inválido" }, { status: 400 })
        }

        const supabase = await createClient()

        // Get calendar
        const { data: cal, error: calError } = await supabase
            .from("booking_calendars")
            .select("id, duration_minutes, timezone, name, owner_email, confirmation_message, confirmation_cta_url, confirmation_cta_label")
            .eq("slug", slug)
            .eq("active", true)
            .single()

        if (calError || !cal) {
            return NextResponse.json({ error: "Calendar not found" }, { status: 404 })
        }

        // Calculate end time
        const startTime = new Date(datetime)
        const endTime = new Date(startTime.getTime() + cal.duration_minutes * 60 * 1000)

        // Try to insert (unique constraint prevents double booking)
        const { data: booking, error: bookError } = await supabase
            .from("bookings")
            .insert({
                calendar_id: cal.id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                guest_name,
                guest_email,
                guest_phone: guest_phone || null,
                guest_answers: answers || {},
                status: "confirmed",
            })
            .select()
            .single()

        if (bookError) {
            if (bookError.code === "23505") {
                return NextResponse.json(
                    { error: "Este horario ya fue reservado. Por favor elige otro." },
                    { status: 409 }
                )
            }
            throw bookError
        }

        // Create audit log entry
        await supabase.from("booking_audit_log").insert({
            booking_id: booking.id,
            event_type: "booking_created",
            details: { guest_name, guest_email, start_time: startTime.toISOString() },
        })

        // TODO: Send confirmation email to guest and owner
        // await sendBookingConfirmation(booking, cal)

        return NextResponse.json({
            booking: {
                id: booking.id,
                start_time: booking.start_time,
                end_time: booking.end_time,
                guest_name: booking.guest_name,
                cancel_token: booking.cancel_token,
                reschedule_token: booking.reschedule_token,
            },
            calendar: {
                name: cal.name,
                confirmation_message: cal.confirmation_message,
                confirmation_cta_url: cal.confirmation_cta_url,
                confirmation_cta_label: cal.confirmation_cta_label,
                timezone: cal.timezone,
            },
        })
    } catch (err) {
        console.error("Booking error:", err)
        return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 })
    }
}
