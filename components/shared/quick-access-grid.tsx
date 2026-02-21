"use client"

import Link from "next/link"
import { Calendar, GraduationCap, Users, Bot, BarChart3, Route, Trophy, Kanban } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuickAccessItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const MEMBER_QUICK_ACCESS: QuickAccessItem[] = [
  { label: "Mi Agenda", href: "/member", icon: Calendar, description: "Proximas tareas" },
  { label: "Entrenamiento", href: "/member/academia", icon: GraduationCap, description: "Cursos y lecciones" },
  { label: "Mis Leads", href: "/member/mis-leads", icon: Users, description: "Gestion de contactos" },
  { label: "Asistente IA", href: "/member", icon: Bot, description: "Consulta rapida" },
]

const ADMIN_QUICK_ACCESS: QuickAccessItem[] = [
  { label: "Embudos", href: "/admin/embudos", icon: Route, description: "Gestion de embudos" },
  { label: "Academia", href: "/admin/academia", icon: GraduationCap, description: "Gestion de cursos" },
  { label: "Retos", href: "/admin/retos", icon: Trophy, description: "Concursos del equipo" },
  { label: "Pipeline", href: "/admin/pipeline", icon: Kanban, description: "Gestion de ventas" },
]

interface QuickAccessGridProps {
  role: "admin" | "member"
  items?: QuickAccessItem[]
}

export function QuickAccessGrid({ role, items }: QuickAccessGridProps) {
  const accessItems = items ?? (role === "admin" ? ADMIN_QUICK_ACCESS : MEMBER_QUICK_ACCESS)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-foreground">Accesos rapidos</h3>
      <div className="grid grid-cols-2 gap-3">
        {accessItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "glass-card group flex flex-col items-center justify-center gap-2 rounded-xl p-5 text-center transition-all duration-200",
              "hover:border-primary/30 hover:bg-primary/[0.04]"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 transition-colors group-hover:bg-primary/10">
              <item.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
