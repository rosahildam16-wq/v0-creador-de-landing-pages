import { TEAM_MEMBERS, type TeamMember } from "./team-data"

export interface Premio {
  puesto: number
  monto: number
  moneda: string
}

export interface Challenge {
  id: string
  titulo: string
  tipo: "cantidad" | "calidad" | "ingresos" | "afiliados"
  metrica: "leads" | "cerrados" | "afiliados"
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
  premios: Premio[]
  communityId?: string // If undefined, visible to all
}

export const TIPO_LABELS: Record<Challenge["tipo"], string> = {
  cantidad: "Por cantidad",
  calidad: "Por calidad",
  ingresos: "Por ingresos",
  afiliados: "Por afiliados",
}

export const METRICA_LABELS: Record<Challenge["metrica"], string> = {
  leads: "Leads generados",
  cerrados: "Leads cerrados",
  afiliados: "Afiliados registrados",
}

export const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "top-prospectador-feb",
    titulo: "TOP PROSPECTADOR",
    tipo: "cantidad",
    metrica: "leads",
    fecha_inicio: "2026-02-07",
    fecha_fin: "2026-02-28",
    activo: true,
    premios: [
      { puesto: 1, monto: 100, moneda: "USD" },
      { puesto: 2, monto: 50, moneda: "USD" },
      { puesto: 3, monto: 25, moneda: "USD" },
    ],
  },
]

export interface RankedMember {
  member: TeamMember
  valor: number
  posicion: number
}

export function getRanking(challenge: Challenge): RankedMember[] {
  const sorted = [...TEAM_MEMBERS]
    .map((m) => ({
      member: m,
      valor: m.metricas[challenge.metrica],
      posicion: 0,
    }))
    .sort((a, b) => b.valor - a.valor)

  sorted.forEach((item, i) => {
    item.posicion = i + 1
  })

  return sorted
}

export function getDiasRestantes(fechaFin: string): number {
  const fin = new Date(fechaFin + "T23:59:59")
  const hoy = new Date()
  const diff = fin.getTime() - hoy.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function formatFechaCorta(fecha: string): string {
  const d = new Date(fecha + "T00:00:00")
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  return `${String(d.getDate()).padStart(2, "0")} ${meses[d.getMonth()]}`
}
