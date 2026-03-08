"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { LayoutDashboard, Link2, Users, ChevronLeft, ChevronRight, LogOut, GraduationCap, Kanban, Trophy, Sparkles, CreditCard, MessagesSquare, Globe, CalendarCheck, Plug, Archive, Mail, TrendingUp, ClipboardList, Lock, BarChart3 } from "lucide-react"
import { useState } from "react"
import { type PlanFeatures, hasFeature } from "@/lib/plans"

// Each nav item optionally references a feature key.
// If the user's plan doesn't include it, a subtle lock indicator is shown.
// The page itself handles the full FeatureGate overlay.
const NAV_ITEMS: Array<{
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  feature?: keyof PlanFeatures
}> = [
  { href: "/member", label: "Dashboard", icon: LayoutDashboard },
  { href: "/member/mis-leads", label: "Mis Leads", icon: Users },
  { href: "/member/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/member/mi-equipo", label: "Mi Equipo", icon: Users, feature: "miEquipo" },
  { href: "/member/agendamiento", label: "Citas", icon: CalendarCheck, feature: "agendamiento" },
  { href: "/member/builder", label: "Magic Builder", icon: Sparkles },
  { href: "/member/forms", label: "Form Builder", icon: ClipboardList, feature: "forms" },
  { href: "/member/retos", label: "Retos", icon: Trophy },
  { href: "/member/comunidad", label: "Comunidad", icon: MessagesSquare },
  { href: "/member/academia", label: "Academia", icon: GraduationCap },
  { href: "/member/mi-embudo", label: "Mis Embudos", icon: Link2 },
  { href: "/member/integraciones", label: "Integraciones", icon: Plug, feature: "integraciones" },
  { href: "/member/social-center", label: "Social Center", icon: Globe, feature: "socialCenter" },
  { href: "/member/meta-ads", label: "Meta Ads", icon: BarChart3, feature: "metaAds" },
  { href: "/member/recursos", label: "Librería", icon: Archive },
  { href: "/member/mailing", label: "Mailing", icon: Mail, feature: "mailing" },
  { href: "/member/comisiones", label: "Comisiones", icon: TrendingUp, feature: "comisiones" },
  { href: "/member/suscripcion", label: "Suscripcion", icon: CreditCard },
]

export function MemberSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { logout, user } = useAuth()
  const isSuperAdmin = user?.role === "super_admin"

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

      {/* Navigation — all items shown to all users; FeatureGate handles access inside pages */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/member"
            ? pathname === "/member"
            : pathname.startsWith(item.href)

          // Show subtle lock indicator if feature is gated (never hide the item)
          const isLocked = !isSuperAdmin && !!item.feature && !hasFeature(user?.planCode, item.feature)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "nav-item-active text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {/* Subtle lock icon for locked features — not shown when collapsed */}
              {!collapsed && isLocked && (
                <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              )}
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
