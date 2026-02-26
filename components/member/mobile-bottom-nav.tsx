"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, GraduationCap, MessagesSquare, User } from "lucide-react"

const MOBILE_ITEMS = [
  { href: "/member", label: "Inicio", icon: LayoutDashboard },
  { href: "/member/mis-leads", label: "Leads", icon: User },
  { href: "/member/mi-equipo", label: "Equipo", icon: Users },
  { href: "/member/academia", label: "Cursos", icon: GraduationCap },
  { href: "/member/perfil", label: "Perfil", icon: User },
]

import { useAuth } from "@/lib/auth-context"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around border-t border-border/40 bg-card/85 px-4 pb-safe backdrop-blur-xl md:hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/[0.03] to-transparent pointer-events-none" />

      {MOBILE_ITEMS.map((item) => {
        // Restrict 'Mi Equipo' 
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
              "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 active:scale-95",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
              isActive ? "bg-primary/15 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "bg-transparent"
            )}>
              <item.icon className={cn(
                "h-[18px] w-[18px] transition-transform duration-300",
                isActive ? "scale-110" : "scale-100"
              )} />
              {isActive && (
                <div className="absolute -top-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </div>
            <span className={cn(
              "text-[9px] font-bold tracking-tight uppercase",
              isActive ? "opacity-100" : "opacity-60"
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
