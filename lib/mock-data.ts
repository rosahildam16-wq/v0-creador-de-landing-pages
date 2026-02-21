// Centralized mock data for the admin CRM dashboard
// All data is generated deterministically for consistent rendering

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
  { step: 2, label: "Quiz", key: "quiz_completado" },
  { step: 3, label: "Llamada", key: "llamada_contestada" },
  { step: 4, label: "Terminal", key: "terminal_completado" },
  { step: 5, label: "WhatsApp", key: "whatsapp_leido" },
  { step: 6, label: "Login", key: "login_completado" },
  { step: 7, label: "Feed", key: "feed_visto" },
  { step: 8, label: "Sales Page", key: "sales_page_vista" },
] as const

export interface Nota {
  fecha: string
  texto: string
  autor: string
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
  // CRM
  notas: Nota[]
  asignado_a: string
}

export interface EventoActividad {
  id: string
  lead_id: string
  lead_nombre: string
  tipo: string
  descripcion: string
  fecha: string
}

// Deterministic data generation
const NOMBRES = [
  "Carlos Martinez", "Maria Garcia", "Juan Lopez", "Ana Rodriguez", "Pedro Sanchez",
  "Laura Fernandez", "Diego Torres", "Camila Herrera", "Andres Morales", "Valentina Diaz",
  "Santiago Ruiz", "Isabella Vargas", "Mateo Castro", "Sofia Mendoza", "Daniel Ortiz",
  "Lucia Romero", "Sebastian Jimenez", "Mariana Gutierrez", "Nicolas Reyes", "Gabriela Flores",
  "Alejandro Navarro", "Paula Rojas", "Felipe Cardenas", "Daniela Medina", "Ricardo Pena",
  "Andrea Molina", "Jorge Campos", "Natalia Vega", "Fernando Guerrero", "Carolina Soto",
  "Roberto Aguilar", "Monica Estrada", "Eduardo Ramirez", "Teresa Dominguez", "Francisco Paredes",
]

const EQUIPOS = ["Marco", "Daniela", "Victor", "Sin asignar"]

const FUENTES: FuenteTrafico[] = ["Meta Ads", "Instagram", "TikTok", "Google", "Organico"]

const CAMPANAS = [
  "Nomada VIP - Captacion Fria",
  "Nomada VIP - Retargeting",
  "High Ticket K - Lookalike",
  "Nomada VIP - Publico Caliente",
  "High Ticket K - Interes Crypto",
  "Nomada VIP - Video Views",
]

const EMBUDO_IDS: { id: string; tipo: TipoEmbudo }[] = [
  { id: "nomada-vip", tipo: "cita" },
  { id: "funnel-high-ticket-k", tipo: "compra" },
  { id: "franquicia-reset", tipo: "cita" },
  { id: "tu-esclavo-digital", tipo: "compra" },
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateLeads(): Lead[] {
  const rand = seededRandom(42)
  const leads: Lead[] = []
  const now = new Date(2026, 1, 15) // Feb 15, 2026

  for (let i = 0; i < NOMBRES.length; i++) {
    const r = rand
    const daysAgo = Math.floor(r() * 30)
    const ingreso = new Date(now.getTime() - daysAgo * 86400000)
    const fuenteIdx = Math.floor(r() * FUENTES.length)

    // Simulate funnel progression - later steps only if earlier ones pass
    const videoPct = Math.floor(r() * 100)
    const passedVideo = videoPct > 40
    const quizCompletado = passedVideo && r() > 0.3
    const llamadaContestada = quizCompletado && r() > 0.35
    const terminalCompletado = llamadaContestada && r() > 0.3
    const whatsappLeido = terminalCompletado && r() > 0.25
    const loginCompletado = whatsappLeido && r() > 0.3
    const feedVisto = loginCompletado && r() > 0.25
    const salesPageVista = feedVisto && r() > 0.35
    const ctaClicked = salesPageVista && r() > 0.4

    // Calculate max step reached
    let maxStep = 0
    if (videoPct > 0) maxStep = 1
    if (quizCompletado) maxStep = 2
    if (llamadaContestada) maxStep = 3
    if (terminalCompletado) maxStep = 4
    if (whatsappLeido) maxStep = 5
    if (loginCompletado) maxStep = 6
    if (feedVisto) maxStep = 7
    if (salesPageVista) maxStep = 8

    // Pipeline stage based on funnel progress and some randomness
    let etapa: EtapaPipeline = "lead_nuevo"
    if (ctaClicked) {
      etapa = r() > 0.3 ? "cerrado" : "presentado"
    } else if (maxStep >= 6) {
      etapa = r() > 0.5 ? "presentado" : "llamada_agendada"
    } else if (maxStep >= 3) {
      const roll = r()
      if (roll > 0.6) etapa = "llamada_agendada"
      else if (roll > 0.3) etapa = "contactado"
      else etapa = "no_respondio"
    } else if (maxStep >= 1) {
      etapa = r() > 0.5 ? "contactado" : "lead_nuevo"
    }
    // Some leads are lost
    if (!ctaClicked && maxStep < 5 && r() > 0.8) {
      etapa = "perdido"
    }

    const tiempoTotal = maxStep * (120 + Math.floor(r() * 300))
    const hoursAgo = Math.floor(r() * 48)
    const ultimoEvento = new Date(now.getTime() - hoursAgo * 3600000)

    // Quiz answers
    const quizAnswers = quizCompletado
      ? [
          ["Menos de $5,000 USD/mes", "$5,000-$15,000 USD/mes", "Mas de $15,000 USD/mes"][Math.floor(r() * 3)],
          ["Empleado", "Freelancer", "Empresario", "Estudiante"][Math.floor(r() * 4)],
          ["Si, ya invierto", "No, pero quiero empezar", "He invertido antes"][Math.floor(r() * 3)],
        ]
      : []

    // Notes
    const notas: Nota[] = []
    if (r() > 0.5) {
      notas.push({
        fecha: new Date(ingreso.getTime() + 86400000).toISOString(),
        texto: ["Interesado en el programa VIP", "Pregunto por precio", "Dejo de responder WhatsApp", "Muy enganchado con el video", "Pidio mas informacion"][Math.floor(r() * 5)],
        autor: EQUIPOS[Math.floor(r() * 3)],
      })
    }
    if (r() > 0.7) {
      notas.push({
        fecha: new Date(ingreso.getTime() + 172800000).toISOString(),
        texto: ["Llamada de seguimiento realizada", "Envio de propuesta", "No contesta llamadas", "Confirmo interes", "Agendada reunion"][Math.floor(r() * 5)],
        autor: EQUIPOS[Math.floor(r() * 3)],
      })
    }

    const phoneBase = `+52 ${Math.floor(r() * 900 + 100)} ${Math.floor(r() * 900 + 100)} ${Math.floor(r() * 9000 + 1000)}`

    // Campaign & embudo assignment
    const campanaIdx = Math.floor(r() * CAMPANAS.length)
    const embudoChoice = EMBUDO_IDS[Math.floor(r() * EMBUDO_IDS.length)]
    const whatsappCitaEnviado = embudoChoice.tipo === "cita" && maxStep >= 4 && r() > 0.3
    const compraCompletada = embudoChoice.tipo === "compra" && ctaClicked && r() > 0.4

    leads.push({
      id: `lead-${String(i + 1).padStart(3, "0")}`,
      nombre: NOMBRES[i],
      email: NOMBRES[i].toLowerCase().replace(/ /g, ".") + "@gmail.com",
      telefono: phoneBase,
      whatsapp: phoneBase,
      fuente: FUENTES[fuenteIdx],
      fecha_ingreso: ingreso.toISOString(),
      etapa,
      campana: CAMPANAS[campanaIdx],
      embudo_id: embudoChoice.id,
      tipo_embudo: embudoChoice.tipo,
      whatsapp_cita_enviado: whatsappCitaEnviado,
      compra_completada: compraCompletada,
      video_visto_pct: videoPct,
      llamada_contestada: llamadaContestada,
      quiz_completado: quizCompletado,
      respuestas_quiz: quizAnswers,
      terminal_completado: terminalCompletado,
      whatsapp_leido: whatsappLeido,
      login_completado: loginCompletado,
      feed_visto: feedVisto,
      sales_page_vista: salesPageVista,
      cta_clicked: ctaClicked,
      etapa_maxima_alcanzada: maxStep,
      tiempo_total_segundos: tiempoTotal,
      ultimo_evento: ultimoEvento.toISOString(),
      notas,
      asignado_a: EQUIPOS[Math.floor(r() * EQUIPOS.length)],
    })
  }

  return leads
}

export const LEADS: Lead[] = generateLeads()

// Generate activity events from leads
function generateActividad(): EventoActividad[] {
  const eventos: EventoActividad[] = []
  const now = new Date(2026, 1, 15)

  LEADS.slice(0, 15).forEach((lead, i) => {
    const tiposEvento = [
      { tipo: "ingreso", desc: `${lead.nombre} ingreso al embudo via ${lead.fuente}` },
      { tipo: "video", desc: `${lead.nombre} vio el video al ${lead.video_visto_pct}%` },
    ]
    if (lead.quiz_completado) {
      tiposEvento.push({ tipo: "quiz", desc: `${lead.nombre} completo el quiz` })
    }
    if (lead.llamada_contestada) {
      tiposEvento.push({ tipo: "llamada", desc: `${lead.nombre} contesto la llamada` })
    }
    if (lead.login_completado) {
      tiposEvento.push({ tipo: "login", desc: `${lead.nombre} completo el login` })
    }
    if (lead.cta_clicked) {
      tiposEvento.push({ tipo: "cta", desc: `${lead.nombre} hizo clic en el CTA de venta` })
    }

    tiposEvento.forEach((ev, j) => {
      const hoursAgo = (i * 3 + j * 1.5)
      eventos.push({
        id: `ev-${i}-${j}`,
        lead_id: lead.id,
        lead_nombre: lead.nombre,
        tipo: ev.tipo,
        descripcion: ev.desc,
        fecha: new Date(now.getTime() - hoursAgo * 3600000).toISOString(),
      })
    })
  })

  return eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
}

export const ACTIVIDAD: EventoActividad[] = generateActividad()

// Aggregated metrics
export function getMetricas() {
  const total = LEADS.length
  const hoy = LEADS.filter((l) => {
    const d = new Date(l.fecha_ingreso)
    return d.getDate() === 15 && d.getMonth() === 1
  }).length

  const cerrados = LEADS.filter((l) => l.etapa === "cerrado").length
  const conCta = LEADS.filter((l) => l.cta_clicked).length
  const tasaConversion = total > 0 ? ((conCta / total) * 100) : 0

  return {
    total,
    hoy,
    cplPromedio: 12.50,
    tasaConversion: Math.round(tasaConversion * 10) / 10,
    cerrados,
    cambioSemanal: 12.5,
    ingresosHoy: 0,
    ingresosTotales: 0,
  }
}

// Leads per day for the last 30 days
export function getLeadsPorDia(): { fecha: string; leads: number }[] {
  const now = new Date(2026, 1, 15)
  const data: { fecha: string; leads: number }[] = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000)
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}`
    const count = LEADS.filter((l) => {
      const d = new Date(l.fecha_ingreso)
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth()
    }).length
    data.push({ fecha: dateStr, leads: count })
  }

  return data
}

// Leads per source
export function getLeadsPorFuente(): { fuente: string; cantidad: number; fill: string }[] {
  const fuentesFiltradas: FuenteTrafico[] = ["Meta Ads", "Organico"]
  const colors: Record<string, string> = {
    "Meta Ads": "hsl(var(--chart-1))",
    "Organico": "hsl(var(--chart-5))",
  }

  return fuentesFiltradas.map((f) => ({
    fuente: f,
    cantidad: LEADS.filter((l) => l.fuente === f).length,
    fill: colors[f],
  }))
}

// Funnel conversion data
export function getConversionEmbudo(): { etapa: string; cantidad: number; pct: number }[] {
  const total = LEADS.length
  return FUNNEL_STEPS.map((step) => {
    const count = LEADS.filter((l) => l.etapa_maxima_alcanzada >= step.step).length
    return {
      etapa: step.label,
      cantidad: count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
}

// Temperature distribution
export function getDistribucionTemperatura(): { temperatura: string; cantidad: number; fill: string }[] {
  const frio = LEADS.filter((l) => {
    const score = calcularScoreBasico(l)
    return score < 34
  }).length
  const tibio = LEADS.filter((l) => {
    const score = calcularScoreBasico(l)
    return score >= 34 && score < 67
  }).length
  const caliente = LEADS.filter((l) => {
    const score = calcularScoreBasico(l)
    return score >= 67
  }).length

  return [
    { temperatura: "Frio", cantidad: frio, fill: "hsl(210, 70%, 50%)" },
    { temperatura: "Tibio", cantidad: tibio, fill: "hsl(45, 90%, 55%)" },
    { temperatura: "Caliente", cantidad: caliente, fill: "hsl(0, 72%, 51%)" },
  ]
}

// Basic score calculation (used internally, full version in lead-scoring.ts)
function calcularScoreBasico(lead: Lead): number {
  let score = 0
  if (lead.video_visto_pct > 70) score += 10
  if (lead.llamada_contestada) score += 15
  if (lead.quiz_completado) score += 10
  if (lead.terminal_completado) score += 5
  if (lead.whatsapp_leido) score += 10
  if (lead.login_completado) score += 15
  if (lead.feed_visto) score += 10
  if (lead.sales_page_vista) score += 10
  if (lead.cta_clicked) score += 5
  return score
}
