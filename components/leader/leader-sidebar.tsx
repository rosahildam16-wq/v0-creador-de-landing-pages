"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import {
  LayoutDashboard, Users, Kanban, ChevronLeft, ChevronRight, LogOut,
  Trophy, GraduationCap, Route, MessagesSquare, Link2, CreditCard, Shield, Settings,
} from "lucide-react"
import { useState } from "react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const NAV_ITEMS = [
  { href: "/leader", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leader/leads", label: "Leads", icon: Users },
  { href: "/leader/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/leader/equipo", label: "Mi Equipo", icon: Users },
  { href: "/leader/embudos", label: "Embudos", icon: Route },
  { href: "/leader/retos", label: "Retos", icon: Trophy },
  { href: "/leader/academia", label: "Academia", icon: GraduationCap },
  { href: "/leader/comunidad", label: "Comunidad", icon: MessagesSquare },
  { href: "/leader/mi-link", label: "Mi Link", icon: Link2 },
  { href: "/leader/suscripcion", label: "Suscripcion", icon: CreditCard },
  { href: "/leader/configuracion", label: "Configuracion", icon: Settings },
]

export function LeaderSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { logout, user } = useAuth()

  const { data: commData } = useSWR(
    user?.email ? `/api/communities/my-community?email=${encodeURIComponent(user.email)}` : null,
    fetcher
  )

  const community = commData?.community

  return (
    <aside
      className={cn(
        "glass-sidebar sticky top-0 z-20 flex h-screen flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-border/30 px-3">
        {!collapsed ? (
          <MagicFunnelLogo size="sm" showText animated={false} />
        ) : (
          <MagicFunnelLogo size="sm" showText={false} animated={false} />
        )}
      </div>

      {/* Community badge */}
      {!collapsed && community && (
        <div className="mx-3 mt-3 rounded-lg border px-3 py-2" style={{ borderColor: `${community.color || "#8b5cf6"}33`, backgroundColor: `${community.color || "#8b5cf6"}08` }}>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" style={{ color: community.color || "#8b5cf6" }} />
            <span className="text-xs font-bold" style={{ color: community.color || "#8b5cf6" }}>{community.nombre}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Lider de comunidad</p>
        </div>
      )}

      {!collapsed && !community && (
        <div className="mx-3 mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">Mi Comunidad</span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Lider</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/leader"
            ? pathname === "/leader"
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "nav-item-active text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border/30 p-3 flex flex-col gap-1">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <p className="text-xs text-foreground font-medium truncate">{user.name}</p>
            {user.username && (
              <p className="text-[10px] text-muted-foreground font-mono">@{user.username}</p>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesion</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  )
}
