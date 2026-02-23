"use client"

import { MetricCard } from "@/components/admin/metric-card"
import { TemperatureBadge } from "@/components/admin/temperature-badge"
// SetupBanner no longer needed — data layer has mock fallback
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ETAPA_LABELS } from "@/lib/types"
import type { Lead, EventoActividad } from "@/lib/types"
import { calcularTemperatura } from "@/lib/lead-scoring"
import { Users, UserPlus, DollarSign, TrendingUp, Clock, Loader2, Banknote, Shield, CreditCard } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import useSWR from "swr"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { QuickAccessGrid } from "@/components/shared/quick-access-grid"
import { ChallengeLeaderboard } from "@/components/shared/challenge-leaderboard"
import type { Challenge } from "@/lib/challenges-data"
import { DEFAULT_CHALLENGES } from "@/lib/challenges-data"
import { useState, useEffect } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TIPO_EVENTO_COLORS: Record<string, string> = {
  ingreso: "bg-blue-500",
  video: "bg-violet-500",
  quiz: "bg-emerald-500",
  llamada: "bg-amber-500",
  login: "bg-cyan-500",
  cta: "bg-red-500",
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export default function AdminDashboard() {
  const { data, error: fetchError, isLoading } = useSWR("/api/admin/dashboard", fetcher, {
    refreshInterval: 30000,
  })

  const { data: commStats } = useSWR("/api/communities/stats", fetcher, {
    refreshInterval: 15000,
  })

  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)

  useEffect(() => {
    const stored = safeGet("mf_challenges")
    if (stored) {
      try {
        setChallenges(JSON.parse(stored))
      } catch { /* use defaults */ }
    }
  }, [])

  const activeChallenges = challenges.filter((c) => c.activo)

  if (fetchError) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen Total
          </p>
        </div>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Error al cargar el dashboard. Recarga la pagina para intentar de nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
      </div>
    )
  }

  const {
    metricas = { total: 0, hoy: 0, cplPromedio: 0, tasaConversion: 0, cerrados: 0, cambioSemanal: 0 },
    leadsPorDia = [],
    leadsPorFuente = [],
    distribucionTemp = [],
    leads = [],
    actividad = [],
  } = data ?? {}

  const leadsRecientes = (Array.isArray(leads) ? leads as Lead[] : []).slice(0, 5)
  const actividadReciente = (Array.isArray(actividad) ? actividad as EventoActividad[] : []).slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen Total
        </p>
      </div>

      {/* Empty state */}
      {metricas.total === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-semibold">Sin leads todavia</h3>
            <p className="text-center text-sm text-muted-foreground">
              Tu base de datos esta vacia. Los leads apareceran aqui cuando ingresen por el embudo o el webhook.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard
          title="Leads Totales"
          value={metricas.total}
          change={metricas.cambioSemanal > 0 ? `+${metricas.cambioSemanal}% esta semana` : "Sin cambios"}
          changeType={metricas.cambioSemanal > 0 ? "positive" : "neutral"}
          icon={Users}
        />
        <MetricCard
          title="Leads Hoy"
          value={metricas.hoy}
          change="Ultimas 24h"
          changeType="neutral"
          icon={UserPlus}
        />
        <MetricCard
          title="CPL Promedio"
          value={`$${metricas.cplPromedio}`}
          change="Estimado"
          changeType="neutral"
          icon={DollarSign}
        />
      </div>

      {/* Ingresos & Conversion */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard
          title="Ingresos Hoy"
          value={`$${metricas.ingresosHoy?.toLocaleString() ?? "0"}`}
          change="Hotmart + Meta Ads"
          changeType="neutral"
          icon={DollarSign}
        />
        <MetricCard
          title="Ingresos Totales"
          value={`$${metricas.ingresosTotales?.toLocaleString() ?? "0"}`}
          change="Acumulado"
          changeType="positive"
          icon={Banknote}
        />
        <MetricCard
          title="Tasa de Conversion"
          value={`${metricas.tasaConversion}%`}
          change={`${metricas.cerrados} cerrados`}
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* ---- COMUNIDADES & BILLING ---- */}
      {commStats && (
        <>
          <div className="mt-2">
            <h2 className="text-lg font-semibold tracking-tight">Comunidades y Facturacion</h2>
            <p className="text-xs text-muted-foreground">Miembros registrados, crecimiento y MRR estimado ($17 USD/miembro)</p>
          </div>

          {/* Community metric cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              title="Total Miembros"
              value={commStats.totalMembers ?? 0}
              change={commStats.membersThisWeek ? `+${commStats.membersThisWeek} esta semana` : "Sin registros"}
              changeType={commStats.membersThisWeek > 0 ? "positive" : "neutral"}
              icon={Users}
            />
            <MetricCard
              title="Hoy"
              value={commStats.membersToday ?? 0}
              change="Registros nuevos"
              changeType="neutral"
              icon={UserPlus}
            />
            <MetricCard
              title="MRR Estimado"
              value={`$${(commStats.mrrEstimado ?? 0).toLocaleString()}`}
              change={`${commStats.activeMembers ?? 0} activos x $${commStats.cuotaBase ?? 17}`}
              changeType="positive"
              icon={DollarSign}
            />
            <MetricCard
              title="Comunidades"
              value={commStats.communityStats?.length ?? 0}
              change="Activas"
              changeType="neutral"
              icon={Shield}
            />
          </div>

          {/* Growth chart + community breakdown */}
          <div className="grid gap-4 lg:grid-cols-7">
            {/* Growth chart */}
            <Card className="border-border/50 lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Crecimiento de Miembros (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={commStats.growth || []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="communityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="fecha"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="miembros"
                        stroke="#8b5cf6"
                        fill="url(#communityGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Per-community breakdown */}
            <Card className="border-border/50 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Desglose por Comunidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {(commStats.communityStats || []).map((c: { id: string; nombre: string; color: string; total_miembros: number; activos: number; mrr: number; cuota_miembro: number; leader_name: string | null; codigo: string | null }) => (
                    <div key={c.id} className="rounded-xl border border-border/50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="font-semibold text-sm">{c.nombre}</span>
                        {c.codigo && (
                          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                            {c.codigo}
                          </span>
                        )}
                      </div>
                      {c.leader_name && (
                        <p className="text-[11px] text-muted-foreground mb-2">Lider: {c.leader_name}</p>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold">{c.total_miembros}</p>
                          <p className="text-[10px] text-muted-foreground">Miembros</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-400">{c.activos}</p>
                          <p className="text-[10px] text-muted-foreground">Activos</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-violet-400">${c.mrr}</p>
                          <p className="text-[10px] text-muted-foreground">MRR</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!commStats.communityStats || commStats.communityStats.length === 0) && (
                    <p className="py-4 text-center text-sm text-muted-foreground">Sin comunidades activas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent registrations table */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Registros Recientes</CardTitle>
              <Link href="/admin/comunidades" className="text-xs text-primary hover:underline">
                Ver comunidades
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Patrocinador</TableHead>
                    <TableHead className="text-xs">Comunidad</TableHead>
                    <TableHead className="text-xs">Codigo</TableHead>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(commStats.recentRegistrations || []).map((reg: { name: string; email: string; community_id: string; discount_code: string | null; sponsor_name: string | null; created_at: string; activo: boolean }, i: number) => {
                    const comm = (commStats.communityStats || []).find((c: { id: string }) => c.id === reg.community_id)
                    return (
                      <TableRow key={i}>
                        <TableCell className="py-2 text-sm font-medium">{reg.name}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">{reg.email}</TableCell>
                        <TableCell className="py-2 text-xs">
                          {reg.sponsor_name ? (
                            <span className="text-foreground">{reg.sponsor_name}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: comm?.color || "#6366f1" }} />
                            <span className="text-xs">{comm?.nombre || reg.community_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-xs font-mono text-muted-foreground">
                          {reg.discount_code || "-"}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">
                          {new Date(reg.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            reg.activo
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {reg.activo ? "Activo" : "Pendiente"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {(!commStats.recentRegistrations || commStats.recentRegistrations.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                        Sin registros todavia. Los miembros apareceran aqui cuando se registren.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {metricas.total > 0 && (
        <>
          {/* Charts Row 1 */}
          <div className="grid gap-4 lg:grid-cols-7">
            {/* Leads por Dia */}
            <Card className="border-border/50 lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Leads por Dia (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={leadsPorDia} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="fecha"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="hsl(var(--primary))"
                        fill="url(#areaGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Leads por Fuente */}
            <Card className="border-border/50 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Leads por Fuente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsPorFuente}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="cantidad"
                        nameKey="fuente"
                        stroke="none"
                      >
                        {leadsPorFuente.map((entry: { fill: string }, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {leadsPorFuente.map((item: { fuente: string; fill: string; cantidad: number }) => (
                    <div key={item.fuente} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{item.fuente}</span>
                      <span className="font-medium">{item.cantidad}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribucion de Temperatura */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distribucion de Temperatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-8">
                <div className="h-[200px] w-full max-w-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionTemp}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="cantidad"
                        nameKey="temperatura"
                        stroke="none"
                      >
                        {distribucionTemp.map((entry: { fill: string }, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4">
                  {distribucionTemp.map((item: { temperatura: string; fill: string; cantidad: number }) => (
                    <div key={item.temperatura} className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-muted-foreground">{item.temperatura}</span>
                      </div>
                      <span className="text-lg font-bold">{item.cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access & Leaderboard */}
          <div className="grid gap-4 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <QuickAccessGrid role="super_admin" />
            </div>
            {activeChallenges.length > 0 && (
              <div className="lg:col-span-3">
                <ChallengeLeaderboard
                  challenge={activeChallenges[0]}
                  limit={10}
                />
              </div>
            )}
          </div>

          {/* Bottom Row */}
          <div className="grid gap-4 lg:grid-cols-7">
            {/* Recent Leads */}
            <Card className="border-border/50 lg:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads Recientes</CardTitle>
                <Link href="/admin/leads" className="text-xs text-primary hover:underline">
                  Ver todos
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs">Fuente</TableHead>
                      <TableHead className="text-xs">Temp.</TableHead>
                      <TableHead className="text-xs">Etapa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsRecientes.map((lead) => {
                      const { temperatura } = calcularTemperatura(lead)
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="py-2">
                            <Link href={`/admin/leads/${lead.id}`} className="text-sm font-medium hover:text-primary">
                              {lead.nombre}
                            </Link>
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">
                            {lead.fuente}
                          </TableCell>
                          <TableCell className="py-2">
                            <TemperatureBadge temperatura={temperatura} />
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">
                            {ETAPA_LABELS[lead.etapa]}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {leadsRecientes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                          Sin leads todavia
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="border-border/50 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {actividadReciente.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">Sin actividad todavia</p>
                  )}
                  {actividadReciente.map((evento) => (
                    <div key={evento.id} className="flex items-start gap-3">
                      <div className="mt-1.5 flex shrink-0 items-center">
                        <div className={`h-2 w-2 rounded-full ${TIPO_EVENTO_COLORS[evento.tipo] || "bg-muted-foreground"}`} />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="truncate text-xs">{evento.descripcion}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(evento.created_at), { locale: es, addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
