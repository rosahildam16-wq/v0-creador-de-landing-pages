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
 * GET /api/funnels — list all funnels for the authenticated user
 */
export async function GET() {
    try {
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("funnels")
            .select("id, name, description, slug, status, custom_domain, domain_status, created_at, updated_at, config")
            .eq("member_id", user.email)
            .order("updated_at", { ascending: false })

        if (error) throw error

        return NextResponse.json({ funnels: data || [] })
    } catch (err: any) {
        console.error("[Funnels GET]", err)
        return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
    }
}

/**
 * POST /api/funnels — create a new funnel
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const body = await req.json()
        const { id, name, description, slug, config, status } = body

        if (!id || !name || !config) {
            return NextResponse.json({ error: "id, name y config son requeridos" }, { status: 400 })
        }

        const supabase = await createClient()

        // Check for slug collision within member's funnels
        const { data: existing } = await supabase
            .from("funnels")
            .select("id")
            .eq("member_id", user.email)
            .eq("slug", slug)
            .maybeSingle()

        const finalSlug = existing
            ? `${slug}-${Date.now().toString(36)}`
            : slug

        const { data, error } = await supabase
            .from("funnels")
            .insert({
                id,
                member_id: user.email,
                name,
                description: description || null,
                slug: finalSlug,
                config,
                status: status || "draft",
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ funnel: data }, { status: 201 })
    } catch (err: any) {
        console.error("[Funnels POST]", err)
        return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
    }
}
