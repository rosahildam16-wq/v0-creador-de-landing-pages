import { NextRequest, NextResponse } from "next/server"
import { getLeads, getLeadById } from "@/lib/data"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import type { Lead } from "@/lib/types"

export const dynamic = "force-dynamic"

// ─── Access matrix ────────────────────────────────────────────────────────────
//   super_admin      → full lead data + audit every view
//   admin            → summary (no PII: masked email/phone, no quiz answers)
//   compliance_admin → full lead data (fraud detection) + audit every view
//   support_admin    → masked (first name only, etapa, fecha, community_id)
//   finance_admin    → 403 (leads are not financial data)
// ─────────────────────────────────────────────────────────────────────────────

type LeadView = "full" | "summary" | "masked"

const ROLE_VIEW: Record<string, LeadView | null> = {
  super_admin:      "full",
  admin:            "summary",
  compliance_admin: "full",
  support_admin:    "masked",
  finance_admin:    null,   // no access
}

/** Mask PII fields for support_admin — first name only, no contact details. */
function maskLead(lead: Lead) {
  const firstName = lead.nombre.split(" ")[0]
  return {
    id:                lead.id,
    nombre:            `${firstName} ***`,
    etapa:             lead.etapa,
    fecha_ingreso:     lead.fecha_ingreso,
    fuente:            lead.fuente,
    community_id:      lead.community_id,
    trafico:           lead.trafico ?? null,
    // PII stripped
    email:             "***@***.***",
    telefono:          "***",
    whatsapp:          "***",
    pais:              lead.pais ?? null,
  }
}

/** Summary view for platform_admin — no full contact info, no quiz answers. */
function summariseLead(lead: Lead) {
  return {
    id:                lead.id,
    nombre:            lead.nombre,
    etapa:             lead.etapa,
    fecha_ingreso:     lead.fecha_ingreso,
    fuente:            lead.fuente,
    community_id:      lead.community_id,
    trafico:           lead.trafico ?? null,
    campana:           lead.campana,
    embudo_id:         lead.embudo_id,
    pais:              lead.pais ?? null,
    compra_completada: lead.compra_completada,
    // PII masked
    email:   lead.email.replace(/(.{2}).+(@.+)/, "$1***$2"),
    telefono: lead.telefono.slice(0, 4) + "****",
    whatsapp: lead.whatsapp.slice(0, 4) + "****",
    // Behavioral metrics (no raw quiz answers)
    video_visto_pct:         lead.video_visto_pct,
    llamada_contestada:      lead.llamada_contestada,
    quiz_completado:         lead.quiz_completado,
    terminal_completado:     lead.terminal_completado,
    etapa_maxima_alcanzada:  lead.etapa_maxima_alcanzada,
    tiempo_total_segundos:   lead.tiempo_total_segundos,
    tags:                    lead.tags ?? [],
  }
}

function applyView(lead: Lead, view: LeadView) {
  if (view === "masked")  return maskLead(lead)
  if (view === "summary") return summariseLead(lead)
  return lead  // "full"
}

// ─── GET /api/admin/leads ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Auth
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  // 2. Determine view level
  const view = ROLE_VIEW[guard.user.role]
  if (view === null) {
    return NextResponse.json({ error: "Acceso denegado. Los datos de leads no son accesibles desde este rol." }, { status: 403 })
  }

  const meta = getRequestMeta(request)
  const actorId = getActorId(guard.user)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const lead = await getLeadById(id)
      if (!lead) {
        return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
      }

      // Audit individual lead views (full/compliance only — avoid log spam for masked views)
      if (view === "full") {
        void logAuditEvent({
          actor_user_id: actorId,
          actor_role:    guard.user.role,
          action_type:   "view_lead",
          target_type:   "lead",
          target_id:     id,
          payload:       { lead_nombre: lead.nombre, view_level: view },
          ...meta,
        })
      }

      return NextResponse.json(applyView(lead, view))
    }

    // List all leads
    const leads = await getLeads()

    // Audit bulk list access for full-access roles
    if (view === "full") {
      void logAuditEvent({
        actor_user_id: actorId,
        actor_role:    guard.user.role,
        action_type:   "view_leads_list",
        target_type:   "leads",
        payload:       { count: leads.length, view_level: view },
        ...meta,
      })
    }

    return NextResponse.json(leads.map((l) => applyView(l, view)))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("Leads API error:", message)
    return NextResponse.json(
      { error: "Error cargando leads. Es posible que las tablas no existan aun." },
      { status: 500 }
    )
  }
}
