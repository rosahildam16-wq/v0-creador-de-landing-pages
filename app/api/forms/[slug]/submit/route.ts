import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { generateSubmissionId, generateAnswerId } from "@/lib/form-types"
import { getResend } from "@/lib/resend"

// ─── helpers ──────────────────────────────────────────────────────────────────

async function incrementCounter(supabase: any, formId: string, field: "views" | "starts" | "completions") {
    const { data } = await supabase.from("forms").select(field).eq("id", formId).single()
    if (data) await supabase.from("forms").update({ [field]: (data[field] || 0) + 1 }).eq("id", formId)
}

async function addTagToLead(supabase: any, leadId: string, tag: string) {
    if (!tag || !leadId) return
    const { data: lead } = await supabase.from("leads").select("tags").eq("id", leadId).single()
    const current: string[] = lead?.tags || []
    if (!current.includes(tag)) {
        await supabase.from("leads").update({ tags: [...current, tag] }).eq("id", leadId)
    }
}

async function triggerEmailSequence(
    origin: string,
    formId: string,
    leadId: string,
    leadEmail: string,
    leadNombre: string,
    communityId: string | null,
) {
    try {
        await fetch(`${origin}/api/mailing/trigger-sequence`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                trigger_type: "form_submit",
                trigger_value: formId,
                lead_id: leadId,
                lead_email: leadEmail,
                lead_nombre: leadNombre,
                community_id: communityId,
            }),
        })
    } catch (err) {
        console.warn("[Forms] Sequence trigger non-fatal error:", err)
    }
}

async function sendOwnerNotification(
    ownerEmail: string,
    formName: string,
    leadNombre: string,
    leadEmail: string,
    leadWhatsapp: string,
    answers: Array<{ question_label?: string; value: string }>,
) {
    try {
        const resend = await getResend()
        const answersHtml = answers
            .filter(a => a.question_label && a.value)
            .slice(0, 10)
            .map(a => `<tr><td style="padding:6px 12px;color:#888;font-size:12px;white-space:nowrap">${a.question_label}</td><td style="padding:6px 12px;color:#fff;font-size:13px">${a.value}</td></tr>`)
            .join("")

        await resend.emails.send({
            from: "Magic Funnel <notificaciones@magicfunnel.app>",
            to: [ownerEmail],
            subject: `🎯 Nuevo lead de "${formName}": ${leadNombre || leadEmail}`,
            html: `
<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;padding:40px 20px;margin:0">
  <div style="max-width:520px;margin:0 auto">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
      <p style="font-size:32px;margin:0">🎯</p>
      <h1 style="margin:8px 0 4px;font-size:20px;font-weight:900">Nuevo lead capturado</h1>
      <p style="margin:0;opacity:.8;font-size:13px">Formulario: <strong>${formName}</strong></p>
    </div>
    <div style="background:#1a1a2e;border-radius:16px;padding:24px;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 12px;color:#888;font-size:12px">Nombre</td><td style="padding:6px 12px;color:#fff;font-size:14px;font-weight:700">${leadNombre || "—"}</td></tr>
        <tr style="background:#ffffff08"><td style="padding:6px 12px;color:#888;font-size:12px">Email</td><td style="padding:6px 12px;color:#a78bfa;font-size:14px">${leadEmail}</td></tr>
        ${leadWhatsapp ? `<tr><td style="padding:6px 12px;color:#888;font-size:12px">WhatsApp</td><td style="padding:6px 12px;color:#34d399;font-size:14px">${leadWhatsapp}</td></tr>` : ""}
      </table>
    </div>
    ${answersHtml ? `
    <div style="background:#111128;border-radius:16px;padding:24px;margin-bottom:16px">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#555;font-weight:700">Respuestas</p>
      <table style="width:100%;border-collapse:collapse">${answersHtml}</table>
    </div>` : ""}
    <div style="text-align:center;padding-top:16px">
      <a href="https://magicfunnel.app/member/mis-leads" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:900;font-size:14px">Ver en Magic Funnel →</a>
    </div>
    <p style="text-align:center;margin-top:24px;font-size:11px;color:#333">Magic Funnel · Notificación automática de formulario</p>
  </div>
</body>
</html>`,
        })
    } catch (err) {
        console.warn("[Forms] Owner notification non-fatal:", err)
    }
}

// ─── POST /api/forms/[slug]/submit ────────────────────────────────────────────

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const body = await req.json()
        const { answers, last_question_id, last_question_index } = body

        if (!answers || typeof answers !== "object") {
            return NextResponse.json({ error: "answers es requerido" }, { status: 400 })
        }

        const supabase = await createClient()
        const adminSupabase = createAdminClient()
        const db = adminSupabase || supabase

        // 1. Load form + questions
        const { data: form, error: formErr } = await supabase
            .from("forms")
            .select("id, owner_email, name, settings, end_screen")
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
            const crmField = q.settings?.crm_field ||
                (q.type === "email" ? "email" : q.type === "phone" ? "whatsapp" : undefined)
            if (crmField === "nombre") nombre = strVal
            if (crmField === "email") email = strVal
            if (crmField === "whatsapp") whatsapp = strVal
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
        const pipelineStage = form.settings?.pipeline_stage || "lead_nuevo"
        const tagToAdd: string | null = form.settings?.tag || null

        // 4. Upsert lead
        let leadId: string | null = null
        let isNewLead = false

        if (email) {
            if (communityId) {
                const { data: existing } = await db
                    .from("leads")
                    .select("id")
                    .eq("email", email)
                    .eq("community_id", communityId)
                    .maybeSingle()

                if (existing) {
                    leadId = existing.id
                    await db.from("leads").update({
                        ...(whatsapp && { whatsapp, telefono: whatsapp }),
                        ...(nombre && { nombre }),
                        form_id: form.id,
                    }).eq("id", leadId)
                }
            }

            if (!leadId) {
                isNewLead = true
                leadId = `lead-${Math.random().toString(36).substring(2, 9)}`
                const { error: leadErr } = await db.from("leads").insert({
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
                    form_id: form.id,
                    fecha_ingreso: new Date().toISOString(),
                })
                if (leadErr) {
                    console.error("[Forms] Lead insert error:", leadErr)
                    leadId = null
                }
            }
        }

        // 5. Apply tag to lead
        if (leadId && tagToAdd) {
            await addTagToLead(db, leadId, tagToAdd)
        }

        // 6. Build answer rows
        const answerRows = (questions || [])
            .filter(q => answers[q.id] !== undefined && answers[q.id] !== "")
            .map(q => {
                const val = answers[q.id]
                return {
                    id: generateAnswerId(),
                    submission_id: "",
                    form_id: form.id,
                    question_id: q.id,
                    question_label: q.label,
                    value: Array.isArray(val) ? JSON.stringify(val) : String(val),
                }
            })

        // 7. Create submission record
        const submissionId = generateSubmissionId()
        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] ||
            req.headers.get("x-real-ip") || null

        await supabase.from("form_submissions").insert({
            id: submissionId,
            form_id: form.id,
            lead_id: leadId,
            ip_address: ipAddress,
            user_agent: req.headers.get("user-agent") || null,
            abandoned: false,
            last_question_id: last_question_id || null,
            last_question_index: last_question_index ?? null,
            metadata: { referrer: req.headers.get("referer") || null },
        })

        // 8. Insert answers
        if (answerRows.length > 0) {
            await supabase.from("form_answers").insert(answerRows.map(r => ({ ...r, submission_id: submissionId })))
        }

        // 9. Increment completions counter
        await incrementCounter(supabase, form.id, "completions")

        // 10. Post-submit integrations (fire-and-forget, non-blocking)
        const origin = req.nextUrl.origin
        if (leadId && email) {
            triggerEmailSequence(origin, form.id, leadId, email, nombre, communityId)
        }
        if (form.settings?.notify_email) {
            sendOwnerNotification(form.owner_email, form.name, nombre, email, whatsapp, answerRows)
        }

        // 11. Booking redirect info
        const endScreen = form.end_screen as any
        const bookingSlug = endScreen?.show_booking && endScreen?.booking_calendar_slug
            ? endScreen.booking_calendar_slug as string
            : null

        return NextResponse.json({
            ok: true,
            submission_id: submissionId,
            lead_created: isNewLead,
            lead_id: leadId,
            booking_slug: bookingSlug,
            prefill: bookingSlug ? { name: nombre, email, phone: whatsapp } : null,
        }, { status: 201 })

    } catch (err: any) {
        console.error("[Forms Submit]", err)
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
    }
}

// ─── GET /api/forms/[slug]/submit — load form + track view/start event ────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(req.url)
        const event = searchParams.get("event")

        const supabase = await createClient()

        const { data: form } = await supabase
            .from("forms")
            .select("id, name, slug, status, mode, welcome_screen, end_screen, design, settings")
            .eq("slug", slug)
            .eq("status", "published")
            .single()

        if (!form) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

        const [{ data: questions }, { data: rules }] = await Promise.all([
            supabase.from("form_questions").select("*").eq("form_id", form.id).order("order_index"),
            supabase.from("form_logic_rules").select("*").eq("form_id", form.id),
        ])

        if (event === "view" || event === "start") {
            incrementCounter(supabase, form.id, event === "view" ? "views" : "starts")
        }

        return NextResponse.json({
            form: { ...form, questions: questions || [], logic_rules: rules || [] }
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
