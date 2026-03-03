/**
 * Data layer for the CRM.
 *
 * When Supabase is not configured we fall back to in-memory mock data
 * so the admin dashboard works without any external dependency.
 * Write operations (create, update) mutate the in-memory array for the
 * current server process — data resets on restart which is fine for demo.
 */

import {
  LEADS as SEED_LEADS,
  ACTIVIDAD as SEED_ACTIVIDAD,
  getMetricas as getMockMetricas,
  getLeadsPorDia as getMockLeadsPorDia,
  getLeadsPorFuente as getMockLeadsPorFuente,
  getConversionEmbudo as getMockConversionEmbudo,
  getDistribucionTemperatura as getMockDistribucionTemperatura,
} from "./mock-data"
import type { Lead, Nota, EventoActividad, EtapaPipeline, FuenteTrafico, TipoEmbudo, CampanaEmail } from "./types"
import { FUNNEL_STEPS } from "./types"
import { calcularTemperatura } from "./lead-scoring"

// ─── In-memory store (seeded from mock-data) ───

const leads: Lead[] = SEED_LEADS.map((l) => ({
  ...l,
  // Ensure new fields exist (backwards compat)
  campana: l.campana || "",
  embudo_id: l.embudo_id || "nomada-vip",
  tipo_embudo: l.tipo_embudo || "cita",
  whatsapp_cita_enviado: l.whatsapp_cita_enviado || false,
  compra_completada: l.compra_completada || false,
  // Normalise notas from mock-data shape → types.ts Nota shape
  notas: (l.notas || []).map((n, i) => ({
    id: `note-${l.id}-${i}`,
    lead_id: l.id,
    texto: n.texto,
    autor: n.autor,
    created_at: n.fecha,
  })),
  community_id: (l as any).community_id || "general",
}))

const actividad: EventoActividad[] = SEED_ACTIVIDAD.map((a) => ({
  ...a,
  created_at: a.fecha,
}))

const campanasEmail: CampanaEmail[] = []

// ─── Helper to detect if Supabase is available ───

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
}

// ─── READ OPERATIONS ───

export async function getLeads(): Promise<Lead[]> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("fecha_ingreso", { ascending: false })
    if (error) {
      console.error("Error fetching leads:", error.message)
      return []
    }
    return (data || []).map((row: Record<string, any>) => mapLeadRow(row))
  }
  return []
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return null
    const [leadResult, notasResult] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).single(),
      supabase.from("notas").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    ])
    if (!leadResult.error && leadResult.data) {
      const notas: Nota[] = (notasResult.data || []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        lead_id: n.lead_id as string,
        texto: n.texto as string,
        autor: n.autor as string,
        created_at: n.created_at as string,
      }))
      return mapLeadRow(leadResult.data, notas)
    }
  }
  // Fallback
  return leads.find((l) => l.id === id) || null
}

export async function getActividad(limit = 15): Promise<EventoActividad[]> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from("eventos_actividad")
      .select("*, leads(nombre)")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (!error && data) {
      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        lead_id: row.lead_id as string,
        lead_nombre: ((row.leads as { nombre?: string } | null)?.nombre) || "Desconocido",
        tipo: row.tipo as string,
        descripcion: row.descripcion as string,
        created_at: row.created_at as string,
      }))
    }
  }
  return actividad.slice(0, limit)
}

// ─── METRICS ───

export async function getMetricas() {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return getMockMetricas()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const [totalResult, todayResult, cerradosResult, ctaResult] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("fecha_ingreso", startOfDay),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("etapa", "cerrado"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("cta_clicked", true),
    ])
    const total = totalResult.count || 0
    const hoy = todayResult.count || 0
    const cerrados = cerradosResult.count || 0
    const conCta = ctaResult.count || 0
    const tasaConversion = total > 0 ? Math.round((conCta / total) * 1000) / 10 : 0
    return { total, hoy, cplPromedio: 12.5, tasaConversion, cerrados, cambioSemanal: 0, ingresosHoy: 0, ingresosTotales: 0 }
  }
  return getMockMetricas()
}

export async function getLeadsPorDia(): Promise<{ fecha: string; leads: number }[]> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return getMockLeadsPorDia()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
    const { data: dbLeads } = await supabase.from("leads").select("fecha_ingreso").gte("fecha_ingreso", thirtyDaysAgo)
    const countMap = new Map<string, number>()
    for (const lead of dbLeads || []) {
      const d = new Date(lead.fecha_ingreso as string)
      const key = `${d.getDate()}/${d.getMonth() + 1}`
      countMap.set(key, (countMap.get(key) || 0) + 1)
    }
    const result: { fecha: string; leads: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86400000)
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`
      result.push({ fecha: dateStr, leads: countMap.get(dateStr) || 0 })
    }
    return result
  }
  return getMockLeadsPorDia()
}

export async function getLeadsPorFuente(): Promise<{ fuente: string; cantidad: number; fill: string }[]> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return []
    const colors: Record<string, string> = {
      "Meta Ads": "hsl(var(--chart-1))",
      Organico: "hsl(var(--chart-5))",
    }
    const fuentes: FuenteTrafico[] = ["Meta Ads", "Organico"]
    const { data } = await supabase.from("leads").select("fuente")
    return fuentes.map((f) => ({
      fuente: f,
      cantidad: (data || []).filter((l: { fuente: string }) => l.fuente === f).length,
      fill: colors[f],
    }))
  }
  return getMockLeadsPorFuente()
}

export async function getConversionEmbudo(): Promise<{ etapa: string; cantidad: number; pct: number }[]> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return []
    const { data, count } = await supabase.from("leads").select("etapa_maxima_alcanzada", { count: "exact" })
    const total = count || 0
    return FUNNEL_STEPS.map((step) => {
      const cnt = (data || []).filter((l: { etapa_maxima_alcanzada: number }) => l.etapa_maxima_alcanzada >= step.step).length
      return { etapa: step.label, cantidad: cnt, pct: total > 0 ? Math.round((cnt / total) * 100) : 0 }
    })
  }
  return getMockConversionEmbudo()
}

export async function getDistribucionTemperatura(): Promise<{ temperatura: string; cantidad: number; fill: string }[]> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return []
    const { data } = await supabase.from("leads").select(
      "video_visto_pct, llamada_contestada, quiz_completado, terminal_completado, whatsapp_leido, login_completado, feed_visto, sales_page_vista, cta_clicked"
    )
    let frio = 0, tibio = 0, caliente = 0
    for (const row of data || []) {
      const lead = mapLeadRow(row)
      const { temperatura } = calcularTemperatura(lead)
      if (temperatura === "CALIENTE") caliente++
      else if (temperatura === "TIBIO") tibio++
      else frio++
    }
    return [
      { temperatura: "Frio", cantidad: frio, fill: "hsl(210, 70%, 50%)" },
      { temperatura: "Tibio", cantidad: tibio, fill: "hsl(45, 90%, 55%)" },
      { temperatura: "Caliente", cantidad: caliente, fill: "hsl(0, 72%, 51%)" },
    ]
  }
  return getMockDistribucionTemperatura()
}

// ─── WRITE OPERATIONS ───

export async function createLead(leadData: {
  nombre: string
  email: string
  telefono?: string
  whatsapp?: string
  fuente?: FuenteTrafico
  embudo_id?: string
  asignado_a?: string
  community_id?: string
  pais?: string
  trafico?: "Organico" | "Pauta"
}): Promise<Lead | null> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return null

    try {
      // Insert with columns PostgREST can see
      const { data, error } = await supabase
        .from("leads")
        .insert({
          nombre: leadData.nombre,
          email: leadData.email.trim().toLowerCase(),
          telefono: leadData.telefono || "",
          whatsapp: leadData.whatsapp || leadData.telefono || "",
          fuente: leadData.fuente || "Organico",
          asignado_a: leadData.asignado_a || "Sin asignar",
        })
        .select()
        .single()

      if (!error && data) return mapLeadRow(data)
      if (error) console.error("Lead insert error:", error.message)
    } catch (e: any) {
      console.error("Lead insert exception:", e.message)
    }
  }

  return null


  // Fallback: in-memory
  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    nombre: leadData.nombre,
    email: leadData.email.trim().toLowerCase(),
    telefono: leadData.telefono || "",
    whatsapp: leadData.whatsapp || leadData.telefono || "",
    fuente: leadData.fuente || "Organico",
    fecha_ingreso: new Date().toISOString(),
    etapa: "lead_nuevo",
    campana: "",
    embudo_id: leadData.embudo_id || "nomada-vip",
    tipo_embudo: "cita",
    whatsapp_cita_enviado: false,
    compra_completada: false,
    video_visto_pct: 0,
    llamada_contestada: false,
    quiz_completado: false,
    respuestas_quiz: [],
    terminal_completado: false,
    whatsapp_leido: false,
    login_completado: false,
    feed_visto: false,
    sales_page_vista: false,
    cta_clicked: false,
    etapa_maxima_alcanzada: 0,
    tiempo_total_segundos: 0,
    ultimo_evento: new Date().toISOString(),
    notas: [],
    asignado_a: leadData.asignado_a || "Sin asignar",
    community_id: leadData.community_id || "general",
    pais: leadData.pais,
    trafico: leadData.trafico || "Organico",
  }
  leads.unshift(newLead)
  return newLead
}

export async function updateLeadFunnelProgress(
  leadId: string,
  step: number,
  stepName?: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return false

    const update: any = {
      etapa_maxima_alcanzada: step,
      ultimo_evento: new Date().toISOString()
    }

    // Map step to lead boolean field
    const stepToField: Record<number, string> = {
      1: 'video_visto_pct', // will treat as 100 for simplicity
      2: 'llamada_contestada',
      3: 'quiz_completado',
      4: 'terminal_completado',
      5: 'whatsapp_leido',
      6: 'login_completado',
      7: 'feed_visto',
      8: 'sales_page_vista',
      9: 'cta_clicked'
    }

    const field = stepToField[step]
    if (field) {
      update[field] = (field === 'video_visto_pct') ? 100 : true
    }

    const { error } = await supabase
      .from("leads")
      .update(update)
      .eq("id", leadId)

    if (error) { console.error("Error updating lead progress:", error); return false }
    return true
  }

  // Fallback
  const lead = leads.find(l => l.id === leadId)
  if (lead) {
    lead.etapa_maxima_alcanzada = Math.max(lead.etapa_maxima_alcanzada, step)
    lead.ultimo_evento = new Date().toISOString()
    const stepToField: Record<number, keyof Lead> = {
      1: 'video_visto_pct',
      2: 'llamada_contestada',
      3: 'quiz_completado',
      4: 'terminal_completado',
      5: 'whatsapp_leido',
      6: 'login_completado',
      7: 'feed_visto',
      8: 'sales_page_vista',
      9: 'cta_clicked'
    }
    const field = stepToField[step]
    if (field) {
      (lead as any)[field] = (field === 'video_visto_pct') ? 100 : true
    }
    return true
  }
  return false
}

export async function updateLeadEtapa(leadId: string, etapa: EtapaPipeline): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return false
    const { error } = await supabase
      .from("leads")
      .update({ etapa, ultimo_evento: new Date().toISOString() })
      .eq("id", leadId)
    if (error) { console.error("Error updating lead stage:", error); return false }
    return true
  }
  const lead = leads.find((l) => l.id === leadId)
  if (lead) {
    lead.etapa = etapa
    lead.ultimo_evento = new Date().toISOString()
    return true
  }
  return false
}

export async function addNota(leadId: string, texto: string, autor: string = "Sistema"): Promise<Nota | null> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return null
    const { data, error } = await supabase
      .from("notas")
      .insert({ lead_id: leadId, texto, autor })
      .select()
      .single()
    if (error) { console.error("Error adding nota:", error); return null }
    return { id: data.id, lead_id: data.lead_id, texto: data.texto, autor: data.autor, created_at: data.created_at }
  }
  const nota: Nota = {
    id: `note-${Date.now()}`,
    lead_id: leadId,
    texto,
    autor,
    created_at: new Date().toISOString(),
  }
  const lead = leads.find((l) => l.id === leadId)
  if (lead) lead.notas.unshift(nota)
  return nota
}

export async function registrarEvento(leadId: string, tipo: string, descripcion: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return
    await supabase.from("eventos_actividad").insert({ lead_id: leadId, tipo, descripcion })
    return
  }
  actividad.unshift({
    id: `ev-${Date.now()}`,
    lead_id: leadId,
    lead_nombre: leads.find((l) => l.id === leadId)?.nombre || "Desconocido",
    tipo,
    descripcion,
    created_at: new Date().toISOString(),
  })
}

// ─── Row mapper (Supabase rows → Lead) ───

function mapLeadRow(row: Record<string, unknown>, notas: Nota[] = []): Lead {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    email: row.email as string,
    telefono: (row.telefono as string) || "",
    whatsapp: (row.whatsapp as string) || "",
    fuente: (row.fuente as FuenteTrafico) || "Organico",
    fecha_ingreso: row.fecha_ingreso as string,
    etapa: (row.etapa as EtapaPipeline) || "lead_nuevo",
    campana: (row.campana as string) || "",
    embudo_id: (row.embudo_id as string) || "nomada-vip",
    tipo_embudo: (row.tipo_embudo as TipoEmbudo) || "cita",
    whatsapp_cita_enviado: (row.whatsapp_cita_enviado as boolean) || false,
    compra_completada: (row.compra_completada as boolean) || false,
    video_visto_pct: (row.video_visto_pct as number) || 0,
    llamada_contestada: (row.llamada_contestada as boolean) || false,
    quiz_completado: (row.quiz_completado as boolean) || false,
    respuestas_quiz: (row.respuestas_quiz as string[]) || [],
    terminal_completado: (row.terminal_completado as boolean) || false,
    whatsapp_leido: (row.whatsapp_leido as boolean) || false,
    login_completado: (row.login_completado as boolean) || false,
    feed_visto: (row.feed_visto as boolean) || false,
    sales_page_vista: (row.sales_page_vista as boolean) || false,
    cta_clicked: (row.cta_clicked as boolean) || false,
    etapa_maxima_alcanzada: (row.etapa_maxima_alcanzada as number) || 0,
    tiempo_total_segundos: (row.tiempo_total_segundos as number) || 0,
    ultimo_evento: (row.ultimo_evento as string) || (row.fecha_ingreso as string),
    notas,
    asignado_a: (row.asignado_a as string) || "Sin asignar",
    community_id: (row.community_id as string) || "general",
    pais: row.pais as string,
    trafico: row.trafico as "Organico" | "Pauta",
  }
}

// ─── EMAIL CAMPAIGNS ───

export async function getCampanasEmail(): Promise<CampanaEmail[]> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from("campanas_email")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) return data
  }
  return [...campanasEmail]
}

export async function createCampanaEmail(campana: Omit<CampanaEmail, "id" | "created_at" | "leads_alcanzados" | "enviado_en">): Promise<CampanaEmail | null> {
  const newCampana: CampanaEmail = {
    ...campana,
    id: `camp-${Date.now()}`,
    created_at: new Date().toISOString(),
    leads_alcanzados: 0,
    enviado_en: null
  }

  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (!supabase) return null
    try {
      const { data, error } = await supabase.from("campanas_email").insert(newCampana).select().single()
      if (!error && data) return data
    } catch { /* Fallback if table doesn't exist */ }
  }

  campanasEmail.unshift(newCampana)
  return newCampana
}

export async function updateCampanaEmail(id: string, updates: Partial<CampanaEmail>): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    if (supabase) {
      const { error } = await supabase.from("campanas_email").update(updates).eq("id", id)
      if (!error) return true
    }
  }

  const idx = campanasEmail.findIndex(c => c.id === id)
  if (idx > -1) {
    campanasEmail[idx] = { ...campanasEmail[idx], ...updates }
    return true
  }
  return false
}
