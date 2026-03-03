import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/booking/public/[slug]
 * Public endpoint — returns calendar info + questions for the booking page
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("booking_calendars")
            .select("id, slug, name, description, type, duration_minutes, timezone, location_type, max_group_size, confirmation_message, confirmation_cta_url, confirmation_cta_label, owner_email, booking_questions(*), availability_rules(*)")
            .eq("slug", slug)
            .eq("active", true)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: "Calendar not found" }, { status: 404 })
        }

        // Sort questions
        if (data.booking_questions) {
            data.booking_questions.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }

        // Don't expose owner email in public response
        const { owner_email, ...publicData } = data

        return NextResponse.json({ calendar: publicData })
    } catch (err) {
        console.error("Public calendar error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
