export type PlanCode = "27" | "47" | "97"

export interface PlanFeatures {
  // Dashboard
  dashboard: boolean
  // Leads / CRM
  leads: boolean
  leadsLimit: number // -1 = unlimited
  // Pipeline
  pipeline: boolean
  pipelineStagesLimit: number
  // Magic Builder (landing pages / funnels)
  builder: boolean
  buildersLimit: number
  // Form Builder
  forms: boolean
  formsLimit: number
  // Citas / Agendamiento
  agendamiento: boolean
  calendariosLimit: number
  // Mi Equipo
  miEquipo: boolean
  teamLimit: number
  // Integraciones (Google Calendar, Zoom, WhatsApp)
  integraciones: boolean
  googleCalendar: boolean
  zoom: boolean
  whatsapp: boolean
  // Social Center
  socialCenter: boolean
  // Meta Ads & Pixel tracking
  metaAds: boolean
  // Mailing
  mailing: boolean
  mailingLimit: number
  // Comisiones / Afiliados
  comisiones: boolean
  // Academia y Retos
  academia: boolean
  retos: boolean
  // Comunidad
  comunidad: boolean
  // Recursos / Librería
  recursos: boolean
}

export interface PlanConfig {
  code: PlanCode
  name: string
  price: number
  color: string
  features: PlanFeatures
}

export const PLANS: Record<PlanCode, PlanConfig> = {
  "27": {
    code: "27",
    name: "Starter",
    price: 27,
    color: "#6366f1",
    features: {
      dashboard: true,
      leads: true,
      leadsLimit: 100,
      pipeline: true,
      pipelineStagesLimit: 3,
      builder: true,
      buildersLimit: 1,
      forms: false,
      formsLimit: 0,
      agendamiento: false,
      calendariosLimit: 0,
      miEquipo: false,
      teamLimit: 0,
      integraciones: false,
      googleCalendar: false,
      zoom: false,
      whatsapp: false,
      socialCenter: false,
      metaAds: false,
      mailing: false,
      mailingLimit: 0,
      comisiones: false,
      academia: true,
      retos: true,
      comunidad: true,
      recursos: true,
    },
  },
  "47": {
    code: "47",
    name: "Growth",
    price: 47,
    color: "#8b5cf6",
    features: {
      dashboard: true,
      leads: true,
      leadsLimit: 500,
      pipeline: true,
      pipelineStagesLimit: 10,
      builder: true,
      buildersLimit: 5,
      forms: true,
      formsLimit: 5,
      agendamiento: true,
      calendariosLimit: 1,
      miEquipo: true,
      teamLimit: 10,
      integraciones: true,
      googleCalendar: true,
      zoom: true,
      whatsapp: true,
      socialCenter: true,
      metaAds: false,
      mailing: false,
      mailingLimit: 0,
      comisiones: true,
      academia: true,
      retos: true,
      comunidad: true,
      recursos: true,
    },
  },
  "97": {
    code: "97",
    name: "Pro",
    price: 97,
    color: "#d946ef",
    features: {
      dashboard: true,
      leads: true,
      leadsLimit: -1,
      pipeline: true,
      pipelineStagesLimit: -1,
      builder: true,
      buildersLimit: -1,
      forms: true,
      formsLimit: -1,
      agendamiento: true,
      calendariosLimit: -1,
      miEquipo: true,
      teamLimit: -1,
      integraciones: true,
      googleCalendar: true,
      zoom: true,
      whatsapp: true,
      socialCenter: true,
      metaAds: true,
      mailing: true,
      mailingLimit: -1,
      comisiones: true,
      academia: true,
      retos: true,
      comunidad: true,
      recursos: true,
    },
  },
}

/**
 * Map legacy plan IDs (basico/pro/elite/plan_27/plan_47/plan_97) to
 * normalized plan codes ("27" | "47" | "97").
 */
export function normalizePlanCode(planId?: string | null): PlanCode {
  if (!planId) return "27"
  const lower = planId.toLowerCase()
  if (lower === "47" || lower === "pro" || lower === "plan_47") return "47"
  if (lower === "97" || lower === "elite" || lower === "plan_97") return "97"
  if (lower === "27" || lower === "basico" || lower === "plan_27") return "27"
  return "27"
}

export function getPlan(planCode?: string | null): PlanConfig {
  const code = normalizePlanCode(planCode)
  return PLANS[code]
}

export function hasFeature(
  planCode: string | null | undefined,
  feature: keyof PlanFeatures,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  const plan = getPlan(planCode)
  const value = plan.features[feature]
  return typeof value === "boolean" ? value : (value as number) !== 0
}

/** Returns the minimum plan required for a feature, or null if it's in plan 27 */
export function requiredPlanFor(feature: keyof PlanFeatures): PlanCode | null {
  if (PLANS["27"].features[feature]) return null
  if (PLANS["47"].features[feature]) return "47"
  return "97"
}
