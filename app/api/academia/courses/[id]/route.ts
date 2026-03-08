import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

/** GET /api/academia/courses/[id] — course with all modules and lessons */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await params
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        const { data: course, error } = await supabase
            .from("courses")
            .select("*")
            .eq("id", id)
            .single()

        if (error || !course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })

        const { data: modules } = await supabase
            .from("course_modules")
            .select("*")
            .eq("course_id", id)
            .order("sort_order", { ascending: true })

        const moduleIds = (modules || []).map((m) => m.id)
        let lessons: any[] = []
        if (moduleIds.length > 0) {
            const { data: lessonsData } = await supabase
                .from("course_lessons")
                .select("*")
                .in("module_id", moduleIds)
                .eq("status", "published")
                .order("sort_order", { ascending: true })
            lessons = lessonsData || []
        }

        // Attach lessons to modules
        const modulesWithLessons = (modules || []).map((m) => ({
            ...m,
            lessons: lessons.filter((l) => l.module_id === m.id),
        }))

        return NextResponse.json({ success: true, course: { ...course, modules: modulesWithLessons } })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** PATCH /api/academia/courses/[id] — update course */
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

        const allowed = ["title", "description", "thumbnail_url", "level", "category", "tags",
            "status", "is_featured", "community_id", "access_type", "price", "sort_order"]
        const updates: Record<string, any> = {}
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key]
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "Sin cambios" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("courses")
            .update(updates)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, course: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** DELETE /api/academia/courses/[id] — delete course */
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

        const { error } = await supabase.from("courses").delete().eq("id", id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
