"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/admin/metric-card"
import { getTeamMemberById } from "@/lib/team-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { ArrowLeft, Users, Target, DollarSign, TrendingUp, Megaphone, Leaf, Route } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TeamMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const member = getTeamMemberById(id)

  if (!member) return notFound()

  const embudosAsignados = EMBUDOS.filter((e) => member.embudos_asignados.includes(e.id))
  const conversionRate = member.metricas.leads > 0
    ? ((member.metricas.cerrados / member.metricas.leads) * 100).toFixed(1)
    : "0.0"

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back button + Header */}
      <div className="flex flex-col gap-4">
        <Link href="/admin/equipo">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver al equipo
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
            {member.avatar_initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{member.nombre}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  member.publicidad_activa
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", member.publicidad_activa ? "bg-emerald-400" : "bg-muted-foreground")} />
                {member.publicidad_activa ? "Publicidad Activa" : "Publicidad Inactiva"}
              </span>
              {member.fecha_renovacion && (
                <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-medium text-orange-400">
                  Renov.: {member.fecha_renovacion}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{member.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Leads Totales"
          value={member.metricas.leads}
          change="Global"
          changeType="neutral"
          icon={Users}
        />
        <MetricCard
          title="Cerrados"
          value={member.metricas.cerrados}
          change={`${conversionRate}% conversion`}
          changeType={member.metricas.cerrados > 0 ? "positive" : "neutral"}
          icon={Target}
        />
        <MetricCard
          title="Inversion Total"
          value={`$${member.publicidad.inversion_total}`}
          change="Publicidad"
          changeType="neutral"
          icon={DollarSign}
        />
        <MetricCard
          title="Saldo Disponible"
          value={`$${member.publicidad.saldo_disponible}`}
          change="Restante"
          changeType={member.publicidad.saldo_disponible > 20 ? "positive" : "negative"}
          icon={TrendingUp}
        />
      </div>

      {/* Two columns: Publicidad + Organico */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Publicidad */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Megaphone className="h-4 w-4 text-primary" />
              Publicidad (Meta Ads)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-2xl font-bold text-foreground">{member.publicidad.inversion_total} <span className="text-xs font-normal text-muted-foreground">USD</span></p>
                <p className="text-xs text-muted-foreground">Inversion total</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-2xl font-bold text-foreground">{member.publicidad.saldo_disponible} <span className="text-xs font-normal text-muted-foreground">USD</span></p>
                <p className="text-xs text-muted-foreground">Saldo disponible</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-2xl font-bold text-foreground">{member.publicidad.leads_totales}</p>
                <p className="text-xs text-muted-foreground">Leads totales</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-2xl font-bold text-foreground">{member.publicidad.leads_cerrados}</p>
                <p className="text-xs text-muted-foreground">Leads cerrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organico */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Leaf className="h-4 w-4 text-emerald-400" />
              Organico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-2xl font-bold text-foreground">{member.organico.saldo_disponible} <span className="text-xs font-normal text-muted-foreground">USD</span></p>
                <p className="text-xs text-muted-foreground">Saldo disponible</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3" />
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-2xl font-bold text-foreground">{member.organico.leads_totales}</p>
                <p className="text-xs text-muted-foreground">Leads totales</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-2xl font-bold text-foreground">{member.organico.leads_cerrados}</p>
                <p className="text-xs text-muted-foreground">Leads cerrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embudos asignados */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Route className="h-4 w-4 text-primary" />
            Embudos Asignados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {embudosAsignados.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {embudosAsignados.map((embudo) => (
                <Link key={embudo.id} href={`/admin/embudos/${embudo.id}`}>
                  <div className="group flex flex-col gap-2 rounded-lg border border-border/50 p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: embudo.color }}
                      />
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {embudo.nombre}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{embudo.descripcion}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          embudo.estado === "activo"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {embudo.estado}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{embudo.etapas.length} etapas</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay embudos asignados a este miembro.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
