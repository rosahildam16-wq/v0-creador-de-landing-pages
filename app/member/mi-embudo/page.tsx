"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EMBUDOS } from "@/lib/embudos-config"
import { useAuth } from "@/lib/auth-context"
import { getMemberData } from "@/lib/team-data"
import { getMemberCommunity } from "@/lib/communities-data"
import {
  Rocket, ArrowRight, CheckCircle2, Eye, Copy, Check,
  Layers, ChevronRight, ExternalLink, Users, MessageSquare, Trophy
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
  const member = getMemberData(user)
  const [selectedEmbudo, setSelectedEmbudo] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const { data: allLeads, isLoading } = useSWR<Lead[]>(
    user?.email ? `/api/member/leads?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 15000 }
  )

  const finalMember = member!
  const ids = finalMember.embudos_asignados || []

  const embudosAsignados = EMBUDOS.filter((e) => ids.includes(e.id))
  const activeEmbudo = selectedEmbudo
    ? embudosAsignados.find((e) => e.id === selectedEmbudo)
    : embudosAsignados[0] || null

  const myLeads = (allLeads || []).filter((l) => {
    const matchEmbudo = activeEmbudo && l.embudo_id === activeEmbudo.id
    if (!matchEmbudo) return false

    // If regular member, only show their own leads
    if (user?.role === "member") {
      const isMine = l.asignado_a === user.username || l.asignado_a === user.name
      // Also check if assigned by community if member is in Skalia VIP and it matches
      const isInMyCommunity = l.community_id && l.community_id === user.communityId

      return isMine || isInMyCommunity
    }
    // Leaders see all leads for the community
    return true
  })

  const handleCopy = (embudoId: string) => {
    const url = `${window.location.origin}/r/${user?.username || finalMember.id}/${embudoId}`
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
          <div className="flex items-center gap-3 md:items-start md:gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg md:h-14 md:w-14"
              style={{
                background: `linear-gradient(135deg, ${activeEmbudo.color}, hsl(var(--primary)))`,
                boxShadow: `0 8px 24px ${activeEmbudo.color}33`,
              }}
            >
              <Rocket className="h-5 w-5 text-white md:h-7 md:w-7" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl truncate">{activeEmbudo.nombre}</h2>
              <p className="text-[11px] text-muted-foreground md:text-sm line-clamp-1">{activeEmbudo.descripcion}</p>
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
                  {typeof window !== "undefined" ? window.location.origin : ""}/r/{user?.username || finalMember.id}/{activeEmbudo.id}
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
              <div className="space-y-6">
                {/* Visual Funnel Representation */}
                <div className="flex items-end justify-around h-32 bg-secondary/20 rounded-2xl px-6 pt-8 pb-2 border border-border/10">
                  {activeEmbudo.etapas.map((etapa, idx) => {
                    const count = myLeads.filter((l) => l.etapa_maxima_alcanzada >= etapa.id).length
                    const maxCount = myLeads.length || 1
                    const height = Math.max(10, Math.round((count / maxCount) * 100))
                    return (
                      <div key={etapa.id} className="flex flex-col items-center gap-2 w-12 group relative">
                        <div
                          className="w-full rounded-t-lg transition-all duration-700 ease-out shadow-lg shadow-primary/10"
                          style={{
                            height: `${height}%`,
                            background: idx === 0 ? 'hsl(var(--primary))' : `hsl(var(--primary) / ${0.9 - (idx * 0.1)})`
                          }}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{count}</span>
                        <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-xl border border-border/20 z-10 whitespace-nowrap">
                          {etapa.label}
                        </div>
                      </div>
                    )
                  })}
                </div>

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
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-border/30 bg-card/40 backdrop-blur-sm shadow-sm group hover:border-primary/30 transition-all">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <Users className="h-4 w-4 text-muted-foreground/50 mb-1 group-hover:text-primary transition-colors" />
                <span className="text-2xl font-bold text-foreground">{myLeads.length}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Leads Totales</span>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/40 backdrop-blur-sm shadow-sm group hover:border-emerald-500/30 transition-all">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground/50 mb-1 group-hover:text-emerald-400 transition-colors" />
                <span className="text-2xl font-bold text-emerald-400">
                  {myLeads.filter((l) => l.etapa === "cerrado").length}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cerrados</span>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/40 backdrop-blur-sm shadow-sm group hover:border-amber-500/30 transition-all">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <MessageSquare className="h-4 w-4 text-muted-foreground/50 mb-1 group-hover:text-amber-400 transition-colors" />
                <span className="text-2xl font-bold text-amber-400">
                  {myLeads.filter((l) => l.whatsapp_cita_enviado).length}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Citas Enviadas</span>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/40 backdrop-blur-sm shadow-sm group hover:border-primary/30 transition-all">
              <CardContent className="flex flex-col items-center gap-1 p-4">
                <Trophy className="h-4 w-4 text-muted-foreground/50 mb-1 group-hover:text-primary transition-colors" />
                <span className="text-2xl font-bold text-primary">
                  {myLeads.length > 0
                    ? Math.round((myLeads.filter((l) => l.etapa === "cerrado").length / myLeads.length) * 100)
                    : 0}%
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conversión</span>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp Config (for Franquicia Reset) */}
          {activeEmbudo.id === "franquicia-reset" && (
            <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-3 px-1">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Configuración de Contacto (WhatsApp)</h3>
              </div>
              <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Tu número de WhatsApp (con código de país)</label>
                    <input
                      type="text"
                      placeholder="Ej: 573123456789"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-mono"
                      value={finalMember.whatsapp_number || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        import("@/lib/team-data").then(m => {
                          m.updateMemberWhatsApp(finalMember.id, val, finalMember.whatsapp_message || "");
                          // We need to trigger a re-render. Since we're using local state or SWR might be overkill,
                          // we'll just force a selectedEmbudo set to same to re-render.
                          setSelectedEmbudo(activeEmbudo.id);
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Mensaje de Bienvenida</label>
                    <div className="grid gap-2">
                      {[
                        "Hola, acabo de completar el diagnóstico y quiero solicitar mi acceso prioritario a la Franquicia RESET.",
                        "¡Hola! Vengo del sistema RESET, estoy listo para empezar mi transformación. ¿Me das el acceso?",
                        "He terminado el proceso de RESET. Quiero hablar con un asesor para activar mi motor de ventas."
                      ].map((msg, i) => {
                        const isSelected = finalMember.whatsapp_message === msg || (!finalMember.whatsapp_message && i === 0);
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              import("@/lib/team-data").then(m => {
                                m.updateMemberWhatsApp(finalMember.id, finalMember.whatsapp_number || "", msg);
                                setSelectedEmbudo(activeEmbudo.id);
                              });
                            }}
                            className={cn(
                              "text-left p-3 rounded-xl border text-xs transition-all duration-200",
                              isSelected
                                ? "border-primary/40 bg-primary/20 text-foreground"
                                : "border-white/5 bg-black/20 text-muted-foreground hover:bg-black/40"
                            )}
                          >
                            "{msg}"
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <p className="text-[10px] text-emerald-500/80 font-medium">
                      Configuración guardada automáticamente. Este número y mensaje se usarán en tu link personal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-bold text-foreground">Actividad reciente</h3>
              <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">Ver todos</button>
            </div>
            <Card className="border-border/30 bg-card/40 overflow-hidden">
              <div className="divide-y divide-border/5">
                {myLeads.slice(0, 5).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {lead.nombre[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{lead.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">Llegó desde {lead.fuente}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[9px] h-5 border-primary/20 bg-primary/5 text-primary">
                        {lead.etapa.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
                {myLeads.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-xs text-muted-foreground italic">No hay actividad reciente aún</p>
                  </div>
                )}
              </div>
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
