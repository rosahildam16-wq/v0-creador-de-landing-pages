import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { generateSubmissionId, generateAnswerId } from "@/lib/form-types"

/**
 * POST /api/forms/[slug]/submit — public endpoint, no auth required
 * Creates a lead and records the form submission + answers.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const body = await req.json()
        const { answers } = body  // Record<questionId, string | string[]>

        if (!answers || typeof answers !== "object") {
            return NextResponse.json({ error: "answers es requerido" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Load form + questions
        const { data: form, error: formErr } = await supabase
            .from("forms")
            .select("id, owner_email, name, settings")
            .eq("slug", slug)
            .eq("status", "published")
            .single()

        if (formErr || !form) {
            return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 })
        }

        const { data: questions } = await supabase
            .from("form_questions")
            .select("id, type, label, settings")
            .eq("form_id", form.id)
            .order("order_index")

        // 2. Extract CRM-mapped answers
        let nombre = ""
        let email = ""
        let whatsapp = ""

        for (const q of (questions || [])) {
            const val = answers[q.id]
            if (!val) continue
            const strVal = Array.isArray(val) ? val.join(", ") : String(val)
            const crmField = q.settings?.crm_field || (q.type === "email" ? "email" : q.type === "phone" ? "whatsapp" : undefined)
            if (crmField === "nombre") nombre = strVal
            if (crmField === "email") email = strVal
            if (crmField === "whatsapp") whatsapp = strVal
            // Fallback: first short_text as nombre, email type as email
            if (!nombre && q.type === "short_text" && !crmField) nombre = strVal
        }

        // 3. Get form owner's community info
        const { data: member } = await supabase
            .from("community_members")
            .select("community_id, username, member_id")
            .eq("email", form.owner_email)
            .maybeSingle()

        const communityId = member?.community_id || null
        const asignadoA = member?.username || member?.member_id || form.owner_email

        // 4. Upsert lead (match by email + community_id if email present)
        let leadId: string | null = null

        if (email && communityId) {
            const { data: existingLead } = await supabase
                .from("leads")
                .select("id")
                .eq("email", email)
                .eq("community_id", communityId)
                .maybeSingle()

            if (existingLead) {
                leadId = existingLead.id
                // Update existing lead's whatsapp if we have it
                if (whatsapp) {
                    await supabase.from("leads").update({ whatsapp, telefono: whatsapp }).eq("id", leadId)
                }
            }
        }

        if (!leadId && email) {
            const pipelineStage = form.settings?.pipeline_stage || "lead_nuevo"
            leadId = `lead-${Math.random().toString(36).substring(2, 9)}`
            const { error: leadErr } = await supabase.from("leads").insert({
                id: leadId,
                nombre: nombre || email.split("@")[0],
                email,
                whatsapp: whatsapp || null,
                telefono: whatsapp || null,
                fuente: "Formulario",
                campana: form.name,
                etapa: pipelineStage,
                community_id: communityId,
                asignado_a: asignadoA,
                tipo_embudo: "captacion",
                fecha_ingreso: new Date().toISOString(),
            })
            if (leadErr) {
                console.error("[Forms] Lead insert error:", leadErr)
                leadId = null  // submission still proceeds
            }
        }

        // 5. Create submission record
        const submissionId = generateSubmissionId()
        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || null

        await supabase.from("form_submissions").insert({
            id: submissionId,
            form_id: form.id,
            lead_id: leadId,
            ip_address: ipAddress,
            user_agent: req.headers.get("user-agent") || null,
            metadata: { referrer: req.headers.get("referer") || null },
        })

        // 6. Insert individual answers
        const answerRows = (questions || [])
            .filter(q => answers[q.id] !== undefined && answers[q.id] !== "")
            .map(q => {
                const val = answers[q.id]
                return {
                    id: generateAnswerId(),
                    submission_id: submissionId,
                    form_id: form.id,
                    question_id: q.id,
                    question_label: q.label,
                    value: Array.isArray(val) ? JSON.stringify(val) : String(val),
                }
            })

        if (answerRows.length > 0) {
            await supabase.from("form_answers").insert(answerRows)
        }

        // 7. Increment completions counter (read-increment-write, acceptable for analytics counters)
        const { data: currentForm } = await supabase.from("forms").select("completions").eq("id", form.id).single()
        if (currentForm) {
            await supabase.from("forms").update({ completions: (currentForm.completions || 0) + 1 }).eq("id", form.id)
        }

        return NextResponse.json({
            ok: true,
            submission_id: submissionId,
            lead_created: !!leadId,
            end_screen: null, // client already has it from form load
        }, { status: 201 })

    } catch (err: any) {
        console.error("[Forms Submit]", err)
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
    }
}

/**
 * GET /api/forms/[slug]/submit — increment view/start count
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(req.url)
        const event = searchParams.get("event") // "view" | "start"

        const supabase = await createClient()

        const { data: form } = await supabase
            .from("forms")
            .select("id, name, slug, status, mode, welcome_screen, end_screen, design, settings")
            .eq("slug", slug)
            .eq("status", "published")
            .single()

        if (!form) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

        const { data: questions } = await supabase
            .from("form_questions")
            .select("*")
            .eq("form_id", form.id)
            .order("order_index")

        const { data: rules } = await supabase
            .from("form_logic_rules")
            .select("*")
            .eq("form_id", form.id)

        // Increment counter
        if (event === "view") {
            const { data: f } = await supabase.from("forms").select("views").eq("id", form.id).single()
            if (f) await supabase.from("forms").update({ views: (f.views || 0) + 1 }).eq("id", form.id)
        } else if (event === "start") {
            const { data: f } = await supabase.from("forms").select("starts").eq("id", form.id).single()
            if (f) await supabase.from("forms").update({ starts: (f.starts || 0) + 1 }).eq("id", form.id)
        }

        return NextResponse.json({
            form: { ...form, questions: questions || [], logic_rules: rules || [] }
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
