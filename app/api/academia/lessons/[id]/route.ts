import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

/** PATCH /api/academia/lessons/[id] */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        if (!["leader", "super_admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        const allowed = ["title", "description", "video_url", "duration_seconds", "sort_order", "status", "is_free_preview"]
        const updates: Record<string, any> = {}
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key]
        }

        const { data, error } = await supabase
            .from("course_lessons")
            .update(updates)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, lesson: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** DELETE /api/academia/lessons/[id] */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        if (!["leader", "super_admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        const { id } = await params
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        const { error } = await supabase.from("course_lessons").delete().eq("id", id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
