import type { Lead } from "./types"

export type Temperatura = "FRIO" | "TIBIO" | "CALIENTE"

export interface ScoreResult {
  score: number
  temperatura: Temperatura
  factores: { label: string; puntos: number; cumplido: boolean }[]
  acciones_recomendadas: string[]
}

const FACTORES = [
  { key: "video_70", label: "Video visto >70%", puntos: 10, check: (l: Lead) => l.video_visto_pct > 70 },
  { key: "llamada", label: "Llamada contestada", puntos: 15, check: (l: Lead) => l.llamada_contestada },
  { key: "quiz", label: "Quiz completado", puntos: 10, check: (l: Lead) => l.quiz_completado },
  { key: "terminal", label: "Terminal completado", puntos: 5, check: (l: Lead) => l.terminal_completado },
  { key: "whatsapp", label: "WhatsApp leido", puntos: 10, check: (l: Lead) => l.whatsapp_leido },
  { key: "login", label: "Login completado", puntos: 15, check: (l: Lead) => l.login_completado },
  { key: "feed", label: "Feed visto", puntos: 10, check: (l: Lead) => l.feed_visto },
  { key: "sales", label: "Sales page vista", puntos: 20, check: (l: Lead) => l.sales_page_vista },
  { key: "cta", label: "CTA clicked", puntos: 5, check: (l: Lead) => l.cta_clicked },
] as const

export function calcularTemperatura(lead: Lead): ScoreResult {
  const factores = FACTORES.map((f) => ({
    label: f.label,
    puntos: f.puntos,
    cumplido: f.check(lead),
  }))

  const score = factores.reduce((sum, f) => sum + (f.cumplido ? f.puntos : 0), 0)

  let temperatura: Temperatura = "FRIO"

  // Priority logic based on funnel stage
  if (lead.etapa_maxima_alcanzada >= 7 || lead.sales_page_vista || lead.cta_clicked) {
    temperatura = "CALIENTE"
  } else if (lead.etapa_maxima_alcanzada >= 4 || score >= 34) {
    temperatura = "TIBIO"
  } else if (score >= 67) {
    temperatura = "CALIENTE"
  }

  const acciones_recomendadas = getAccionesRecomendadas(temperatura, lead)

  return { score, temperatura, factores, acciones_recomendadas }
}

function getAccionesRecomendadas(temp: Temperatura, lead: Lead): string[] {
  switch (temp) {
    case "FRIO":
      return [
        "Enviar recordatorio por WhatsApp",
        "Retargetear con anuncio de Meta Ads",
        !lead.llamada_contestada ? "Intentar llamada nuevamente" : "Enviar contenido de valor",
      ]
    case "TIBIO":
      return [
        "Agendar llamada de seguimiento",
        "Enviar caso de exito por WhatsApp",
        lead.quiz_completado ? "Personalizar oferta segun respuestas del quiz" : "Invitar a completar el quiz",
      ]
    case "CALIENTE":
      return [
        "Contactar inmediatamente - lead calificado",
        "Enviar propuesta personalizada",
        "Agendar demo o presentacion final",
      ]
  }
}

export function getTemperaturaColor(temp: Temperatura): string {
  switch (temp) {
    case "FRIO": return "hsl(210, 70%, 50%)"
    case "TIBIO": return "hsl(45, 90%, 55%)"
    case "CALIENTE": return "hsl(0, 72%, 51%)"
  }
}

export function getTemperaturaBgClass(temp: Temperatura): string {
  switch (temp) {
    case "FRIO": return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "TIBIO": return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "CALIENTE": return "bg-red-500/15 text-red-400 border-red-500/30"
  }
}
