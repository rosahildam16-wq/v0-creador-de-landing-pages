"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Trophy, UserPlus, Users, GraduationCap, BellRing, Check, CheckCheck, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  formatTimeAgo,
  type AppNotification,
  type NotificationType,
} from "@/lib/notifications-data"

const ICON_MAP: Record<NotificationType, typeof Bell> = {
  challenge: Trophy,
  lead: UserPlus,
  team: Users,
  course: GraduationCap,
  system: BellRing,
}

const COLOR_MAP: Record<NotificationType, string> = {
  challenge: "text-yellow-400 bg-yellow-400/10",
  lead: "text-emerald-400 bg-emerald-400/10",
  team: "text-purple-400 bg-purple-400/10",
  course: "text-sky-400 bg-sky-400/10",
  system: "text-muted-foreground bg-muted",
}

export function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [animateBadge, setAnimateBadge] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)

  // Load notifications on mount AND refresh every 5 seconds to pick up new registrations
  useEffect(() => {
    if (!user) return

    const loadNotifs = async () => {
      try {
        const usernameParam = user.role === "member" && user.username ? `&username=${user.username}` : ""
        const res = await fetch(`/api/notifications?role=${user.role}${usernameParam}`)
        if (!res.ok) return
        const data = await res.json()
        const notifs = (data.notifications || []) as AppNotification[]
        setNotifications((prev) => {
          if (prev.length !== notifs.length || (notifs[0] && prev[0] && notifs[0].id !== prev[0].id)) {
            return notifs
          }
          return prev
        })
      } catch { /* noop */ }
    }

    loadNotifs()

    // Poll for new notifications every 8 seconds
    const interval = setInterval(loadNotifs, 8000)
    return () => clearInterval(interval)
  }, [user])

  // Badge bounce animation for unread
  useEffect(() => {
    const unread = notifications.filter((n) => !n.leida).length
    if (unread === 0) return
    setAnimateBadge(true)
    const t = setTimeout(() => setAnimateBadge(false), 2000)

    // Re-trigger bounce periodically
    const interval = setInterval(() => {
      setAnimateBadge(true)
      setTimeout(() => setAnimateBadge(false), 2000)
    }, 12000)
    return () => { clearTimeout(t); clearInterval(interval) }
  }, [notifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const unreadCount = notifications.filter((n) => !n.leida).length

  async function persistReadState(ids: string[]) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
    } catch { /* noop */ }
  }

  function markAllRead() {
    const ids = notifications.filter((n) => !n.leida).map((n) => n.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
    persistReadState(ids)
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
    persistReadState([id])
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="notif-bell-btn group relative flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card"
        aria-label={`Notificaciones: ${unreadCount} sin leer`}
      >
        <Bell className="h-[18px] w-[18px] text-muted-foreground transition-colors group-hover:text-foreground" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ${animateBadge ? "notif-badge-bounce" : ""
              }`}
          >
            {unreadCount}
          </span>
        )}

        {/* Ping ring when there are unread */}
        {unreadCount > 0 && (
          <span className="notif-ping-ring absolute inset-0 rounded-full border-2 border-primary/40" />
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div
          ref={panelRef}
          className="notif-panel-enter absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" />
                  Marcar todo
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((notif, idx) => {
                const Icon = ICON_MAP[notif.tipo]
                const colorClass = COLOR_MAP[notif.tipo]
                return (
                  <button
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`notif-item-enter group flex w-full items-start gap-3 border-b border-border/20 px-4 py-3 text-left transition-all duration-200 hover:bg-secondary/40 ${!notif.leida ? "bg-primary/[0.03]" : ""
                      }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-xs font-medium ${!notif.leida ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.titulo}
                        </p>
                        {!notif.leida && (
                          <span className="notif-dot h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/80">
                        {notif.mensaje}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/50">
                        {formatTimeAgo(notif.timestamp)}
                      </p>
                    </div>

                    {/* Read indicator */}
                    {!notif.leida && (
                      <div className="mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Check className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 px-4 py-2.5 text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
            >
              Cerrar notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
