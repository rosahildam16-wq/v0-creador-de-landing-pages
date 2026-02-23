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
    mensaje: "El reto 'TOP PROSPECTADOR' ha comenzado. Compite por $100 USD en premios.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    leida: false,
    destinatario: "all",
  },
  {
    id: "n2",
    tipo: "lead",
    titulo: "5 nuevos leads hoy",
    mensaje: "Tu equipo ha generado 5 leads nuevos en las ultimas 24 horas.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    leida: false,
    destinatario: "admin",
  },
  {
    id: "n3",
    tipo: "course",
    titulo: "Nuevo curso disponible",
    mensaje: "Se ha publicado 'Domina Facebook Ads'. Accede desde la Academia.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    leida: false,
    destinatario: "all",
  },
  {
    id: "n4",
    tipo: "team",
    titulo: "Yanoskhy alcanzo 29 leads",
    mensaje: "Yanoskhy lidera el reto TOP PROSPECTADOR con 29 leads.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    leida: true,
    destinatario: "admin",
  },
  {
    id: "n5",
    tipo: "lead",
    titulo: "Tienes un nuevo lead",
    mensaje: "Un prospecto ingreso a traves de tu link personal. Revisa tus leads.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    leida: false,
    destinatario: "member",
  },
  {
    id: "n6",
    tipo: "system",
    titulo: "Recordatorio de pago",
    mensaje: "Tu renovacion esta programada para el 22 de enero. Asegurate de tener saldo.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    leida: true,
    destinatario: "member",
  },
  {
    id: "n7",
    tipo: "challenge",
    titulo: "Subiste al Top 3",
    mensaje: "Felicidades! Ahora estas en la posicion #3 del reto TOP PROSPECTADOR.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    leida: false,
    destinatario: "member",
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
