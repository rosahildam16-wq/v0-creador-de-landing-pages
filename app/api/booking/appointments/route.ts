import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/auth/session"

/**
 * GET /api/booking/appointments?view=today|week|month&calendar_id=xxx
 * List bookings for the authenticated user
 */
export async function GET(req: NextRequest) {
    try {
        const session = (await cookies()).get("mf_session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
        const payload = await decrypt(session)
        const user = payload?.user
        if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 })

        const view = req.nextUrl.searchParams.get("view") || "week"
        const calendarId = req.nextUrl.searchParams.get("calendar_id")

        const supabase = await createClient()

        // Get user's calendar IDs
        const { data: calendars } = await supabase
            .from("booking_calendars")
            .select("id")
            .eq("owner_email", user.email)

        const calIds = calendars?.map(c => c.id) || []
        if (calIds.length === 0) {
            return NextResponse.json({ appointments: [], stats: { total: 0, confirmed: 0, cancelled: 0, no_show: 0 } })
        }

        // Date range based on view
        const now = new Date()
        let startDate: Date, endDate: Date

        switch (view) {
            case "today":
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
                break
            case "month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                break
            default: // week
                const dayOfWeek = now.getDay()
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
                endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        }

        let query = supabase
            .from("bookings")
            .select("*, calendar:booking_calendars(id, name, slug, duration_minutes, location_type, timezone)")
            .in("calendar_id", calendarId ? [calendarId] : calIds)
            .gte("start_time", startDate.toISOString())
            .lte("start_time", endDate.toISOString())
            .order("start_time", { ascending: true })

        const { data: appointments, error } = await query

        if (error) throw error

        // Stats
        const stats = {
            total: appointments?.length || 0,
            confirmed: appointments?.filter(a => a.status === "confirmed").length || 0,
            cancelled: appointments?.filter(a => a.status === "cancelled").length || 0,
            no_show: appointments?.filter(a => a.status === "no_show").length || 0,
        }

        return NextResponse.json({ appointments: appointments || [], stats })
    } catch (err) {
        console.error("Appointments error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
