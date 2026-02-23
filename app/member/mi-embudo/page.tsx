"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EMBUDOS } from "@/lib/embudos-config"
import { useAuth } from "@/lib/auth-context"
import { getTeamMemberById } from "@/lib/team-data"
import {
  Rocket, ArrowRight, CheckCircle2, Eye, Copy, Check,
  Layers, ChevronRight, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import type { Lead } from "@/lib/types"
import { Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const ETAPA_ICONS: Record<string, string> = {
  Play: "▶",
  Phone: "📞",
  MessageSquare: "💬",
  Terminal: "💻",
  LogIn: "🔑",
  Video: "📱",
  ShoppingCart: "🛒",
  AlertTriangle: "⚠",
  Bot: "🤖",
  Brain: "🧠",
  Monitor: "🖥",
  Users: "👥",
}

export default function MemberEmbudoPage() {
  const { user } = useAuth()
  const member = user?.memberId ? getTeamMemberById(user.memberId) : null
  const [selectedEmbudo, setSelectedEmbudo] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: allLeads, isLoading } = useSWR<Lead[]>("/api/admin/leads", fetcher, {
    refreshInterval: 15000,
  })

  if (!member) return null

  const embudosAsignados = EMBUDOS.filter((e) => member.embudos_asignados.includes(e.id))
  const activeEmbudo = selectedEmbudo
    ? embudosAsignados.find((e) => e.id === selectedEmbudo)
    : embudosAsignados[0] || null

  const myLeads = (allLeads || []).filter(
    (l) => activeEmbudo && l.embudo_id === activeEmbudo.id
  )

  const handleCopy = (embudoId: string) => {
    const url = `${window.location.origin}/funnel/${embudoId}?ref=${member.id}`
    navigator.clipboard.writeText(url)
    setCopied(embudoId)
    setTimeout(() => setCopied(null), 2000)
  }

  if (embudosAsignados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <Layers className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">Sin embudos asignados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu admin aun no te ha asignado embudos. Contactalo para activarlos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis embudos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {embudosAsignados.length} embudo{embudosAsignados.length !== 1 ? "s" : ""} activo{embudosAsignados.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Embudo selector */}
      {embudosAsignados.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {embudosAsignados.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEmbudo(e.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                (activeEmbudo?.id === e.id)
                  ? "border-primary/40 bg-primary/10 text-foreground shadow-sm"
                  : "border-border/30 bg-card/40 text-muted-foreground hover:border-border/60 hover:text-foreground"
              )}
            >
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color }} />
              {e.nombre}
            </button>
          ))}
        </div>
      )}

      {activeEmbudo && (
        <>
          {/* Active embudo header */}
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${activeEmbudo.color}, hsl(var(--primary)))`,
                boxShadow: `0 8px 24px ${activeEmbudo.color}33`,
              }}
            >
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{activeEmbudo.nombre}</h2>
              <p className="text-sm text-muted-foreground">{activeEmbudo.descripcion}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                  {activeEmbudo.estado}
                </Badge>
                <Badge variant="outline" className="border-border/50 text-muted-foreground">
                  {activeEmbudo.tipo}
                </Badge>
                <Badge variant="outline" className="border-border/50 text-muted-foreground">
                  {activeEmbudo.etapas.length} etapas
                </Badge>
                {!isLoading && (
                  <Badge variant="outline" className="border-border/50 text-muted-foreground">
                    <Eye className="mr-1 h-3 w-3" />
                    {myLeads.length} leads
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Link personal */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-foreground">Tu link personal</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Comparte este enlace para que tus prospectos ingresen al embudo con tu referencia:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-lg bg-background/60 px-3 py-2.5 text-xs text-foreground font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}/funnel/{activeEmbudo.id}?ref={member.id}
                </code>
                <button
                  onClick={() => handleCopy(activeEmbudo.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                    copied === activeEmbudo.id
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {copied === activeEmbudo.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === activeEmbudo.id ? "Copiado" : "Copiar"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Funnel Stages */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground">Etapas del embudo</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeEmbudo.etapas.map((etapa, idx) => {
                  const leadsAtStage = myLeads.filter((l) => l.etapa_maxima_alcanzada >= etapa.id)
                  const pct = myLeads.length > 0
                    ? Math.round((leadsAtStage.length / myLeads.length) * 100)
                    : 0

                  return (
                    <div key={etapa.id} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all",
                          idx === 0
                            ? "bg-primary/15 shadow-sm shadow-primary/10"
                            : "bg-secondary/50"
                        )}
                      >
                        {ETAPA_ICONS[etapa.icon] || "●"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{etapa.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {pct}% ({leadsAtStage.length})
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${activeEmbudo.color}, hsl(var(--primary) / 0.6))`,
                            }}
                          />
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{etapa.description}</p>
                      </div>
                      {idx < activeEmbudo.etapas.length - 1 && (
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-border/30">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <span className="text-2xl font-bold text-foreground">{myLeads.length}</span>
                <span className="text-xs text-muted-foreground">Leads totales</span>
              </CardContent>
            </Card>
            <Card className="border-border/30">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <span className="text-2xl font-bold text-emerald-400">
                  {myLeads.filter((l) => l.etapa === "cerrado").length}
                </span>
                <span className="text-xs text-muted-foreground">Cerrados</span>
              </CardContent>
            </Card>
            <Card className="border-border/30">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <span className="text-2xl font-bold text-amber-400">
                  {myLeads.filter((l) => l.whatsapp_cita_enviado).length}
                </span>
                <span className="text-xs text-muted-foreground">Citas enviadas</span>
              </CardContent>
            </Card>
            <Card className="border-border/30">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <span className="text-2xl font-bold text-primary">
                  {myLeads.length > 0
                    ? Math.round((myLeads.filter((l) => l.etapa === "cerrado").length / myLeads.length) * 100)
                    : 0}%
                </span>
                <span className="text-xs text-muted-foreground">Conversion</span>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* All embudos quick links */}
      {embudosAsignados.length > 1 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-foreground">Links rapidos de todos tus embudos</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {embudosAsignados.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-card/40 p-3 transition-all hover:border-border/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="truncate text-sm font-medium text-foreground">{e.nombre}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(e.id)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-all",
                      copied === e.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {copied === e.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === e.id ? "Copiado" : "Copiar"}
                  </button>
                  <button
                    onClick={() => setSelectedEmbudo(e.id)}
                    className="rounded-lg bg-secondary/50 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
