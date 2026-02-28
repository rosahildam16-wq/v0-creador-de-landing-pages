import { NextResponse } from "next/server"
import { createLead } from "@/lib/data"
import { normalizePhone } from "@/lib/phone-utils"
import { EMBUDOS } from "@/lib/embudos-config"
import { upsertContact, sendToWebhook, resolveWebhookUrl, resolveGHLConfig } from "@/lib/ghl-client"
import { addGHLLog } from "@/lib/ghl-log-store"
import { loadGHLConfigFromDB } from "@/lib/integrations-store"
import { qualifyLead } from "@/lib/ai-service"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/leads
// Receives lead data from the quiz registration form,
// stores via the data layer (Supabase or mock), and optionally forwards to GoHighLevel.

interface LeadPayload {
  nombre: string
  correo: string
  whatsapp: string
  embudo_id?: string
  fuente?: string
  quiz_respuestas?: Record<string, string>
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  tags?: string[]
  funnel_step?: string
  ref?: string
}

export async function POST(request: Request) {
  try {
    // Hydrate GHL config from DB before processing
    await loadGHLConfigFromDB()

    const body: LeadPayload = await request.json()

    // Validate required fields
    if (!body.nombre || !body.correo || !body.whatsapp) {
      return NextResponse.json(
        { success: false, error: "Nombre, correo y WhatsApp son obligatorios" },
        { status: 400 }
      )
    }

    // Normalize phone to E.164 using the utility
    const phoneCountryCode = process.env.MF_PHONE_COUNTRY_CODE || "+57"
    const whatsappClean = normalizePhone(body.whatsapp, phoneCountryCode)
    const emailNormalized = body.correo.trim().toLowerCase()

    // ─── Resolve Community and Sponsor from Ref ───
    let communityId = "general"
    let asignadoA = "Sin asignar"

    if (body.ref) {
      try {
        // First try static team members (Sync & memory fast)
        const { getMemberBySlug } = await import("@/lib/team-data")
        const staticMember = getMemberBySlug(body.ref)
        if (staticMember) {
          asignadoA = staticMember.id // Or staticMember.nombre
          // If we had community association in TEAM_MEMBERS, we'd use it here
        } else {
          // Then try Supabase
          const { createAdminClient } = await import("@/lib/supabase/admin")
          const supabase = createAdminClient()
          if (supabase) {
            const refsToTry = [
              body.ref,                         // exact match (jorge_leon)
              body.ref.replace(/-/g, "_"),      // slug to username (jorge-leon -> jorge_leon)
              body.ref.replace(/-/g, ""),       // slug to username (jorge-leon -> jorgeleon)
            ]

            let foundMember = null
            const refsCsv = refsToTry.map(r => `"${r}"`).join(',')
            const { data } = await supabase
              .from("community_members")
              .select("community_id, name, username")
              .or(`member_id.in.(${refsCsv}),username.in.(${refsCsv})`)
              .maybeSingle()

            if (data) {
              foundMember = data
              communityId = data.community_id
              asignadoA = data.username || data.name
            }
          }
        }
      } catch (err) {
        console.error("Attribution error:", err)
      }
    }

    // Create lead via data layer
    const lead = await createLead({
      nombre: body.nombre,
      email: emailNormalized,
      telefono: whatsappClean,
      whatsapp: whatsappClean,
      fuente: (body.fuente as import("@/lib/types").FuenteTrafico) || "Organico",
      embudo_id: body.embudo_id || "nomada-vip",
      asignado_a: asignadoA,
      community_id: communityId,
    })

    if (!lead) {
      return NextResponse.json({ success: false, error: "Error guardando lead" }, { status: 500 })
    }

    // ─── Resolve embudo config ───
    const embudoId = body.embudo_id || "nomada-vip"
    const embudo = EMBUDOS.find((e) => e.id === embudoId)
    const ghlEnabled = embudo?.ghl?.enabled ?? false
    const embudoTag = embudo?.ghl?.tag || `mf_${embudoId.replace(/-/g, "_")}`

    const firstName = body.nombre.split(" ")[0]
    const lastName = body.nombre.split(" ").slice(1).join(" ") || ""

    // ─── Forward to GoHighLevel (optional, non-blocking) ───
    const results: { ghl_webhook: string; ghl_api: string } = {
      ghl_webhook: "skipped",
      ghl_api: "skipped",
    }

    // Webhook (Metodo 1)
    const webhookUrl = resolveWebhookUrl()
    if (webhookUrl && ghlEnabled) {
      try {
        const cfg = resolveGHLConfig()
        const source = cfg?.defaultSource || process.env.MF_WEBHOOK_SOURCE || "magic-funnel"
        const eventName = process.env.MF_WEBHOOK_EVENT || "lead_created"
        const funnelStep = body.funnel_step || process.env.MF_WEBHOOK_FUNNEL_STEP || "quiz_completed"

        const defaultTagsRaw = process.env.MF_WEBHOOK_DEFAULT_TAGS || ""
        const defaultTags = defaultTagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
        const extraTags = body.tags || ["quiz-completado"]
        const allTags = [...new Set([embudoTag, "magic-funnel", ...defaultTags, ...extraTags])]

        const webhookPayload = {
          first_name: firstName,
          last_name: lastName,
          email: emailNormalized,
          phone: whatsappClean,
          source,
          tags: allTags,
          event: eventName,
          funnel_step: funnelStep,
          embudo_id: embudoId,
          timestamp: new Date().toISOString(),
          utm_source: body.utm_source || "",
          utm_medium: body.utm_medium || "",
          utm_campaign: body.utm_campaign || "",
          quiz_data: body.quiz_respuestas || {},
        }

        const webhookResult = await sendToWebhook(webhookUrl, webhookPayload)
        results.ghl_webhook = webhookResult.status === "success" ? "success" : `error-${webhookResult.httpCode || "network"}`

        await addGHLLog({
          embudoId,
          embudoNombre: embudo?.nombre,
          leadEmail: emailNormalized,
          leadNombre: body.nombre,
          method: "webhook",
          action: webhookResult.action,
          status: webhookResult.status === "retrying" ? "error" : webhookResult.status,
          httpCode: webhookResult.httpCode,
          contactId: webhookResult.contactId,
          attempt: webhookResult.attempt,
          maxAttempts: webhookResult.maxAttempts,
          elapsed: webhookResult.elapsed,
          tag: embudoTag,
          payloadSent: webhookResult.payloadSent,
          responseBody: webhookResult.responseBody,
        })
      } catch (err) {
        results.ghl_webhook = `error: ${err instanceof Error ? err.message : "unknown"}`
      }
    }

    // API v2 (Metodo 2) - upsert with tag merge
    const ghlCfg = resolveGHLConfig()
    if (ghlCfg && ghlEnabled) {
      try {
        const extraTags = body.tags || ["quiz-completado"]
        const allTags = [...new Set([embudoTag, "magic-funnel", ...extraTags])]

        const apiResult = await upsertContact({
          firstName,
          lastName,
          email: emailNormalized,
          phone: whatsappClean,
          source: ghlCfg.defaultSource,
          tags: allTags,
        })

        results.ghl_api = apiResult.status === "success"
          ? (apiResult.action === "updated" ? "updated" : "success")
          : `error-${apiResult.httpCode || "network"}`

        await addGHLLog({
          embudoId,
          embudoNombre: embudo?.nombre,
          leadEmail: emailNormalized,
          leadNombre: body.nombre,
          method: "api",
          action: apiResult.action,
          status: apiResult.status === "retrying" ? "error" : apiResult.status,
          httpCode: apiResult.httpCode,
          contactId: apiResult.contactId,
          attempt: apiResult.attempt,
          maxAttempts: apiResult.maxAttempts,
          elapsed: apiResult.elapsed,
          tag: embudoTag,
          payloadSent: apiResult.payloadSent,
          responseBody: apiResult.responseBody,
        })
      } catch (err) {
        results.ghl_api = `error: ${err instanceof Error ? err.message : "unknown"}`
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Lead registrado correctamente",
      lead_id: lead.id,
      embudo_id: embudoId,
      ghl_tag: embudoTag,
      integrations: results,
    })

    // ─── AI PROSPECTOR (Background Analysis) ───
    if (body.quiz_respuestas && Object.keys(body.quiz_respuestas).length > 0) {
      // We do this non-blocking to return response faster
      ; (async () => {
        try {
          const quizList = Object.entries(body.quiz_respuestas || {}).map(([q, a]) => ({
            pregunta: q,
            respuesta: a
          }))

          const insight = await qualifyLead(body, quizList)

          if (insight) {
            const supabase = createAdminClient()
            if (supabase) {
              await supabase.from("lead_insights").insert({
                lead_id: lead.id,
                qualification_score: insight.score,
                summary: insight.summary,
                recommended_action: insight.action,
                suggested_message: insight.icebreaker,
                raw_ai_analysis: insight
              })

              // Send a notification if score is high (Unicorn Alert)
              if (insight.score >= 8) {
                console.log(`🔥 HIGH QUALITY LEAD for ${asignadoA}: ${body.nombre} (${insight.score}/10)`)
              }
            }
          }
        } catch (error) {
          console.error("AI Prospector Error:", error)
        }
      })()
    }

    return response
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: `Error del servidor: ${err instanceof Error ? err.message : "desconocido"}`,
      },
      { status: 500 }
    )
  }
}
