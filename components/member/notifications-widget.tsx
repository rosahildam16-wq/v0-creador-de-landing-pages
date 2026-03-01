"use client"

import { useState, useEffect } from "react"
import { Bell, Trophy, UserPlus, Users, GraduationCap, BellRing, ChevronRight, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
    formatTimeAgo,
    type AppNotification,
    type NotificationType
} from "@/lib/notifications-data"
import Link from "next/link"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<NotificationType, any> = {
    challenge: Trophy,
    lead: UserPlus,
    team: Users,
    course: GraduationCap,
    system: BellRing,
}

const COLOR_MAP: Record<NotificationType, string> = {
    challenge: "text-amber-400 bg-amber-400/10",
    lead: "text-emerald-400 bg-emerald-400/10",
    team: "text-purple-400 bg-purple-400/10",
    course: "text-sky-400 bg-sky-400/10",
    system: "text-primary bg-primary/10",
}

export function NotificationsWidget() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        const loadNotifs = async () => {
            try {
                const usernameParam = user.role === "member" && user.username ? `&username=${user.username}` : ""
                const res = await fetch(`/api/notifications?role=${user.role}${usernameParam}`)
                if (!res.ok) return
                const data = await res.json()
                setNotifications(data.notifications || [])
            } catch (err) {
                console.error("Widget fetch err:", err)
            } finally {
                setLoading(false)
            }
        }
        loadNotifs()
    }, [user])

    const recentNotifs = notifications.slice(0, 3)
    const unreadCount = notifications.filter(n => !n.leida).length

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" /> Anuncios Importantes
                </h3>
                {unreadCount > 0 && (
                    <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCount} NUEVOS
                    </span>
                )}
            </div>

            <div className="grid gap-3">
                {loading ? (
                    <div className="rounded-3xl border border-border/20 bg-card/30 p-8 flex items-center justify-center">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                    </div>
                ) : recentNotifs.length === 0 ? (
                    <div className="rounded-3xl border border-border/10 bg-card/20 p-6 flex flex-col items-center justify-center text-center gap-2">
                        <Sparkles className="h-6 w-6 text-muted-foreground/20" />
                        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Todo al día por aquí</p>
                    </div>
                ) : (
                    recentNotifs.map((notif, idx) => {
                        const Icon = ICON_MAP[notif.tipo] || Bell
                        const colors = COLOR_MAP[notif.tipo] || "text-primary bg-primary/10"

                        return (
                            <div
                                key={notif.id}
                                className={cn(
                                    "group relative overflow-hidden rounded-3xl border border-border/10 bg-card/40 p-4 transition-all hover:bg-card/60 hover:border-border/30",
                                    !notif.leida && "border-primary/20 bg-primary/[0.02]"
                                )}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {!notif.leida && (
                                    <div className="absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                                )}
                                <div className="flex gap-4">
                                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", colors)}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-foreground leading-tight line-clamp-1">{notif.titulo}</p>
                                        <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2 leading-relaxed">{notif.mensaje}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">{formatTimeAgo(notif.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <button className="w-full py-3 rounded-2xl border border-border/10 bg-white/5 text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all flex items-center justify-center gap-2 group">
                Ver todas las notificaciones
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
        </div>
    )
}
