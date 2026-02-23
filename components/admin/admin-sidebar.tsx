"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { LayoutDashboard, Users, UsersRound, Kanban, BarChart3, ChevronLeft, ChevronRight, Route, Megaphone, Plug, Zap, LogOut, Trophy, GraduationCap, CreditCard, PanelTop, MessagesSquare } from "lucide-react"
import { useState } from "react"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/embudos", label: "Embudos", icon: Route },
  { href: "/admin/landing-builder", label: "Magic Builder", icon: PanelTop },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/admin/equipo", label: "Equipo", icon: UsersRound },
  { href: "/admin/comunidad", label: "Comunidad", icon: MessagesSquare },
  { href: "/admin/retos", label: "Retos", icon: Trophy },
  { href: "/admin/academia", label: "Academia", icon: GraduationCap },
  { href: "/admin/meta-ads", label: "Meta Ads", icon: Megaphone },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/integraciones", label: "Integraciones", icon: Plug },
  { href: "/admin/workflows", label: "Workflows", icon: Zap },
  { href: "/admin/suscripcion", label: "Suscripcion", icon: CreditCard },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { logout, user } = useAuth()

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

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
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

      {/* Bottom: user + logout + collapse */}
      <div className="border-t border-border/30 p-3 flex flex-col gap-1">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user.email}
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
