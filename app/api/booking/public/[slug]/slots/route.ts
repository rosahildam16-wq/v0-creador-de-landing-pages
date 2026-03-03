import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { generateSlots } from "@/lib/booking"

/**
 * GET /api/booking/public/[slug]/slots?date=2026-03-15
 * Returns available time slots for a given date
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const date = req.nextUrl.searchParams.get("date")

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ error: "Date required (YYYY-MM-DD)" }, { status: 400 })
        }

        const supabase = await createClient()

        // Get calendar with availability rules
        const { data: cal, error } = await supabase
            .from("booking_calendars")
            .select("*, availability_rules(*)")
            .eq("slug", slug)
            .eq("active", true)
            .single()

        if (error || !cal) {
            return NextResponse.json({ error: "Calendar not found" }, { status: 404 })
        }

        // Check if date is blackout
        const { data: blackout } = await supabase
            .from("blackout_dates")
            .select("id")
            .eq("calendar_id", cal.id)
            .eq("date", date)
            .maybeSingle()

        if (blackout) {
            return NextResponse.json({ slots: [], message: "Date unavailable" })
        }

        // Get existing bookings for this date
        const dayStart = `${date}T00:00:00`
        const dayEnd = `${date}T23:59:59`

        const { data: bookings } = await supabase
            .from("bookings")
            .select("start_time, end_time")
            .eq("calendar_id", cal.id)
            .not("status", "in", "(cancelled,rescheduled)")
            .gte("start_time", dayStart)
            .lte("start_time", dayEnd)

        const slots = generateSlots({
            date,
            rules: cal.availability_rules || [],
            existingBookings: bookings || [],
            durationMinutes: cal.duration_minutes,
            bufferBefore: cal.buffer_before_minutes,
            bufferAfter: cal.buffer_after_minutes,
            minNoticeHours: cal.min_notice_hours,
            maxBookingsPerDay: cal.max_bookings_per_day,
            timezone: cal.timezone,
        })

        return NextResponse.json({
            slots,
            calendar: {
                duration_minutes: cal.duration_minutes,
                timezone: cal.timezone,
            }
        })
    } catch (err) {
        console.error("Slots error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
