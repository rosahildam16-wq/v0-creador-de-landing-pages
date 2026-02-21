"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EMBUDOS } from "@/lib/embudos-config"
import { useAuth } from "@/lib/auth-context"
import { TEAM_MEMBERS } from "@/lib/team-data"
import { Rocket, ArrowRight, CheckCircle2, Eye } from "lucide-react"
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
}

export default function MemberEmbudoPage() {
  const { user } = useAuth()
  const member = TEAM_MEMBERS.find((m) => m.id === user?.memberId)

  const { data: allLeads, isLoading } = useSWR<Lead[]>("/api/admin/leads", fetcher, {
    refreshInterval: 15000,
  })

  // Get the Franquicia Reset embudo
  const franquiciaReset = EMBUDOS.find((e) => e.id === "franquicia-reset")

  // Get member's leads for this specific embudo
  const myLeads = (allLeads || []).filter(
    (l) => l.embudo_id === "franquicia-reset" && (l.asignado_a === member?.id || true)
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando embudo...</p>
      </div>
    )
  }

  if (!franquiciaReset) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Embudo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-500 shadow-lg shadow-violet-500/20">
          <Rocket className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{franquiciaReset.nombre}</h1>
          <p className="text-sm text-muted-foreground">{franquiciaReset.descripcion}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">Activo</Badge>
            <Badge variant="outline" className="border-border/50 text-muted-foreground">{franquiciaReset.etapas.length} etapas</Badge>
            <Badge variant="outline" className="border-border/50 text-muted-foreground">
              <Eye className="mr-1 h-3 w-3" />
              {myLeads.length} leads
            </Badge>
          </div>
        </div>
      </div>

      {/* Funnel Stages Visual */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-foreground">Etapas del embudo</h2>
        <div className="flex flex-col gap-2">
          {franquiciaReset.etapas.map((etapa, idx) => {
            // Simulate leads at each stage
            const leadsAtStage = myLeads.filter((l) => l.etapa_maxima_alcanzada >= etapa.id)
            const pct = myLeads.length > 0 ? Math.round((leadsAtStage.length / myLeads.length) * 100) : 0

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
                    <span className="text-xs text-muted-foreground">{pct}% ({leadsAtStage.length})</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{etapa.description}</p>
                </div>
                {idx < franquiciaReset.etapas.length - 1 && (
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-2xl font-bold text-foreground">{myLeads.length}</span>
            <span className="text-xs text-muted-foreground">Leads totales</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-2xl font-bold text-emerald-400">
              {myLeads.filter((l) => l.etapa === "cerrado").length}
            </span>
            <span className="text-xs text-muted-foreground">Cerrados</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-2xl font-bold text-amber-400">
              {myLeads.filter((l) => l.whatsapp_cita_enviado).length}
            </span>
            <span className="text-xs text-muted-foreground">Citas enviadas</span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="text-2xl font-bold text-primary">
              {myLeads.length > 0 ? Math.round((myLeads.filter((l) => l.etapa === "cerrado").length / myLeads.length) * 100) : 0}%
            </span>
            <span className="text-xs text-muted-foreground">Conversion</span>
          </CardContent>
        </Card>
      </div>

      {/* Link to share */}
      <Card className="border-border/50 bg-secondary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">Tu link del embudo</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Comparte este enlace para que tus prospectos ingresen al embudo:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-secondary/50 px-3 py-2 text-xs text-foreground font-mono">
              {typeof window !== "undefined" ? window.location.origin : ""}/funnel/franquicia-reset?ref={member?.id}
            </code>
            <button
              onClick={() => {
                const url = `${window.location.origin}/funnel/franquicia-reset?ref=${member?.id}`
                navigator.clipboard.writeText(url)
              }}
              className="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              Copiar
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
