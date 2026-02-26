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
    id: "sensei",
    nombre: "Sensei",
    email: "sensei@correo.com",
    avatar_initials: "SE",
    publicidad_activa: true,
    fecha_renovacion: "22 ene 2026",
    metricas: { leads: 0, cerrados: 0, afiliados: 0 },
    publicidad: { inversion_total: 0, saldo_disponible: 0, leads_totales: 0, leads_cerrados: 0 },
    organico: { saldo_disponible: 0, leads_totales: 0, leads_cerrados: 0 },
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
