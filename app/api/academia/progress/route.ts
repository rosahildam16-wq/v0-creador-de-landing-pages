import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

/** GET /api/academia/progress?course_id=xxx — get completed lesson IDs for current user */
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const courseId = searchParams.get("course_id")

        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        let query = supabase
            .from("lesson_completions")
            .select("lesson_id, completed_at")
            .eq("member_email", session.user.email)

        if (courseId) {
            // Join through course_lessons to filter by course
            const { data: lessonIds } = await supabase
                .from("course_lessons")
                .select("id")
                .eq("course_id", courseId)

            const ids = (lessonIds || []).map((l) => l.id)
            if (ids.length === 0) return NextResponse.json({ success: true, completedLessons: [] })
            query = query.in("lesson_id", ids)
        }

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({
            success: true,
            completedLessons: (data || []).map((r) => r.lesson_id),
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/** POST /api/academia/progress — toggle lesson completion */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { lessonId, completed } = await req.json()
        if (!lessonId) return NextResponse.json({ error: "lessonId requerido" }, { status: 400 })

        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        if (completed) {
            await supabase
                .from("lesson_completions")
                .upsert({ member_email: session.user.email, lesson_id: lessonId }, { onConflict: "member_email,lesson_id" })
        } else {
            await supabase
                .from("lesson_completions")
                .delete()
                .eq("member_email", session.user.email)
                .eq("lesson_id", lessonId)
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
