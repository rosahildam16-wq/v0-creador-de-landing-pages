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
  progreso_academia: number
  sponsorId?: string
  fecha_ingreso: string
  whatsapp_number?: string
  whatsapp_message?: string
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
    progreso_academia: 45,
    fecha_ingreso: "2026-01-10",
  },
  {
    id: "socio-1",
    nombre: "Elena Rodriguez",
    email: "elena@correo.com",
    avatar_initials: "ER",
    publicidad_activa: true,
    fecha_renovacion: "15 mar 2026",
    metricas: { leads: 120, cerrados: 8, afiliados: 2 },
    publicidad: { inversion_total: 500, saldo_disponible: 50, leads_totales: 80, leads_cerrados: 5 },
    organico: { saldo_disponible: 0, leads_totales: 40, leads_cerrados: 3 },
    embudos_asignados: ["franquicia-reset"],
    progreso_academia: 85,
    sponsorId: "sensei",
    fecha_ingreso: "2026-01-15",
  },
  {
    id: "socio-2",
    nombre: "Ricardo Sosa",
    email: "ricardo@correo.com",
    avatar_initials: "RS",
    publicidad_activa: false,
    fecha_renovacion: null,
    metricas: { leads: 45, cerrados: 2, afiliados: 0 },
    publicidad: { inversion_total: 0, saldo_disponible: 0, leads_totales: 0, leads_cerrados: 0 },
    organico: { saldo_disponible: 0, leads_totales: 45, leads_cerrados: 2 },
    embudos_asignados: ["nomada-vip"],
    progreso_academia: 20,
    sponsorId: "sensei",
    fecha_ingreso: "2026-02-01",
  },
  {
    id: "socio-3",
    nombre: "Sofia Vega",
    email: "sofia@correo.com",
    avatar_initials: "SV",
    publicidad_activa: true,
    fecha_renovacion: "28 mar 2026",
    metricas: { leads: 210, cerrados: 15, afiliados: 4 },
    publicidad: { inversion_total: 1200, saldo_disponible: 300, leads_totales: 150, leads_cerrados: 10 },
    organico: { saldo_disponible: 0, leads_totales: 60, leads_cerrados: 5 },
    embudos_asignados: ["franquicia-reset", "nomada-vip"],
    progreso_academia: 95,
    sponsorId: "sensei",
    fecha_ingreso: "2026-01-20",
  },
]

export function getTeamMemberById(id: string): TeamMember | undefined {
  const member = TEAM_MEMBERS.find((m) => m.id === id)
  if (!member) return undefined
  try {
    const stored = safeGetItem(`mf_funnels_${id}`)
    const storedProgress = safeGetItem(`mf_progress_${id}`)
    let result = { ...member }
    if (stored) {
      result.embudos_asignados = JSON.parse(stored)
    }
    if (storedProgress) {
      result.progreso_academia = Number(storedProgress)
    }

    // Load WhatsApp config from storage if available
    const storedNum = safeGetItem(`mf_wa_num_${id}`)
    const storedMsg = safeGetItem(`mf_wa_msg_${id}`)
    if (storedNum) result.whatsapp_number = storedNum
    if (storedMsg) result.whatsapp_message = storedMsg

    return result
  } catch { /* noop */ }
  return member
}

import { getMemberCommunity, getCommunityById } from "./communities-data"

export function getMemberBySlug(slug: string): TeamMember | undefined {
  if (!slug) return undefined
  // Normalize slug for comparison
  const normalizedSlug = slug.toLowerCase().replace(/[._-]/g, "")

  const baseMember = TEAM_MEMBERS.find((m) => {
    const memberIdMatch = m.id.toLowerCase() === slug.toLowerCase()
    const emailPrefixMatch = m.email.split('@')[0].toLowerCase().replace(/[._-]/g, "") === normalizedSlug
    return memberIdMatch || emailPrefixMatch
  })

  if (baseMember) {
    return getTeamMemberById(baseMember.id)
  }

  return undefined
}

export function updateMemberWhatsApp(memberId: string, number: string, message: string): void {
  try {
    safeSetItem(`mf_wa_num_${memberId}`, number)
    safeSetItem(`mf_wa_msg_${memberId}`, message)
  } catch { /* noop */ }

  const member = TEAM_MEMBERS.find((m) => m.id === memberId)
  if (member) {
    member.whatsapp_number = number
    member.whatsapp_message = message
  }
}

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
    progreso_academia: 0,
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
      const storedProgress = safeGetItem(`mf_progress_${m.id}`)
      let result = { ...m }
      if (stored) result.embudos_asignados = JSON.parse(stored)
      if (storedProgress) result.progreso_academia = Number(storedProgress)
      return result
    } catch { /* noop */ }
    return m
  })
}

export function updateMemberFunnels(memberId: string, funnelIds: string[]): void {
  try {
    safeSetItem(`mf_funnels_${memberId}`, JSON.stringify(funnelIds))
  } catch { /* noop */ }
  const member = TEAM_MEMBERS.find((m) => m.id === memberId)
  if (member) {
    member.embudos_asignados = funnelIds
  }
}

export function updateMemberProgress(memberId: string, progress: number): void {
  try {
    safeSetItem(`mf_progress_${memberId}`, String(progress))
  } catch { /* noop */ }
  const member = TEAM_MEMBERS.find((m) => m.id === memberId)
  if (member) {
    member.progreso_academia = progress
  }
}

export function getMemberPartners(memberId: string): TeamMember[] {
  return TEAM_MEMBERS.filter((m) => m.sponsorId === memberId)
}
