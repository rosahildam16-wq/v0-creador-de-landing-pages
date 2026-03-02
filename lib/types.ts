// Shared CRM types — used by both server and client code

export type FuenteTrafico = "Meta Ads" | "Instagram" | "TikTok" | "Google" | "Organico"

export type EtapaPipeline =
  | "lead_nuevo"
  | "contactado"
  | "llamada_agendada"
  | "no_respondio"
  | "presentado"
  | "cerrado"
  | "perdido"

export const ETAPA_LABELS: Record<EtapaPipeline, string> = {
  lead_nuevo: "Lead Nuevo",
  contactado: "Contactado",
  llamada_agendada: "Llamada Agendada",
  no_respondio: "No Respondio",
  presentado: "Presentado",
  cerrado: "Cerrado",
  perdido: "Perdido",
}

export const ETAPA_ORDER: EtapaPipeline[] = [
  "lead_nuevo",
  "contactado",
  "llamada_agendada",
  "no_respondio",
  "presentado",
  "cerrado",
  "perdido",
]

export const FUNNEL_STEPS = [
  { step: 1, label: "Video", key: "video_visto_pct" },
  { step: 2, label: "Llamada", key: "llamada_contestada" },
  { step: 3, label: "Quiz", key: "quiz_completado" },
  { step: 4, label: "Terminal", key: "terminal_completado" },
  { step: 5, label: "WhatsApp", key: "whatsapp_leido" },
  { step: 6, label: "Login", key: "login_completado" },
  { step: 7, label: "Feed", key: "feed_visto" },
  { step: 8, label: "Sales Page", key: "sales_page_vista" },
] as const

export interface Nota {
  id: string
  lead_id: string
  texto: string
  autor: string
  created_at: string
}

export type TipoEmbudo = "cita" | "compra"

export interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  whatsapp: string
  fuente: FuenteTrafico
  fecha_ingreso: string
  etapa: EtapaPipeline
  // Campaign & funnel tracking
  campana: string
  embudo_id: string
  tipo_embudo: TipoEmbudo
  whatsapp_cita_enviado: boolean
  compra_completada: boolean
  // Funnel behavior
  video_visto_pct: number
  llamada_contestada: boolean
  quiz_completado: boolean
  respuestas_quiz: string[]
  terminal_completado: boolean
  whatsapp_leido: boolean
  login_completado: boolean
  feed_visto: boolean
  sales_page_vista: boolean
  cta_clicked: boolean
  etapa_maxima_alcanzada: number
  tiempo_total_segundos: number
  ultimo_evento: string
  // AI & CRM
  notas: Nota[]
  asignado_a: string
  community_id: string
  pais?: string
  trafico?: "Organico" | "Pauta"
  insight?: {
    qualification_score: number
    summary: string
    recommended_action: string
    suggested_message: string
  }
}

export interface EventoActividad {
  id: string
  lead_id: string
  lead_nombre?: string
  tipo: string
  descripcion: string
  created_at: string
}
export type EstadoCampana = "borrador" | "programada" | "enviada" | "cancelada"

export interface CampanaEmail {
  id: string
  titulo: string
  asunto: string
  contenido_html: string
  audiencia: "todos" | "comunidad" | "miembros_activos" | "persona_especifica" | "leads_por_embudo"
  audience_filters?: {
    funnel_id?: string
    lead_ids?: string[]
  }
  community_id?: string
  programado_para: string | null // ISO date string
  estado: EstadoCampana
  autor_id: string
  autor_role: "admin" | "leader"
  leads_alcanzados: number
  enviado_en: string | null
  created_at: string
}
