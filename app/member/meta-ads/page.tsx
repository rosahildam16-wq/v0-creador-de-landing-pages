"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMemberData } from "@/lib/team-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { FeatureGate } from "@/components/feature-gate"
import { PixelConfigBlock } from "@/components/admin/pixel-config-block"
import { MetaAdsSection } from "@/components/member/meta-ads-section"
import { MetaAdsDashboard } from "@/components/member/meta-ads-dashboard"
import { cn } from "@/lib/utils"
import { BarChart3, Target, Settings } from "lucide-react"

const TABS = [
  { id: "dashboard", label: "Dashboard",      icon: BarChart3, desc: "Analítica avanzada de tus campañas" },
  { id: "config",    label: "Configuración",   icon: Settings,  desc: "Credenciales y conexión de Meta Ads" },
  { id: "pixel",     label: "Pixel & Tracking",icon: Target,    desc: "Seguimiento de conversiones por embudo" },
] as const

type Tab = (typeof TABS)[number]["id"]

export default function MetaAdsPage() {
  const { user } = useAuth()
  const member = getMemberData(user)
  const [tab, setTab] = useState<Tab>("dashboard")

  const memberId       = user?.username || user?.memberId || "admin"
  const assignedIds    = member?.embudos_asignados || []
  const assignedFunnels = EMBUDOS.filter((e) => assignedIds.includes(e.id))

  return (
    <FeatureGate
      feature="metaAds"
      description="Accede al panel de analítica avanzada de Meta Ads y configura el Pixel de seguimiento para cada embudo. Disponible en el plan Pro ($97)."
    >
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Meta Ads & Pixel</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Panel de analítica avanzada para tus campañas de Facebook e Instagram Ads.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border/30 bg-card/40 p-1 w-full sm:w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Dashboard ─────────────────────────────────────────────── */}
        {tab === "dashboard" && (
          <MetaAdsDashboard memberId={memberId} />
        )}

        {/* ── Tab: Configuración ─────────────────────────────────────────── */}
        {tab === "config" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/30 bg-card/60 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-foreground mb-1">Conexión con Meta Ads</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Ingresa tu Ad Account ID y Access Token para ver datos reales de tus campañas.
              </p>
              <MetaAdsSection memberId={memberId} />
            </div>

            {/* How to get credentials */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">¿Cómo obtener tus credenciales?</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Ve a <strong className="text-foreground">Meta Business Suite</strong> → Configuración del negocio</li>
                <li>En <strong className="text-foreground">Ad Account ID</strong>: copia el número que empieza con <code className="text-primary">act_</code></li>
                <li>En <strong className="text-foreground">Access Token</strong>: ve a <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">Graph API Explorer</a>, genera un token con permisos <code className="text-primary">ads_read</code></li>
                <li>Pega ambos datos arriba y haz clic en <strong className="text-foreground">Guardar</strong></li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Tab: Pixel & Tracking ─────────────────────────────────────── */}
        {tab === "pixel" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-foreground mb-1">Pixel por embudo</h2>
              <p className="text-sm text-muted-foreground">
                Cada embudo puede tener su propio Pixel ID para rastreo preciso de conversiones.
                Si no tienes pixel propio, se usará el pixel del administrador como respaldo.
              </p>
            </div>

            {assignedFunnels.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/30 bg-card/60 py-16">
                <Target className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No tienes embudos asignados aún.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedFunnels.map((funnel) => (
                  <div key={funnel.id} className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
                    <h3 className="font-semibold text-foreground mb-3">{funnel.nombre}</h3>
                    <PixelConfigBlock
                      embudoId={funnel.id}
                      embudoNombre={funnel.nombre}
                      memberId={memberId}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Fallback explanation */}
            <div className="rounded-xl border border-border/20 bg-secondary/20 p-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Jerarquía de pixel:</strong>{" "}
                Tu pixel → Pixel del administrador para ese embudo → Pixel global → Variable de entorno.
                El sistema usa el primero disponible de forma automática.
              </p>
            </div>
          </div>
        )}

      </div>
    </FeatureGate>
  )
}
