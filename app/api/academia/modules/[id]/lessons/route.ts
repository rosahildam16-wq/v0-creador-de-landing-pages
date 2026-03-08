import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

/** POST /api/academia/modules/[id]/lessons — create lesson */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        if (!["leader", "super_admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        const { id: moduleId } = await params
        const body = await req.json()
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        // Get course_id from the module
        const { data: mod } = await supabase
            .from("course_modules")
            .select("course_id")
            .eq("id", moduleId)
            .single()

        if (!mod) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 })

        // Get next sort order
        const { data: existing } = await supabase
            .from("course_lessons")
            .select("sort_order")
            .eq("module_id", moduleId)
            .order("sort_order", { ascending: false })
            .limit(1)

        const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

        const { data, error } = await supabase
            .from("course_lessons")
            .insert({
                module_id: moduleId,
                course_id: mod.course_id,
                title: body.title?.trim() || "Nueva lección",
                description: body.description?.trim() || "",
                video_url: body.video_url?.trim() || null,
                duration_seconds: body.duration_seconds || 0,
                sort_order: body.sort_order ?? nextOrder,
                status: body.status || "published",
                is_free_preview: body.is_free_preview || false,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, lesson: data }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
