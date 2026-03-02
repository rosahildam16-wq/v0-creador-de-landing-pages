"use client"

import { use, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FunnelController } from "@/components/funnel-controller"
import type { Lead } from "@/lib/types"
import { calcularTemperatura } from "@/lib/lead-scoring"
import {
  Eye,
  Users,
  TrendingUp,
  ArrowRight,
  Smartphone,
  ExternalLink,
  Play,
  MessageSquare,
  Phone,
  Terminal,
  LogIn,
  Video,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  Plug,
  CheckCircle2,
  XCircle,
  History,
  RotateCcw,
  RefreshCw,
  Activity,
} from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { EMBUDOS, type EmbudoGHLConfig } from "@/lib/embudos-config"
import { EmbudoGHLBlock } from "@/components/admin/embudo-ghl-block"
import { PixelConfigBlock } from "@/components/admin/pixel-config-block"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function EmbudoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const embudo = EMBUDOS.find((e) => e.id === id)
  const [previewStage, setPreviewStage] = useState<number | null>(null)

  const { data, isLoading } = useSWR("/api/admin/dashboard", fetcher, {
    refreshInterval: 30000,
  })

  if (!embudo) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Embudo no encontrado</p>
        <Link href="/admin/embudos" className="text-xs text-primary hover:underline">
          Volver a embudos
        </Link>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando embudo...</p>
      </div>
    )
  }

  const leads = (data.leads || []) as Lead[]
  const metricas = data.metricas || { tasaConversion: 0 }
  const conversionEmbudo = data.conversionEmbudo || []
  const totalLeads = leads.length

  const hotLeads = leads.filter((l: Lead) => calcularTemperatura(l).temperatura === "CALIENTE").length
  const warmLeads = leads.filter((l: Lead) => calcularTemperatura(l).temperatura === "TIBIO").length

  function getStageConversion(stageIndex: number) {
    if (stageIndex < conversionEmbudo.length) {
      return conversionEmbudo[stageIndex]
    }
    return { cantidad: 0, pct: 0 }
  }

  function getDropOff(stageIndex: number) {
    if (stageIndex === 0) return 0
    const prev = getStageConversion(stageIndex - 1)
    const curr = getStageConversion(stageIndex)
    if (prev.cantidad === 0) return 0
    return Math.round(((prev.cantidad - curr.cantidad) / prev.cantidad) * 100)
  }

  const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Play, Phone, MessageSquare, Terminal, LogIn, Video, ShoppingCart, Users,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/embudos"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{embudo.nombre}</h1>
              <Badge
                variant="outline"
                className={
                  embudo.estado === "activo"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                }
              >
                {embudo.estado === "activo" ? "Activo" : "Borrador"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{embudo.descripcion}</p>
          </div>
        </div>
        <Link
          href={`/funnel?embudo=${id}`}
          target="_blank"
          className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir embudo completo
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visitas Totales</p>
              <p className="text-lg font-bold">{totalLeads}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tasa Conversion</p>
              <p className="text-lg font-bold">{metricas.tasaConversion}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <Users className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leads Calientes</p>
              <p className="text-lg font-bold">{hotLeads}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leads Tibios</p>
              <p className="text-lg font-bold">{warmLeads}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GoHighLevel Integration Block */}
      <EmbudoGHLBlock embudoId={id} embudoNombre={embudo.nombre} ghlConfig={embudo.ghl} />

      {/* Meta Pixel Config Block (like Hotmart) */}
      <PixelConfigBlock embudoId={id} embudoNombre={embudo.nombre} />

      {/* Main Content: Phone Preview + Stage List */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Phone Preview */}
        <div className="flex flex-col items-center gap-3 lg:col-span-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            {previewStage !== null
              ? `Previsualizando: Etapa ${previewStage}`
              : "Vista previa en vivo"
            }
          </div>
          {previewStage !== null && (
            <button
              type="button"
              onClick={() => setPreviewStage(null)}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Volver al inicio
            </button>
          )}
          <div className="relative mx-auto w-full max-w-[320px]">
            <div className="rounded-[2.5rem] border-2 border-border/60 bg-card p-2 shadow-2xl">
              <div className="relative mx-auto mb-1 h-5 w-24 rounded-full bg-background" />
              <div className="relative h-[580px] overflow-hidden rounded-[2rem] bg-background">
                <div className="h-full w-full overflow-y-auto overflow-x-hidden" key={previewStage ?? "full"}>
                  <FunnelController embudoId={id} startAt={previewStage as any} />
                </div>
              </div>
              <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {previewStage !== null
              ? "Haz clic en otra etapa o \"Volver al inicio\" para reiniciar"
              : "Haz clic en una etapa para previsualizarla directamente"
            }
          </p>
        </div>

        {/* Funnel Stages */}
        <div className="lg:col-span-7">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Etapas del Embudo ({embudo.etapas.length} etapas)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-0">
              {embudo.etapas.map((stage, index) => {
                const conversion = getStageConversion(index)
                const dropOff = getDropOff(index)
                const barWidth = conversion.pct || 0
                const StageIcon = ICON_MAP[stage.icon] || Play

                return (
                  <div key={stage.id}>
                    <button
                      type="button"
                      onClick={() => setPreviewStage(stage.id)}
                      className={`group flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all ${previewStage === stage.id
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-secondary/50"
                        }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${previewStage === stage.id ? "bg-primary/20" : "bg-secondary"
                        }`}>
                        <StageIcon className={`h-4 w-4 ${previewStage === stage.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{stage.label}</span>
                            <Badge variant="outline" className={`text-[10px] font-normal ${previewStage === stage.id ? "border-primary/30 text-primary" : ""}`}>
                              Exp {stage.id}
                            </Badge>
                            {previewStage === stage.id && (
                              <Badge className="bg-primary/15 text-[9px] font-semibold text-primary hover:bg-primary/15">
                                PREVIEWING
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">{conversion.cantidad}</span>
                            <span className="text-xs text-muted-foreground">({conversion.pct}%)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          {dropOff > 0 && (
                            <span className="shrink-0 text-[10px] text-red-400">
                              -{dropOff}% drop
                            </span>
                          )}
                        </div>
                      </div>
                      <Play className={`h-3.5 w-3.5 shrink-0 transition-opacity ${previewStage === stage.id ? "text-primary opacity-100" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"}`} />
                    </button>

                    {index < embudo.etapas.length - 1 && (
                      <div className="flex items-center justify-center py-0.5">
                        <ArrowRight className="h-3 w-3 rotate-90 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
