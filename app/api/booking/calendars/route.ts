import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/auth/session"
import { generateSlug, DEFAULT_AVAILABILITY } from "@/lib/booking"

export async function GET(req: NextRequest) {
    try {
        const session = (await cookies()).get("mf_session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
        const payload = await decrypt(session)
        const user = payload?.user
        if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 })

        const supabase = await createClient()

        const { data, error } = await supabase
            .from("booking_calendars")
            .select("*, availability_rules(*), bookings(id, status, start_time)")
            .eq("owner_email", user.email)
            .order("created_at", { ascending: false })

        if (error) throw error

        // Add booking counts
        const calendars = (data || []).map(cal => ({
            ...cal,
            total_bookings: cal.bookings?.filter((b: any) => b.status !== "cancelled").length || 0,
            upcoming_bookings: cal.bookings?.filter((b: any) =>
                b.status === "confirmed" && new Date(b.start_time) > new Date()
            ).length || 0,
        }))

        return NextResponse.json({ calendars })
    } catch (err: any) {
        console.error("Error fetching calendars:", err)
        return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = (await cookies()).get("mf_session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })
        const payload = await decrypt(session)
        const user = payload?.user
        if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 })

        const body = await req.json()
        const { name, type, duration_minutes, timezone, location_type, location_value, description } = body

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const supabase = await createClient()

        // Generate unique slug
        let slug = generateSlug(name)
        const { data: existing } = await supabase
            .from("booking_calendars")
            .select("slug")
            .eq("slug", slug)
            .maybeSingle()

        if (existing) {
            slug = `${slug}-${Date.now().toString(36)}`
        }

        // Create calendar
        const { data: calendar, error } = await supabase
            .from("booking_calendars")
            .insert({
                owner_email: user.email,
                slug,
                name,
                description: description || null,
                type: type || "1:1",
                duration_minutes: duration_minutes || 30,
                timezone: timezone || "America/Mexico_City",
                location_type: location_type || "google_meet",
                location_value: location_value || null,
            })
            .select()
            .single()

        if (error) {
            console.error("Supabase insert error:", error)
            return NextResponse.json({ error: `Error BD: ${error.message}` }, { status: 500 })
        }

        // Create default availability rules (Mon-Fri 9-5)
        const rules = DEFAULT_AVAILABILITY.map(rule => ({
            calendar_id: calendar.id,
            ...rule,
        }))

        const { error: rulesErr } = await supabase.from("availability_rules").insert(rules)
        if (rulesErr) console.error("Rules insert error:", rulesErr)

        // Create default questions
        const { error: questionsErr } = await supabase.from("booking_questions").insert([
            { calendar_id: calendar.id, label: "Nombre completo", type: "text", required: true, sort_order: 0 },
            { calendar_id: calendar.id, label: "Email", type: "email", required: true, sort_order: 1 },
            { calendar_id: calendar.id, label: "Teléfono", type: "phone", required: false, sort_order: 2 },
        ])
        if (questionsErr) console.error("Questions insert error:", questionsErr)

        // Create default notification rules
        const { error: notifErr } = await supabase.from("notification_rules").insert([
            { calendar_id: calendar.id, event_type: "confirmation", channel: "email", timing_minutes: 0, active: true },
            { calendar_id: calendar.id, event_type: "reminder", channel: "email", timing_minutes: 1440, active: true }, // 24h
            { calendar_id: calendar.id, event_type: "reminder", channel: "email", timing_minutes: 60, active: true }, // 1h
            { calendar_id: calendar.id, event_type: "cancellation", channel: "email", timing_minutes: 0, active: true },
        ])
        if (notifErr) console.error("Notification rules insert error:", notifErr)

        return NextResponse.json({ calendar })
    } catch (err: any) {
        console.error("Error creating calendar:", err)
        return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
    }
}
