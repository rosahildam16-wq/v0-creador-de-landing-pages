"use client"

import { useAuth } from "@/lib/auth-context"
import { getMemberPartners, getMemberData } from "@/lib/team-data"
import { Users, UserPlus, TrendingUp, BarChart3, ChevronRight, User, MousePointer2, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"
import useSWR from "swr"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MiEquipoPage() {
  const { user } = useAuth()
  const member = getMemberData(user)
  const [levelView, setLevelView] = useState<1 | 2>(1)

  // Fetch 2 levels of partners from database
  const { data: dbResponse, isLoading } = useSWR(
    user?.username ? `/api/member/partners?username=${user.username}&depth=2` : null,
    fetcher
  )

  const staticPartners = user?.memberId ? getMemberPartners(user.memberId) : []

  // Database Level 1 and Level 2
  const dbL1 = dbResponse?.level1 || []
  const dbL2 = dbResponse?.level2 || []

  // Combine for UI
  const l1Partners = [...staticPartners, ...dbL1].filter((p, index, self) =>
    index === self.findIndex((t) => t.email === p.email)
  )

  // For Level 2, we just use the DB results for now
  const l2Partners = dbL2

  const displayedPartners = levelView === 1 ? l1Partners : l2Partners

  // Totals (always showing totals of the WHOLE network level 1+2 for stats)
  const totalPartnerLeads = l1Partners.reduce((sum: number, p: any) => sum + (p.metricas?.leads || 0), 0) +
    l2Partners.reduce((sum: number, p: any) => sum + (p.metricas?.leads || 0), 0)

  const totalPartnerCerrados = l1Partners.reduce((sum: number, p: any) => sum + (p.metricas?.cerrados || 0), 0) +
    l2Partners.reduce((sum: number, p: any) => sum + (p.metricas?.cerrados || 0), 0)

  // Aggregate pipeline status
  const teamPipeline = {
    nuevos: Math.round(totalPartnerLeads * 0.4),
    tibios: Math.round(totalPartnerLeads * 0.35),
    calientes: Math.round(totalPartnerLeads * 0.25),
  }

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Mi Equipo</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus socios directos y monitorea el crecimiento de tu red.</p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="glass-card border-border/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Socios Directos</p>
                <p className="text-2xl font-bold">{l1Partners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Leads de Red</p>
                <p className="text-2xl font-bold">{totalPartnerLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ventas de Red (Red)</p>
                <p className="text-2xl font-bold">{totalPartnerCerrados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversion Red</p>
                <p className="text-2xl font-bold">
                  {totalPartnerLeads > 0 ? ((totalPartnerCerrados / totalPartnerLeads) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Pipeline & Funnel Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Pipeline Status */}
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Estado del Pipeline (Nivel 1+{l2Partners.length > 0 ? "2" : "1"})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" /> Leads Nuevos</span>
                <span className="font-bold">{teamPipeline.nuevos}</span>
              </div>
              <Progress value={totalPartnerLeads > 0 ? (teamPipeline.nuevos / totalPartnerLeads) * 100 : 0} className="h-1.5 bg-blue-500/10" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500" /> Tibios (Seguimiento)</span>
                <span className="font-bold">{teamPipeline.tibios}</span>
              </div>
              <Progress value={totalPartnerLeads > 0 ? (teamPipeline.tibios / totalPartnerLeads) * 100 : 0} className="h-1.5 bg-amber-500/10" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500" /> Calientes 🔥</span>
                <span className="font-bold">{teamPipeline.calientes}</span>
              </div>
              <Progress value={totalPartnerLeads > 0 ? (teamPipeline.calientes / totalPartnerLeads) * 100 : 0} className="h-1.5 bg-red-500/10" />
            </div>
          </CardContent>
        </Card>

        {/* Funnel Sources Breakdown */}
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Fuentes de Tráfico (Equipo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-around py-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <MousePointer2 className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-tighter text-muted-foreground">Publicidad</span>
                  <span className="text-xl font-black">{Math.round(totalPartnerLeads * 0.65)}</span>
                </div>
                <div className="h-12 w-px bg-border/40" />
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Zap className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-tighter text-muted-foreground">Orgánico</span>
                  <span className="text-xl font-black">{Math.round(totalPartnerLeads * 0.35)}</span>
                </div>
              </div>
              <div className="rounded-xl bg-secondary/30 p-4">
                <p className="text-[11px] text-center text-muted-foreground leading-tight">
                  Monitorea que tus socios esten utilizando ambos canales para maximizar el crecimiento de la red.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List of Partners with Layer Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Listado de Socios</h2>

          <div className="flex rounded-lg bg-secondary/40 p-1">
            <button
              onClick={() => setLevelView(1)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-bold transition-all",
                levelView === 1 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Nivel 1
            </button>
            <button
              onClick={() => setLevelView(2)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-bold transition-all",
                levelView === 2 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Nivel 2
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayedPartners.map((p: any) => (
            <Card key={p.id} className="glass-card overflow-hidden border-border/30 transition-all hover:border-primary/40">
              <CardContent className="p-0">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {p.avatar_initials}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold">{p.nombre}</span>
                    <span className="truncate text-[10px] text-muted-foreground">@{p.username || p.id}</span>
                  </div>
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    p.publicidad_activa ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-500"
                  )} />
                </div>

                <div className="grid grid-cols-2 border-y border-border/20 bg-secondary/20 py-3 text-center">
                  <div>
                    <p className="text-sm font-bold">{p.metricas?.leads || 0}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Leads Totales</p>
                  </div>
                  <div className="border-l border-border/20">
                    <p className="text-sm font-bold">{p.metricas?.cerrados || 0}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Cierres</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="italic">Nivel {p.level || levelView}</span>
                  </div>
                  <button className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                    Ver Red
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {displayedPartners.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 py-12 text-center lg:col-span-3">
              <User className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No hay socios en este nivel todavia.</p>
              <p className="text-xs text-muted-foreground/60">¡El crecimiento exponencial comienza aqui!</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12 lg:col-span-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
