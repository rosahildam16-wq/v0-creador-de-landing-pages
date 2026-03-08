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

async function assertOwnership(supabase: any, id: string, userEmail: string) {
    const { data } = await supabase
        .from("funnels")
        .select("id, member_id")
        .eq("id", id)
        .maybeSingle()

    if (!data) return { error: "Funnel no encontrado", status: 404 }
    if (data.member_id !== userEmail) return { error: "Sin permiso", status: 403 }
    return { error: null }
}

/**
 * GET /api/funnels/[id]
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("funnels")
            .select("*")
            .eq("id", id)
            .eq("member_id", user.email)
            .single()

        if (error || !data) return NextResponse.json({ error: "Funnel no encontrado" }, { status: 404 })

        return NextResponse.json({ funnel: data })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 })
    }
}

/**
 * PUT /api/funnels/[id] — full update (save)
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const supabase = await createClient()
        const ownership = await assertOwnership(supabase, id, user.email)
        if (ownership.error) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

        const body = await req.json()
        const { name, description, slug, config, status, custom_domain, domain_status } = body

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (slug !== undefined) updateData.slug = slug
        if (config !== undefined) updateData.config = config
        if (status !== undefined) updateData.status = status
        if (custom_domain !== undefined) updateData.custom_domain = custom_domain || null
        if (domain_status !== undefined) updateData.domain_status = domain_status

        const { data, error } = await supabase
            .from("funnels")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ funnel: data })
    } catch (err: any) {
        console.error("[Funnels PUT]", err)
        return NextResponse.json({ error: err?.message }, { status: 500 })
    }
}

/**
 * DELETE /api/funnels/[id]
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const supabase = await createClient()
        const ownership = await assertOwnership(supabase, id, user.email)
        if (ownership.error) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

        const { error } = await supabase
            .from("funnels")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message }, { status: 500 })
    }
}
