import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/auth/session"

async function getUser() {
    const session = (await cookies()).get("mf_session")?.value
    if (!session) return null
    const payload = await decrypt(session)
    return payload?.user || null
}

/**
 * GET /api/member/forms/[id]/submissions — paginated submissions with answers
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const supabase = await createClient()

        // Verify ownership
        const { data: form } = await supabase
            .from("forms")
            .select("id")
            .eq("id", id)
            .eq("owner_email", user.email)
            .maybeSingle()

        if (!form) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = 20
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data: submissions, error, count } = await supabase
            .from("form_submissions")
            .select("*, form_answers(*)", { count: "exact" })
            .eq("form_id", id)
            .order("submitted_at", { ascending: false })
            .range(from, to)

        if (error) throw error

        return NextResponse.json({
            submissions: submissions || [],
            total: count || 0,
            page,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
