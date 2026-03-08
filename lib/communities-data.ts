// ============================================================
// COMMUNITIES SYSTEM
// Cada comunidad tiene su propio codigo de acceso, embudos
// default, y contenido aislado.
// ============================================================

export interface Community {
  id: string
  nombre: string
  codigo: string | null // null = comunidad por defecto (sin codigo)
  embudos_default: string[]
  color: string
  descripcion: string
  activa: boolean
  leaderEmail: string | null // email del lider de la comunidad
  leaderName: string | null
  cuota_miembro: number // cuanto pagan los miembros mensualmente (USD)
  mailing_enabled: boolean
  createdAt: string
}

export interface CommunityMember {
  memberId: string
  communityId: string
  email: string
  name: string
  joinedAt: string
}

// ----- Default communities -----
const DEFAULT_COMMUNITIES: Community[] = [
  {
    id: "skalia-vip",
    nombre: "Skalia VIP",
    codigo: "DIAMANTECELION",
    embudos_default: ["franquicia-reset"],
    color: "#8b5cf6",
    descripcion: "Comunidad exclusiva del equipo Skalia. Acceso completo a herramientas premium y embudos especializados.",
    activa: true,
    leaderEmail: "iajorgeleon21@gmail.com",
    leaderName: "Sensei",
    cuota_miembro: 10,
    mailing_enabled: true,
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "general",
    nombre: "General",
    codigo: null,
    embudos_default: [],
    color: "#6366f1",
    descripcion: "Usuarios registrados sin comunidad especifica. Acceso basico a la plataforma.",
    activa: true,
    leaderEmail: null,
    leaderName: null,
    cuota_miembro: 0,
    mailing_enabled: false,
    createdAt: "2026-01-01T00:00:00Z",
  },
]

// ----- Storage helpers (with sessionStorage fallback for iframe/third-party contexts) -----
function safeGet(key: string): string | null {
  try {
    const val = localStorage.getItem(key)
    if (val !== null) return val
  } catch { /* noop */ }
  try { return sessionStorage.getItem(key) } catch { /* noop */ }
  return null
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* noop */ }
  try { sessionStorage.setItem(key, value) } catch { /* noop */ }
}

// ----- Communities CRUD -----

export function getAllCommunities(): Community[] {
  const customRaw = safeGet("mf_communities")
  const custom: Community[] = customRaw ? JSON.parse(customRaw) : []
  // Merge: custom communities override defaults with same id
  const customIds = new Set(custom.map((c) => c.id))
  return [...custom, ...DEFAULT_COMMUNITIES.filter((d) => !customIds.has(d.id))]
}

export function getCommunityById(id: string): Community | undefined {
  return getAllCommunities().find((c) => c.id === id)
}

/**
 * Get the community where this email is the leader.
 */
export function getLeaderCommunity(email: string): Community | undefined {
  if (!email) return undefined
  const normalized = email.toLowerCase().trim()
  return getAllCommunities().find((c) => c.leaderEmail?.toLowerCase() === normalized && c.activa)
}

/**
 * Check if a given email is a leader of any community.
 */
export function isLeader(email: string): boolean {
  return !!getLeaderCommunity(email)
}

export function getCommunityByCode(code: string): Community | undefined {
  if (!code) return undefined
  const upper = code.trim().toUpperCase()
  return getAllCommunities().find((c) => c.codigo && c.codigo.toUpperCase() === upper && c.activa)
}

export function addCommunity(community: Omit<Community, "createdAt">): void {
  const all = getAllCommunities()
  if (all.some((c) => c.id === community.id)) return
  const full: Community = { ...community, createdAt: new Date().toISOString() }
  const customRaw = safeGet("mf_communities")
  const custom: Community[] = customRaw ? JSON.parse(customRaw) : []
  custom.push(full)
  safeSet("mf_communities", JSON.stringify(custom))
}

export function updateCommunity(id: string, updates: Partial<Community>): void {
  const all = getAllCommunities()
  const updated = all.map((c) => c.id === id ? { ...c, ...updates } : c)
  safeSet("mf_communities", JSON.stringify(updated))
}

// ----- Community membership -----

export function getCommunityMembers(communityId: string): CommunityMember[] {
  try {
    const raw = safeGet("mf_community_members") || "[]"
    const members: CommunityMember[] = JSON.parse(raw)
    return members.filter((m) => m.communityId === communityId)
  } catch (e) {
    console.error("Error parsing community members:", e)
    return []
  }
}

export function getAllCommunityMembers(): CommunityMember[] {
  try {
    const raw = safeGet("mf_community_members") || "[]"
    return JSON.parse(raw) as CommunityMember[]
  } catch (e) {
    console.error("Error parsing all community members:", e)
    return []
  }
}

export function getMemberCommunity(memberId: string): Community | undefined {
  if (!memberId) return undefined

  const mid = memberId.toLowerCase()
  if (mid === "super-admin" || mid.includes("sensei")) {
    return getCommunityById("skalia-vip")
  }
  try {
    const raw = safeGet("mf_community_members") || "[]"
    const members: CommunityMember[] = JSON.parse(raw)
    const entry = members.find((m) => m.memberId === memberId)
    if (!entry) return undefined
    return getCommunityById(entry.communityId)
  } catch (e) {
    console.error("Error getting member community:", e)
    return undefined
  }
}

export function getMemberCommunityId(memberId: string): string | null {
  const raw = safeGet("mf_community_members") || "[]"
  const members: CommunityMember[] = JSON.parse(raw)
  const entry = members.find((m) => m.memberId === memberId)
  return entry?.communityId || null
}

export function setMemberCommunity(params: {
  memberId: string
  communityId: string
  email: string
  name: string
}): void {
  const raw = safeGet("mf_community_members") || "[]"
  const members: CommunityMember[] = JSON.parse(raw)

  // Remove existing membership
  const filtered = members.filter((m) => m.memberId !== params.memberId)
  filtered.push({
    memberId: params.memberId,
    communityId: params.communityId,
    email: params.email,
    name: params.name,
    joinedAt: new Date().toISOString(),
  })
  safeSet("mf_community_members", JSON.stringify(filtered))
}

export function removeMemberFromCommunity(memberId: string): void {
  const raw = safeGet("mf_community_members") || "[]"
  const members: CommunityMember[] = JSON.parse(raw)
  const filtered = members.filter((m) => m.memberId !== memberId)
  safeSet("mf_community_members", JSON.stringify(filtered))
}

// ----- Community posts (isolated feed) -----

export interface CommunityPost {
  id: string
  communityId: string
  authorName: string
  authorEmail: string
  content: string
  timestamp: string
  likes: number
}

export function getCommunityPosts(communityId: string): CommunityPost[] {
  try {
    const raw = safeGet("mf_community_posts") || "[]"
    const posts: CommunityPost[] = JSON.parse(raw)
    return posts
      .filter((p) => p.communityId === communityId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (e) {
    console.error("Error parsing community posts:", e)
    return []
  }
}

export function addCommunityPost(post: Omit<CommunityPost, "id" | "likes">): void {
  const raw = safeGet("mf_community_posts") || "[]"
  const posts: CommunityPost[] = JSON.parse(raw)
  posts.unshift({
    ...post,
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    likes: 0,
  })
  safeSet("mf_community_posts", JSON.stringify(posts.slice(0, 200)))
}
