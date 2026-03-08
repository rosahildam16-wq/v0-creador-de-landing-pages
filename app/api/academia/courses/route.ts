import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

/** GET /api/academia/courses?community_id=xxx  — list published courses */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        const { searchParams } = new URL(req.url)
        const communityId = searchParams.get("community_id")
        const ownerOnly = searchParams.get("owner_only") === "true"
        const includeAll = searchParams.get("include_all") === "true" // admin/leader: include drafts

        let query = supabase
            .from("courses")
            .select("id, title, description, thumbnail_url, level, category, tags, status, is_featured, community_id, owner_email, access_type, price, sort_order, created_at, updated_at")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false })

        if (ownerOnly) {
            query = query.eq("owner_email", session.user.email)
        } else if (!includeAll) {
            query = query.eq("status", "published")
            if (communityId) {
                query = query.or(`community_id.is.null,community_id.eq.${communityId}`)
            } else {
                query = query.is("community_id", null)
            }
        }

        const { data, error } = await query
        if (error) throw error

        // For each course, count modules and lessons
        const enriched = await Promise.all((data || []).map(async (course) => {
            const [modRes, lesRes] = await Promise.all([
                supabase.from("course_modules").select("id", { count: "exact", head: true }).eq("course_id", course.id),
                supabase.from("course_lessons").select("id", { count: "exact", head: true }).eq("course_id", course.id).eq("status", "published"),
            ])
            return {
                ...course,
                module_count: modRes.count ?? 0,
                lesson_count: lesRes.count ?? 0,
            }
        }))

        return NextResponse.json({ success: true, courses: enriched })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** POST /api/academia/courses — create a new course (leader/admin only) */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        // Only leader or super_admin can create courses
        if (!["leader", "super_admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Sin permisos para crear cursos" }, { status: 403 })
        }

        const body = await req.json()
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        const { data, error } = await supabase
            .from("courses")
            .insert({
                title: body.title?.trim() || "Sin título",
                description: body.description?.trim() || "",
                thumbnail_url: body.thumbnail_url || null,
                level: body.level || "basico",
                category: body.category || "General",
                tags: body.tags || [],
                status: body.status || "draft",
                is_featured: body.is_featured || false,
                community_id: body.community_id || null,
                owner_email: session.user.email,
                access_type: body.access_type || "community",
                price: body.price || 0,
                sort_order: body.sort_order || 0,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, course: data }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
