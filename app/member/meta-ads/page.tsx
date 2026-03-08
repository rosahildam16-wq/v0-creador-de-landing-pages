"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMemberData } from "@/lib/team-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { FeatureGate } from "@/components/feature-gate"
import { PixelConfigBlock } from "@/components/admin/pixel-config-block"
import { MetaAdsSection } from "@/components/member/meta-ads-section"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Target,
  Info,
  Zap,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

const TABS = [
  { id: "ads", label: "Meta Ads", icon: BarChart3, desc: "Métricas de tus campañas publicitarias" },
  { id: "pixel", label: "Pixel & Tracking", icon: Target, desc: "Seguimiento de conversiones por embudo" },
] as const

type Tab = (typeof TABS)[number]["id"]

export default function MetaAdsPage() {
  const { user } = useAuth()
  const member = getMemberData(user)
  const [tab, setTab] = useState<Tab>("ads")

  const memberId = user?.username || user?.memberId || "admin"

  // Only show funnels assigned to this member
  const assignedIds = member?.embudos_asignados || []
  const assignedFunnels = EMBUDOS.filter((e) => assignedIds.includes(e.id))

  return (
    <FeatureGate
      feature="metaAds"
      description="Conecta tu cuenta de Meta Ads y configura el Pixel de seguimiento personalizado para cada uno de tus embudos. Disponible en el plan Pro ($97)."
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meta Ads & Pixel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tu publicidad y seguimiento de conversiones, todo en un lugar.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 rounded-xl border border-border/30 bg-card/40 p-1 w-full sm:w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                tab === t.id
                  ? "bg-primary/10 text-foreground shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Meta Ads ── */}
        {tab === "ads" && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-300/80 leading-relaxed">
                <strong className="text-blue-300">¿Cómo obtener tus credenciales?</strong>
                <ol className="mt-1.5 list-decimal list-inside space-y-1 text-blue-300/70">
                  <li>Ve a <strong>Meta Business Suite → Configuración → Cuentas Publicitarias</strong></li>
                  <li>Copia el <strong>ID de la cuenta</strong> (formato: act_XXXXXXXXXX)</li>
                  <li>Ve a <strong>Meta for Developers → Herramientas para el token de acceso</strong></li>
                  <li>Genera un <strong>token de usuario de larga duración</strong> con permisos: ads_read, ads_management</li>
                </ol>
              </div>
            </div>

            <MetaAdsSection memberId={memberId} />

            {/* Events reference */}
            <div className="rounded-xl border border-border/30 bg-card/30 p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Eventos que se disparan automáticamente en tus embudos
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { name: "PageView", color: "blue", desc: "Visita al funnel" },
                  { name: "Lead", color: "emerald", desc: "Registro en el quiz" },
                  { name: "Contact", color: "purple", desc: "Click en WhatsApp" },
                  { name: "CompleteRegistration", color: "amber", desc: "Quiz completado" },
                  { name: "ViewContent", color: "rose", desc: "Vista de la landing" },
                  { name: "Schedule", color: "cyan", desc: "Cita agendada" },
                ].map((ev) => (
                  <div
                    key={ev.name}
                    className="flex items-center gap-2 rounded-lg border border-border/20 bg-secondary/20 p-2.5"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-foreground">{ev.name}</p>
                      <p className="text-[9px] text-muted-foreground">{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Pixel & Tracking ── */}
        {tab === "pixel" && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-300/80 leading-relaxed">
                <strong className="text-blue-300">¿Cómo funciona el Pixel por embudo?</strong>
                <p className="mt-1 text-blue-300/70">
                  Cada embudo puede tener su propio Pixel de Meta. Cuando alguien entra por tu link personal
                  (<span className="font-mono">/r/tuusuario/embudo</span>), los eventos se enviarán
                  a <strong>tu Pixel</strong> — no al del administrador.
                  Si no configuras tu pixel, el sistema usa el pixel global como respaldo.
                </p>
              </div>
            </div>

            {/* Pixel config per funnel */}
            {assignedFunnels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Target className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Sin embudos asignados.</p>
                <p className="text-xs text-muted-foreground/60">Contacta al administrador para que te asigne embudos.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {assignedFunnels.map((funnel) => (
                  <div key={funnel.id} className="flex flex-col gap-2">
                    {/* Funnel label */}
                    <div className="flex items-center gap-2 px-1">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: funnel.color }}
                      />
                      <span className="text-sm font-semibold text-foreground">{funnel.nombre}</span>
                      <span className="text-xs text-muted-foreground">— tu link:</span>
                      <code className="text-[10px] text-muted-foreground font-mono">
                        /r/{memberId}/{funnel.id}
                      </code>
                      <a
                        href={`/r/${memberId}/${funnel.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        Ver <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                    <PixelConfigBlock
                      embudoId={funnel.id}
                      embudoNombre={funnel.nombre}
                      memberId={memberId}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* What happens if no pixel */}
            <div className="rounded-xl border border-border/20 bg-card/20 p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Comportamiento sin Pixel propio
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { step: "1", text: "Alguien entra a tu link personal del embudo" },
                  { step: "2", text: "El sistema busca tu Pixel para ese embudo" },
                  { step: "3", text: "Si no tienes → usa el Pixel del administrador como respaldo" },
                  { step: "4", text: "Los eventos igual se disparan, pero van a la cuenta del admin" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/50 text-[10px] font-bold text-muted-foreground">
                      {s.step}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  )
}
