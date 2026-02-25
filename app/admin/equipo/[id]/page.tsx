"use client"

import { use, useState, useCallback } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/admin/metric-card"
import { getTeamMemberById, updateMemberFunnels } from "@/lib/team-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { ArrowLeft, Users, Target, DollarSign, TrendingUp, Megaphone, Leaf, Route, Check, Save } from "lucide-react"
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

      {/* Gestion de embudos */}
      <FunnelManager memberId={id} initialFunnels={member.embudos_asignados} />
    </div>
  )
}

function FunnelManager({ memberId, initialFunnels }: { memberId: string; initialFunnels: string[] }) {
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>(initialFunnels)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const toggleFunnel = useCallback((funnelId: string) => {
    setSelectedFunnels((prev) => {
      const next = prev.includes(funnelId)
        ? prev.filter((f) => f !== funnelId)
        : [...prev, funnelId]
      setHasChanges(true)
      return next
    })
  }, [])

  const handleSave = () => {
    updateMemberFunnels(memberId, selectedFunnels)
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Route className="h-4 w-4 text-primary" />
            Gestionar Embudos
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedFunnels.length} de {EMBUDOS.length} activos
            </span>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges && !saved}
              className={cn(
                "gap-1.5 text-xs",
                saved && "bg-emerald-600 hover:bg-emerald-600"
              )}
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saved ? "Guardado" : "Guardar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EMBUDOS.map((embudo) => {
            const isActive = selectedFunnels.includes(embudo.id)
            return (
              <button
                key={embudo.id}
                onClick={() => toggleFunnel(embudo.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200",
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border/30 bg-card/40 hover:border-border/60"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full transition-opacity",
                        isActive ? "opacity-100" : "opacity-30"
                      )}
                      style={{ backgroundColor: embudo.color }}
                    />
                    <span className={cn(
                      "text-sm font-semibold transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {embudo.nombre}
                    </span>
                  </div>
                  {/* Toggle visual */}
                  <div className={cn(
                    "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors duration-200",
                    isActive ? "bg-primary" : "bg-muted"
                  )}>
                    <div className={cn(
                      "h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                      isActive ? "translate-x-4" : "translate-x-0"
                    )} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{embudo.descripcion}</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    embudo.estado === "activo"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {embudo.estado}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{embudo.tipo}</span>
                  <span className="text-[10px] text-muted-foreground">{embudo.etapas.length} etapas</span>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
