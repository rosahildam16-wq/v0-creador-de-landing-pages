import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

/** GET /api/academia/courses/[id]/modules */
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

        const { data: modules, error } = await supabase
            .from("course_modules")
            .select("*")
            .eq("course_id", id)
            .order("sort_order", { ascending: true })

        if (error) throw error

        const moduleIds = (modules || []).map((m) => m.id)
        let lessons: any[] = []
        if (moduleIds.length > 0) {
            const { data } = await supabase
                .from("course_lessons")
                .select("*")
                .in("module_id", moduleIds)
                .order("sort_order", { ascending: true })
            lessons = data || []
        }

        const result = (modules || []).map((m) => ({
            ...m,
            lessons: lessons.filter((l) => l.module_id === m.id),
        }))

        return NextResponse.json({ success: true, modules: result })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** POST /api/academia/courses/[id]/modules — create module */
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

        const { id: courseId } = await params
        const body = await req.json()
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        // Get current max sort_order
        const { data: existing } = await supabase
            .from("course_modules")
            .select("sort_order")
            .eq("course_id", courseId)
            .order("sort_order", { ascending: false })
            .limit(1)

        const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

        const { data, error } = await supabase
            .from("course_modules")
            .insert({
                course_id: courseId,
                title: body.title?.trim() || "Nuevo módulo",
                description: body.description?.trim() || "",
                thumbnail_url: body.thumbnail_url || null,
                sort_order: body.sort_order ?? nextOrder,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, module: { ...data, lessons: [] } }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
