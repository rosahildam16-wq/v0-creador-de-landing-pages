export interface TeamMember {
  id: string
  nombre: string
  email: string
  avatar_initials: string
  publicidad_activa: boolean
  fecha_renovacion: string | null
  metricas: {
    leads: number
    cerrados: number
    afiliados: number
  }
  publicidad: {
    inversion_total: number
    saldo_disponible: number
    leads_totales: number
    leads_cerrados: number
  }
  organico: {
    saldo_disponible: number
    leads_totales: number
    leads_cerrados: number
  }
  embudos_asignados: string[]
  fecha_ingreso: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "yanoskhy",
    nombre: "Yanoskhy",
    email: "yanoskhy@correo.com",
    avatar_initials: "YA",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 29, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 48, saldo_disponible: 48, leads_totales: 0, leads_cerrados: 0 },
    organico: { saldo_disponible: 48, leads_totales: 0, leads_cerrados: 0 },
    embudos_asignados: ["nomada-vip", "franquicia-reset"],
    fecha_ingreso: "2025-12-01",
  },
  {
    id: "leidy-fabiana",
    nombre: "Leidy Fabiana Ferr...",
    email: "leidy@correo.com",
    avatar_initials: "LF",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 19, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 48, saldo_disponible: 22, leads_totales: 12, leads_cerrados: 0 },
    organico: { saldo_disponible: 22, leads_totales: 12, leads_cerrados: 0 },
    embudos_asignados: ["funnel-high-ticket-k"],
    fecha_ingreso: "2025-12-05",
  },
  {
    id: "marisol-lopez",
    nombre: "Marisol Lopez",
    email: "marisol@correo.com",
    avatar_initials: "ML",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 18, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 48, saldo_disponible: 26, leads_totales: 10, leads_cerrados: 0 },
    organico: { saldo_disponible: 26, leads_totales: 10, leads_cerrados: 0 },
    embudos_asignados: ["tu-esclavo-digital", "nomada-vip"],
    fecha_ingreso: "2025-12-10",
  },
  {
    id: "santiago-betancur",
    nombre: "Santiago Betancur",
    email: "santiago@correo.com",
    avatar_initials: "SB",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 16, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 48, saldo_disponible: 22, leads_totales: 12, leads_cerrados: 0 },
    organico: { saldo_disponible: 22, leads_totales: 12, leads_cerrados: 0 },
    embudos_asignados: ["franquicia-reset", "funnel-high-ticket-k"],
    fecha_ingreso: "2025-12-15",
  },
  {
    id: "francisco-morales",
    nombre: "Francisco Morales",
    email: "francisco@correo.com",
    avatar_initials: "FM",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 15, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 48, saldo_disponible: 30, leads_totales: 8, leads_cerrados: 0 },
    organico: { saldo_disponible: 30, leads_totales: 8, leads_cerrados: 0 },
    embudos_asignados: ["nomada-vip"],
    fecha_ingreso: "2026-01-02",
  },
  {
    id: "william-gomez",
    nombre: "William Gomez",
    email: "william@correo.com",
    avatar_initials: "WG",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 14, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 48, saldo_disponible: 28, leads_totales: 9, leads_cerrados: 0 },
    organico: { saldo_disponible: 28, leads_totales: 9, leads_cerrados: 0 },
    embudos_asignados: ["tu-esclavo-digital"],
    fecha_ingreso: "2026-01-05",
  },
  {
    id: "mundo-cripto-jc",
    nombre: "Mundo Cripto JC",
    email: "mundocripto@correo.com",
    avatar_initials: "MC",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 13, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 48, saldo_disponible: 24, leads_totales: 11, leads_cerrados: 0 },
    organico: { saldo_disponible: 24, leads_totales: 11, leads_cerrados: 0 },
    embudos_asignados: ["franquicia-reset", "tu-esclavo-digital"],
    fecha_ingreso: "2026-01-10",
  },
  {
    id: "cristian-fernandez",
    nombre: "Cristian Fernandez",
    email: "cristian@correo.com",
    avatar_initials: "CF",
    publicidad_activa: false,
    fecha_renovacion: null,
    metricas: { leads: 4, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 0, saldo_disponible: 0, leads_totales: 0, leads_cerrados: 0 },
    organico: { saldo_disponible: 0, leads_totales: 4, leads_cerrados: 0 },
    embudos_asignados: ["nomada-vip"],
    fecha_ingreso: "2026-01-20",
  },
]

export function getTeamMembers(): TeamMember[] {
  return TEAM_MEMBERS
}

export function getTeamMemberById(id: string): TeamMember | undefined {
  return TEAM_MEMBERS.find((m) => m.id === id)
}
