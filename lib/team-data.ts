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
  {
    id: "sensei",
    nombre: "Sensei",
    email: "sensei@correo.com",
    avatar_initials: "SE",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 42, cerrados: 8, afiliados: 3 },
    publicidad: { inversion_total: 100, saldo_disponible: 40, leads_totales: 35, leads_cerrados: 5 },
    organico: { saldo_disponible: 40, leads_totales: 7, leads_cerrados: 3 },
    embudos_asignados: ["franquicia-reset", "nomada-vip"],
    fecha_ingreso: "2026-01-10",
  },
]

export function getTeamMemberById(id: string): TeamMember | undefined {
  // Check localStorage for updated funnels
  const member = TEAM_MEMBERS.find((m) => m.id === id)
  if (!member) return undefined
  try {
    const stored = localStorage.getItem(`mf_funnels_${id}`)
    if (stored) {
      return { ...member, embudos_asignados: JSON.parse(stored) }
    }
  } catch { /* noop */ }
  return member
}

import { getMemberCommunity, getCommunityById } from "./communities-data"

export function getMemberData(user: { memberId?: string, name?: string, email?: string } | null): TeamMember | null {
  if (!user) return null

  const m = user.memberId ? getTeamMemberById(user.memberId) : null

  // If we found a static member, return it (they might have custom assignments)
  if (m) return m

  // Fallback for members not in the static list
  // Get community default funnels: use session id first, then localStorage check
  const commId = (user as any)?.communityId || (user.memberId ? getMemberCommunity(user.memberId)?.id : undefined)
  const community = commId ? getCommunityById(commId) : undefined
  const defaultFunnels = community?.embudos_default && community.embudos_default.length > 0
    ? community.embudos_default
    : ["nomada-vip"]

  return {
    id: user.memberId || "new-member",
    nombre: user.name || "Socio",
    email: user.email || "",
    avatar_initials: user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "S",
    publicidad_activa: false,
    fecha_renovacion: null,
    metricas: { leads: 0, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 0, saldo_disponible: 0, leads_totales: 0, leads_cerrados: 0 },
    organico: { saldo_disponible: 0, leads_totales: 0, leads_cerrados: 0 },
    embudos_asignados: defaultFunnels,
    fecha_ingreso: new Date().toISOString().split('T')[0],
  }
}

// Safe storage with sessionStorage fallback
function safeGetItem(key: string): string | null {
  try { const v = localStorage.getItem(key); if (v !== null) return v } catch { /* noop */ }
  try { return sessionStorage.getItem(key) } catch { /* noop */ }
  return null
}
function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* noop */ }
  try { sessionStorage.setItem(key, value) } catch { /* noop */ }
}

export function getTeamMembers(): TeamMember[] {
  return TEAM_MEMBERS.map((m) => {
    try {
      const stored = safeGetItem(`mf_funnels_${m.id}`)
      if (stored) return { ...m, embudos_asignados: JSON.parse(stored) }
    } catch { /* noop */ }
    return m
  })
}

export function updateMemberFunnels(memberId: string, funnelIds: string[]): void {
  try {
    safeSetItem(`mf_funnels_${memberId}`, JSON.stringify(funnelIds))
  } catch { /* noop */ }
  // Also update the in-memory array for immediate access
  const member = TEAM_MEMBERS.find((m) => m.id === memberId)
  if (member) {
    member.embudos_asignados = funnelIds
  }
}
