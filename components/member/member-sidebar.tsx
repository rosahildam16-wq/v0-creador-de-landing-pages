"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { LayoutDashboard, Link2, Users, ChevronLeft, ChevronRight, LogOut, GraduationCap, Kanban, Trophy, Sparkles, CreditCard, MessagesSquare, Globe } from "lucide-react"
import { useState } from "react"

const NAV_ITEMS = [
  { href: "/member", label: "Dashboard", icon: LayoutDashboard },
  { href: "/member/mis-leads", label: "Mis Leads", icon: Users },
  { href: "/member/mi-equipo", label: "Mi Equipo", icon: Users },
  { href: "/member/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/member/builder", label: "Magic Builder", icon: Sparkles },
  { href: "/member/retos", label: "Retos", icon: Trophy },
  { href: "/member/comunidad", label: "Comunidad", icon: MessagesSquare },
  { href: "/member/academia", label: "Academia", icon: GraduationCap },
  { href: "/member/mi-embudo", label: "Mis Embudos", icon: Link2 },
  { href: "/member/social-center", label: "Social Center", icon: Globe },
  { href: "/member/suscripcion", label: "Suscripcion", icon: CreditCard },
]

export function MemberSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { logout, user } = useAuth()

  return (
    <aside
      className={cn(
        "glass-sidebar sticky top-0 z-20 hidden h-screen flex-col transition-all duration-300 md:flex",
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
          // Restrict 'Mi Equipo' to Skalia VIP members
          if (item.href === "/member/mi-equipo" && user?.communityId !== "skalia-vip" && user?.memberId !== "sensei") {
            return null
          }

          const isActive = item.href === "/member"
            ? pathname === "/member"
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
            {user.name}
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
