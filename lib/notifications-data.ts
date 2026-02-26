import type { UserRole } from "./auth-context"

export type NotificationType = "challenge" | "lead" | "team" | "course" | "system"

export interface AppNotification {
  id: string
  tipo: NotificationType
  titulo: string
  mensaje: string
  timestamp: string
  leida: boolean
  destinatario: "all" | "admin" | "super_admin" | "leader" | "member"
  icono?: string
  accentColor?: string
}

const NOTIFICATION_ICON_MAP: Record<NotificationType, string> = {
  challenge: "trophy",
  lead: "user-plus",
  team: "users",
  course: "graduation-cap",
  system: "bell",
}

const NOTIFICATION_COLOR_MAP: Record<NotificationType, string> = {
  challenge: "hsl(45, 90%, 55%)",
  lead: "hsl(142, 70%, 49%)",
  team: "hsl(260, 70%, 58%)",
  course: "hsl(200, 80%, 55%)",
  system: "hsl(220, 15%, 60%)",
}

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    tipo: "challenge",
    titulo: "Nuevo reto activo",
    mensaje: "El reto 'TOP PROSPECTADOR' ha comenzado. ¡Compite por premios en efectivo!",
    timestamp: new Date().toISOString(),
    leida: false,
    destinatario: "all",
  },
  {
    id: "n2",
    tipo: "system",
    titulo: "Bienvenida a Eskalia VIP",
    mensaje: "Tu acceso a la comunidad ha sido activado. ¡Explora los cursos y el muro!",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    leida: false,
    destinatario: "all",
  },
  {
    id: "n3",
    tipo: "lead",
    titulo: "Métricas de Meta Ads listas",
    mensaje: "Ya puedes ver tu gasto real de Meta en tu dashboard principal.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    leida: false,
    destinatario: "super_admin",
  },
  {
    id: "n4",
    tipo: "course",
    titulo: "Nuevo curso disponible",
    mensaje: "Se ha publicado 'Estrategias de Conversión 2026'. ¡Míralo ahora!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    leida: false,
    destinatario: "all",
  },
]

// Safe storage helpers (same pattern as auth-context for iframe compat)
function safeGetNotifs(): string {
  try { return localStorage.getItem("mf_notifications") || "[]" } catch { /* noop */ }
  try { return sessionStorage.getItem("mf_notifications") || "[]" } catch { /* noop */ }
  return "[]"
}

function safeSetNotifs(value: string) {
  try { localStorage.setItem("mf_notifications", value) } catch { /* noop */ }
  try { sessionStorage.setItem("mf_notifications", value) } catch { /* noop */ }
}

/**
 * Add a dynamic notification (persisted in storage).
 */
export function addNotification(notif: Omit<AppNotification, "id">) {
  try {
    const raw = safeGetNotifs()
    const list = JSON.parse(raw) as AppNotification[]
    const full: AppNotification = { ...notif, id: `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
    list.unshift(full)
    safeSetNotifs(JSON.stringify(list.slice(0, 50)))
  } catch { /* noop */ }
}

/**
 * Get stored dynamic notifications.
 */
function getDynamicNotifications(): AppNotification[] {
  try {
    const raw = safeGetNotifs()
    return JSON.parse(raw) as AppNotification[]
  } catch {
    return []
  }
}

export function getNotificationsForRole(role: UserRole): AppNotification[] {
  const all = [...getDynamicNotifications(), ...DEFAULT_NOTIFICATIONS]
  return all
    .filter((n) => {
      if (n.destinatario === "all") return true
      if (n.destinatario === role) return true
      // "admin" notifications go to both super_admin and leader
      if (n.destinatario === "admin" && (role === "super_admin" || role === "leader")) return true
      return false
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getUnreadCount(role: UserRole): number {
  return getNotificationsForRole(role).filter((n) => !n.leida).length
}

export function getNotificationIcon(tipo: NotificationType): string {
  return NOTIFICATION_ICON_MAP[tipo]
}

export function getNotificationColor(tipo: NotificationType): string {
  return NOTIFICATION_COLOR_MAP[tipo]
}

export function formatTimeAgo(timestamp: string): string {
  const now = Date.now()
  const date = new Date(timestamp).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "Ahora mismo"
  if (minutes < 60) return `Hace ${minutes}m`
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${days}d`
}
