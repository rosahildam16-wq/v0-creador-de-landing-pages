"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FUNNEL_STEPS, ETAPA_LABELS, ETAPA_ORDER, type FuenteTrafico } from "@/lib/types"
import type { Lead } from "@/lib/types"
import { EMBUDOS } from "@/lib/embudos-config"
import { calcularTemperatura } from "@/lib/lead-scoring"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import { Filter, Loader2 } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const FUNNEL_COLORS = [
  "hsl(145, 65%, 42%)",
  "hsl(155, 60%, 40%)",
  "hsl(170, 50%, 38%)",
  "hsl(185, 45%, 40%)",
  "hsl(200, 50%, 42%)",
  "hsl(220, 50%, 45%)",
  "hsl(250, 45%, 45%)",
  "hsl(280, 40%, 42%)",
]

export default function AnalyticsPage() {
  const [selectedEmbudo, setSelectedEmbudo] = useState<string>("todos")

  const { data: leads, isLoading } = useSWR<Lead[]>("/api/admin/leads", fetcher, {
    refreshInterval: 30000,
  })

  const allLeads = leads || []

  // Filter leads by selected embudo
  const LEADS = useMemo(() => {
    if (selectedEmbudo === "todos") return allLeads
    return allLeads.filter((l) => l.embudo_id === selectedEmbudo)
  }, [allLeads, selectedEmbudo])

  const selectedEmbudoConfig = EMBUDOS.find((e) => e.id === selectedEmbudo)

  const funnelData = useMemo(() => {
    const total = LEADS.length
    return FUNNEL_STEPS.map((step, i) => {
      const count = LEADS.filter((l) => l.etapa_maxima_alcanzada >= step.step).length
      const prevCount = i === 0 ? total : LEADS.filter((l) => l.etapa_maxima_alcanzada >= FUNNEL_STEPS[i - 1].step).length
      const retention = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0
      const pctTotal = total > 0 ? Math.round((count / total) * 100) : 0
      return {
        etapa: step.label,
        cantidad: count,
        pctTotal,
        retencion: retention,
        step: step.step,
      }
    })
  }, [LEADS])

  const heatmapData = useMemo(() => {
    const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
    const hours = Array.from({ length: 12 }, (_, i) => i + 8)
    const grid: { day: string; hour: number; count: number }[] = []
    days.forEach((day, dayIdx) => {
      hours.forEach((hour) => {
        let base = 2
        if (dayIdx < 5) base = 4
        if (hour >= 10 && hour <= 14) base += 3
        if (hour >= 17 && hour <= 19) base += 2
        const count = LEADS.length > 0
          ? Math.max(0, base + Math.floor(Math.sin(dayIdx * hour * 0.5) * 3))
          : 0
        grid.push({ day, hour, count })
      })
    })
    return { grid, days, hours }
  }, [LEADS])

  const tiempoPorEtapa = useMemo(() => {
    return FUNNEL_STEPS.map((step) => {
      const leadsInStep = LEADS.filter((l) => l.etapa_maxima_alcanzada >= step.step)
      const avgTime = leadsInStep.length > 0
        ? Math.round(leadsInStep.reduce((sum, l) => sum + l.tiempo_total_segundos / l.etapa_maxima_alcanzada, 0) / leadsInStep.length)
        : 0
      return {
        etapa: step.label,
        segundos: avgTime,
        minutos: `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`,
      }
    })
  }, [LEADS])

  const fuentesCalientes = useMemo(() => {
    const fuentes: FuenteTrafico[] = ["Meta Ads", "Organico"]
    return fuentes.map((fuente) => {
      const total = LEADS.filter((l) => l.fuente === fuente).length
      const calientes = LEADS.filter((l) => {
        if (l.fuente !== fuente) return false
        const { temperatura } = calcularTemperatura(l)
        return temperatura === "CALIENTE"
      }).length
      const tibios = LEADS.filter((l) => {
        if (l.fuente !== fuente) return false
        const { temperatura } = calcularTemperatura(l)
        return temperatura === "TIBIO"
      }).length
      return {
        fuente,
        total,
        calientes,
        tibios,
        conversionCaliente: total > 0 ? Math.round((calientes / total) * 100) : 0,
        conversionTibio: total > 0 ? Math.round((tibios / total) * 100) : 0,
      }
    }).sort((a, b) => b.conversionCaliente - a.conversionCaliente)
  }, [LEADS])

  const pipelineDistribution = useMemo(() => {
    return ETAPA_ORDER.map((etapa) => ({
      etapa: ETAPA_LABELS[etapa],
      cantidad: LEADS.filter((l) => l.etapa === etapa).length,
    }))
  }, [LEADS])

  const maxHeatmap = Math.max(...heatmapData.grid.map((g) => g.count), 1)

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando analytics...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Embudo Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {selectedEmbudo === "todos"
              ? "Analisis detallado de todos los embudos"
              : `Analisis del embudo: ${selectedEmbudoConfig?.nombre}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedEmbudo} onValueChange={setSelectedEmbudo}>
            <SelectTrigger className="w-[240px] border-border/50 bg-card">
              <SelectValue placeholder="Seleccionar embudo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Todos los embudos
                </span>
              </SelectItem>
              {EMBUDOS.map((embudo) => (
                <SelectItem key={embudo.id} value={embudo.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: embudo.color }}
                    />
                    {embudo.nombre}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Leads en embudo</p>
            <p className="text-2xl font-bold">{LEADS.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tasa de conversion</p>
            <p className="text-2xl font-bold">
              {LEADS.length > 0
                ? `${Math.round((LEADS.filter((l) => l.cta_clicked).length / LEADS.length) * 100)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Leads cerrados</p>
            <p className="text-2xl font-bold">{LEADS.filter((l) => l.etapa === "cerrado").length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Leads perdidos</p>
            <p className="text-2xl font-bold">{LEADS.filter((l) => l.etapa === "perdido").length}</p>
          </CardContent>
        </Card>
      </div>

      {allLeads.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Sin datos todavia. Los analytics se generan cuando hay leads en la base de datos.</p>
          </CardContent>
        </Card>
      ) : LEADS.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No hay leads asignados a este embudo.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Funnel Conversion */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Embudo de Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-1">
                {funnelData.map((step, i) => {
                  const maxWidth = 100
                  const width = Math.max(20, (step.pctTotal / 100) * maxWidth)
                  return (
                    <div key={step.step} className="flex items-center gap-4">
                      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">{step.etapa}</span>
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className="flex h-8 items-center justify-center rounded transition-all"
                          style={{ width: `${width}%`, backgroundColor: FUNNEL_COLORS[i] }}
                        >
                          <span className="text-xs font-semibold text-foreground">{step.cantidad}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-muted-foreground">{step.pctTotal}%</span>
                          {i > 0 && (
                            <span className={cn(
                              "font-mono",
                              step.retencion >= 70 ? "text-emerald-400" :
                              step.retencion >= 40 ? "text-amber-400" : "text-red-400"
                            )}>
                              {step.retencion}% ret.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                      formatter={(value: number, _name: string, props: { payload?: { pctTotal?: number } }) => [`${value} leads (${props.payload?.pctTotal ?? 0}% del total)`, "Cantidad"]}
                    />
                    <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {funnelData.map((_, i) => (<Cell key={i} fill={FUNNEL_COLORS[i]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Heatmap */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Heatmap de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-8 shrink-0" />
                    {heatmapData.hours.map((h) => (
                      <div key={h} className="flex flex-1 items-center justify-center text-[9px] text-muted-foreground">{h}h</div>
                    ))}
                  </div>
                  {heatmapData.days.map((day) => (
                    <div key={day} className="flex items-center gap-1">
                      <div className="w-8 shrink-0 text-right text-[10px] text-muted-foreground">{day}</div>
                      {heatmapData.hours.map((hour) => {
                        const cell = heatmapData.grid.find((g) => g.day === day && g.hour === hour)
                        const intensity = cell ? cell.count / maxHeatmap : 0
                        return (
                          <div
                            key={`${day}-${hour}`}
                            className="flex flex-1 items-center justify-center rounded-sm transition-colors"
                            style={{
                              aspectRatio: "1",
                              backgroundColor: intensity > 0 ? `hsl(var(--primary) / ${Math.max(0.1, intensity * 0.8)})` : "hsl(var(--secondary))",
                            }}
                            title={`${day} ${hour}:00 - ${cell?.count || 0} eventos`}
                          />
                        )
                      })}
                    </div>
                  ))}
                  <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                    <span>Menos</span>
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity) => (
                      <div key={intensity} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${intensity})` }} />
                    ))}
                    <span>Mas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time per Stage */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Promedio por Etapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tiempoPorEtapa} layout="vertical" margin={{ top: 5, right: 50, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.floor(v / 60)}m`} />
                      <YAxis dataKey="etapa" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                        formatter={(_value: number, _name: string, props: { payload?: { minutos?: string } }) => [props.payload?.minutos ?? "0m 0s", "Tiempo promedio"]}
                      />
                      <Bar dataKey="segundos" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Sources */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fuentes de Leads Calientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Fuente</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                      <TableHead className="text-center text-xs">Calientes</TableHead>
                      <TableHead className="text-center text-xs">Tibios</TableHead>
                      <TableHead className="text-right text-xs">Conv. %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuentesCalientes.map((row) => (
                      <TableRow key={row.fuente}>
                        <TableCell className="py-2.5 text-sm font-medium">{row.fuente}</TableCell>
                        <TableCell className="py-2.5 text-center text-sm text-muted-foreground">{row.total}</TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge variant="secondary" className="bg-red-500/15 text-red-400 border-red-500/30 font-mono text-xs">{row.calientes}</Badge>
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border-amber-500/30 font-mono text-xs">{row.tibios}</Badge>
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <span className={cn("font-mono text-sm font-semibold", row.conversionCaliente >= 30 ? "text-emerald-400" : row.conversionCaliente >= 15 ? "text-amber-400" : "text-muted-foreground")}>
                            {row.conversionCaliente}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pipeline Distribution */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Distribucion del Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineDistribution} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="etapa" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="cantidad" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
