"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Route,
  Eye,
  Loader2,
  Zap,
  Crown,
  Rocket,
  Bot,
  Leaf,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import type { Lead } from "@/lib/types"
import { calcularTemperatura } from "@/lib/lead-scoring"
import { EMBUDOS, type Embudo } from "@/lib/embudos-config"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const EMBUDO_VISUALS: Record<string, {
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  shadowColor: string
  bgPattern: string
}> = {
  "nomada-vip": {
    icon: Crown,
    gradient: "from-purple-600 via-violet-500 to-fuchsia-500",
    shadowColor: "shadow-purple-500/20",
    bgPattern: "radial-gradient(circle at 20% 80%, hsla(271,76%,53%,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsla(322,80%,58%,0.1) 0%, transparent 50%)",
  },
  "funnel-high-ticket-k": {
    icon: Zap,
    gradient: "from-fuchsia-600 via-pink-500 to-rose-500",
    shadowColor: "shadow-fuchsia-500/20",
    bgPattern: "radial-gradient(circle at 30% 70%, hsla(322,80%,58%,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, hsla(292,84%,61%,0.1) 0%, transparent 50%)",
  },
  "franquicia-reset": {
    icon: Rocket,
    gradient: "from-violet-600 via-purple-500 to-indigo-500",
    shadowColor: "shadow-violet-500/20",
    bgPattern: "radial-gradient(circle at 25% 75%, hsla(262,83%,65%,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 25%, hsla(271,76%,53%,0.1) 0%, transparent 50%)",
  },
  "tu-esclavo-digital": {
    icon: Bot,
    gradient: "from-pink-600 via-fuchsia-500 to-purple-500",
    shadowColor: "shadow-pink-500/20",
    bgPattern: "radial-gradient(circle at 35% 65%, hsla(292,84%,61%,0.15) 0%, transparent 50%), radial-gradient(circle at 65% 35%, hsla(330,81%,60%,0.1) 0%, transparent 50%)",
  },
  "esclavo-digital-masterclass": {
    icon: Bot,
    gradient: "from-cyan-600 via-sky-500 to-blue-500",
    shadowColor: "shadow-cyan-500/20",
    bgPattern: "radial-gradient(circle at 25% 75%, hsla(185,80%,50%,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 25%, hsla(200,80%,50%,0.1) 0%, transparent 50%)",
  },
  "munot-detox": {
    icon: Leaf,
    gradient: "from-emerald-600 via-teal-500 to-green-500",
    shadowColor: "shadow-emerald-500/20",
    bgPattern: "radial-gradient(circle at 30% 70%, hsla(160,70%,40%,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, hsla(140,60%,45%,0.1) 0%, transparent 50%)",
  },
}

function EmbudoVisualCard({
  embudo,
  totalLeads,
  index,
}: {
  embudo: Embudo
  totalLeads: number
  index: number
}) {
  const visuals = EMBUDO_VISUALS[embudo.id] || EMBUDO_VISUALS["nomada-vip"]
  const IconComponent = visuals.icon

  return (
    <Link href={`/admin/embudos/${embudo.id}`} className="group block">
      <div
        className="embudo-card-enter relative overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl"
        style={{
          animationDelay: `${index * 120}ms`,
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: visuals.bgPattern }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center gap-5 p-8">
          {/* Animated icon container */}
          <div className="relative">
            {/* Pulse ring */}
            <div
              className={`absolute -inset-3 rounded-full bg-gradient-to-r ${visuals.gradient} opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-30`}
            />
            <div
              className={`absolute -inset-1.5 rounded-full bg-gradient-to-r ${visuals.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-20`}
            />

            {/* Icon circle */}
            <div
              className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${visuals.gradient} shadow-lg ${visuals.shadowColor} transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl`}
            >
              <IconComponent className="h-9 w-9 text-primary-foreground drop-shadow-md" />
            </div>

            {/* Status dot */}
            <div className="absolute -right-1 -top-1">
              <div
                className={`h-4 w-4 rounded-full border-2 border-card ${
                  embudo.estado === "activo" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {embudo.estado === "activo" && (
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-40" />
              )}
            </div>
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-lg font-bold tracking-tight text-balance text-foreground">
              {embudo.nombre}
            </h3>
            <p className="line-clamp-2 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
              {embudo.descripcion}
            </p>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2">
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
            <Badge variant="outline" className="border-border/50 text-muted-foreground">
              {embudo.etapas.length} etapas
            </Badge>
          </div>

          {/* Mini stat */}
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1.5">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {embudo.estado === "activo" ? totalLeads : 0} leads
            </span>
          </div>

          {/* Hover CTA */}
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-4px]">
            Ver embudo <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Bottom gradient line */}
        <div
          className={`h-1 w-full bg-gradient-to-r ${visuals.gradient} opacity-40 transition-opacity duration-300 group-hover:opacity-100`}
        />
      </div>
    </Link>
  )
}

export default function EmbudosPage() {
  const { data, isLoading } = useSWR("/api/admin/dashboard", fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando embudos...</p>
      </div>
    )
  }

  const leads = (data.leads || []) as Lead[]
  const totalLeads = leads.length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Embudos</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona un embudo para ver sus estadisticas y metricas detalladas
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Route className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Embudos</p>
              <p className="text-lg font-bold">{EMBUDOS.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Activos</p>
              <p className="text-lg font-bold">
                {EMBUDOS.filter((e) => e.estado === "activo").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Borradores</p>
              <p className="text-lg font-bold">
                {EMBUDOS.filter((e) => e.estado === "borrador").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <Eye className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leads Totales</p>
              <p className="text-lg font-bold">{totalLeads}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embudo Visual Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {EMBUDOS.map((embudo, index) => (
          <EmbudoVisualCard
            key={embudo.id}
            embudo={embudo}
            totalLeads={totalLeads}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
