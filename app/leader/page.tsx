"use client"

import { useAuth } from "@/lib/auth-context"
import { getCommunityById, getCommunityMembers } from "@/lib/communities-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/admin/metric-card"
import { Users, Target, Route, Trophy, TrendingUp, DollarSign, UserPlus, Shield } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function LeaderDashboardPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const members = user?.communityId ? getCommunityMembers(user.communityId) : []

  if (!community) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No se encontro tu comunidad.</p>
      </div>
    )
  }

  // Simulated community metrics
  const totalLeads = members.length * 12
  const conversionRate = 18.5
  const monthlyRevenue = members.length * community.cuota_miembro
  const activeMembers = members.length

  const quickActions = [
    { href: "/leader/equipo", label: "Gestionar Equipo", icon: Users, desc: "Ver y administrar miembros" },
    { href: "/leader/retos", label: "Crear Reto", icon: Trophy, desc: "Agregar retos a tu equipo" },
    { href: "/leader/academia", label: "Subir Contenido", icon: Target, desc: "Videos y cursos para tu equipo" },
    { href: "/leader/embudos", label: "Configurar Embudos", icon: Route, desc: "Activar embudos para tu comunidad" },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 p-8" style={{ background: `linear-gradient(135deg, ${community.color}10, transparent)` }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${community.color}20` }}>
              <Shield className="h-5 w-5" style={{ color: community.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panel de Lider</p>
              <h1 className="text-2xl font-bold text-foreground">{community.nombre}</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">{community.descripcion}</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {activeMembers} miembros
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              ${community.cuota_miembro}/mes por miembro
            </span>
            <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${community.color}20`, color: community.color }}>
              Codigo: {community.codigo || "Sin codigo"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Miembros Activos" value={activeMembers} icon={Users} trend="+3 este mes" />
        <MetricCard title="Leads Totales" value={totalLeads} icon={Target} trend={`${conversionRate}% conversion`} />
        <MetricCard title="Ingresos Mensuales" value={`$${monthlyRevenue}`} icon={DollarSign} trend="USD por cuotas" />
        <MetricCard title="Crecimiento" value={`+${Math.round(activeMembers * 0.15)}`} icon={TrendingUp} trend="nuevos esta semana" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Acciones Rapidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Members */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4 text-primary" />
            Miembros Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="space-y-3">
              {members.slice(0, 5).map((m) => (
                <div key={m.memberId} className="flex items-center justify-between rounded-lg border border-border/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.joinedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">Aun no hay miembros registrados.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {"Comparte el codigo "}
                <span className="font-mono font-bold" style={{ color: community.color }}>{community.codigo}</span>
                {" para que se unan."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
