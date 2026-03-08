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

async function assertOwnership(supabase: any, id: string, email: string) {
    const { data } = await supabase
        .from("forms")
        .select("id, owner_email")
        .eq("id", id)
        .maybeSingle()
    if (!data) return { error: "Formulario no encontrado", status: 404 }
    if (data.owner_email !== email) return { error: "Sin permiso", status: 403 }
    return { error: null }
}

/**
 * GET /api/member/forms/[id] — get form with questions and logic rules
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

        const [formRes, questionsRes, rulesRes] = await Promise.all([
            supabase.from("forms").select("*").eq("id", id).eq("owner_email", user.email).single(),
            supabase.from("form_questions").select("*").eq("form_id", id).order("order_index"),
            supabase.from("form_logic_rules").select("*").eq("form_id", id),
        ])

        if (formRes.error || !formRes.data) {
            return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 })
        }

        return NextResponse.json({
            form: {
                ...formRes.data,
                questions: questionsRes.data || [],
                logic_rules: rulesRes.data || [],
            }
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * PUT /api/member/forms/[id] — update form (fields + questions + logic)
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
        const { name, slug, description, status, mode, welcome_screen, end_screen, design, settings, questions, logic_rules } = body

        // Update form fields
        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (slug !== undefined) updateData.slug = slug
        if (description !== undefined) updateData.description = description || null
        if (status !== undefined) updateData.status = status
        if (mode !== undefined) updateData.mode = mode
        if (welcome_screen !== undefined) updateData.welcome_screen = welcome_screen
        if (end_screen !== undefined) updateData.end_screen = end_screen
        if (design !== undefined) updateData.design = design
        if (settings !== undefined) updateData.settings = settings

        const { data: formData, error: formError } = await supabase
            .from("forms")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (formError) throw formError

        // Replace questions if provided
        if (Array.isArray(questions)) {
            await supabase.from("form_questions").delete().eq("form_id", id)
            if (questions.length > 0) {
                const rows = questions.map((q: any, i: number) => ({
                    id: q.id,
                    form_id: id,
                    type: q.type,
                    label: q.label,
                    description: q.description || null,
                    placeholder: q.placeholder || null,
                    required: q.required ?? false,
                    order_index: i,
                    options: q.options || null,
                    settings: q.settings || null,
                }))
                const { error: qErr } = await supabase.from("form_questions").insert(rows)
                if (qErr) throw qErr
            }
        }

        // Replace logic rules if provided
        if (Array.isArray(logic_rules)) {
            await supabase.from("form_logic_rules").delete().eq("form_id", id)
            if (logic_rules.length > 0) {
                const rows = logic_rules.map((r: any) => ({
                    id: r.id,
                    form_id: id,
                    question_id: r.question_id,
                    condition_value: r.condition_value,
                    action_type: r.action_type,
                    target_question_id: r.target_question_id || null,
                }))
                const { error: rErr } = await supabase.from("form_logic_rules").insert(rows)
                if (rErr) throw rErr
            }
        }

        return NextResponse.json({ form: formData })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * DELETE /api/member/forms/[id]
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

        const { error } = await supabase.from("forms").delete().eq("id", id)
        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
