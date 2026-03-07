import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { generateSubmissionId } from "@/lib/form-types"

/**
 * POST /api/forms/[slug]/abandon
 * Called via navigator.sendBeacon when user leaves without completing.
 * Records an abandoned submission with the last question reached.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const body = await req.json().catch(() => ({}))
        const { last_question_id, last_question_index, answers_count } = body

        // Must have at least started
        if (!last_question_id) return NextResponse.json({ ok: true })

        const supabase = await createClient()

        const { data: form } = await supabase
            .from("forms")
            .select("id")
            .eq("slug", slug)
            .eq("status", "published")
            .single()

        if (!form) return NextResponse.json({ ok: true })

        await supabase.from("form_submissions").insert({
            id: generateSubmissionId(),
            form_id: form.id,
            lead_id: null,
            abandoned: true,
            last_question_id,
            last_question_index: last_question_index ?? null,
            ip_address: req.headers.get("x-forwarded-for")?.split(",")[0] || null,
            metadata: { answers_count: answers_count || 0 },
        })

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: true })  // always 200 for beacon
    }
}
