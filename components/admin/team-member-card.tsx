"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TeamMember } from "@/lib/team-data"

interface TeamMemberCardProps {
  member: TeamMember
  index: number
  metricView: "publicidad" | "organico"
}

export function TeamMemberCard({ member, index, metricView }: TeamMemberCardProps) {
  const [localView, setLocalView] = useState<"publicidad" | "organico">(metricView)

  const pubData = member.publicidad
  const orgData = member.organico

  return (
    <Card
      className="embudo-card-enter group relative border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Header: Name + menu */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {member.avatar_initials}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">{member.nombre}</h3>
              <p className="text-[10px] text-muted-foreground">@{member.username || member.id}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    member.publicidad_activa
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      member.publicidad_activa ? "bg-emerald-400" : "bg-muted-foreground"
                    )}
                  />
                  {member.publicidad_activa ? "Publicidad Activa" : "Publicidad Inactiva"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    member.fecha_renovacion
                      ? "bg-orange-500/15 text-orange-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {member.fecha_renovacion ? `Renov.: ${member.fecha_renovacion}` : "Sin fecha"}
                </span>
                {member.sponsorUsername && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                    <Shield className="h-2.5 w-2.5" />
                    Patroc.: @{member.sponsorUsername}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Global Metrics */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Metricas Globales
          </p>
          <div className="flex items-center divide-x divide-border">
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-foreground">{member.metricas.leads}</p>
              <p className="text-[10px] text-muted-foreground">Leads</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-foreground">{member.metricas.cerrados}</p>
              <p className="text-[10px] text-muted-foreground">Cerrados</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-foreground">{member.metricas.afiliados}</p>
              <p className="text-[10px] text-muted-foreground">Afiliados</p>
            </div>
          </div>
        </div>

        {/* Publicidad / Organico Tabs */}
        <div>
          <div className="mb-3 flex border-b border-border">
            <button
              onClick={() => setLocalView("publicidad")}
              className={cn(
                "flex-1 pb-2 text-xs font-semibold transition-colors",
                localView === "publicidad"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Publicidad
            </button>
            <button
              onClick={() => setLocalView("organico")}
              className={cn(
                "flex-1 pb-2 text-xs font-semibold transition-colors",
                localView === "organico"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Organico
            </button>
          </div>

          {localView === "publicidad" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">
                  {pubData.inversion_total} <span className="text-xs font-normal text-muted-foreground">USD</span>
                </p>
                <p className="text-[10px] text-muted-foreground">Inversion total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {pubData.saldo_disponible} <span className="text-xs font-normal text-muted-foreground">USD</span>
                </p>
                <p className="text-[10px] text-muted-foreground">Saldo disponible</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{pubData.leads_totales}</p>
                <p className="text-[10px] text-muted-foreground">Leads totales</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{pubData.leads_cerrados}</p>
                <p className="text-[10px] text-muted-foreground">Leads cerrados</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">
                  {orgData.saldo_disponible} <span className="text-xs font-normal text-muted-foreground">USD</span>
                </p>
                <p className="text-[10px] text-muted-foreground">Saldo disponible</p>
              </div>
              <div className="col-span-1" />
              <div>
                <p className="text-lg font-bold text-foreground">{orgData.leads_totales}</p>
                <p className="text-[10px] text-muted-foreground">Leads totales</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{orgData.leads_cerrados}</p>
                <p className="text-[10px] text-muted-foreground">Leads cerrados</p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/admin/equipo/${member.id}`} className="mt-auto">
          <Button className="w-full bg-emerald-600 text-primary-foreground hover:bg-emerald-700" size="sm">
            Ver detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
