"use client"

import { Trophy, Calendar, Gift } from "lucide-react"
import type { Challenge } from "@/lib/challenges-data"
import { TIPO_LABELS, getDiasRestantes, formatFechaCorta } from "@/lib/challenges-data"

interface ActiveChallengeCardProps {
  challenge: Challenge
  posicion?: number
}

export function ActiveChallengeCard({ challenge, posicion }: ActiveChallengeCardProps) {
  const dias = getDiasRestantes(challenge.fecha_fin)

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <div className="flex items-start gap-4">
        {/* Trophy icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <Trophy className="h-6 w-6 text-emerald-400" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {/* Title row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground tracking-wide">
              {challenge.titulo}
            </h3>
            <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-foreground">
              {TIPO_LABELS[challenge.tipo]}
            </span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatFechaCorta(challenge.fecha_inicio)} - {formatFechaCorta(challenge.fecha_fin)}
            </span>
            {dias > 0 ? (
              <span className="font-semibold text-emerald-400">{dias} dias restantes</span>
            ) : (
              <span className="font-semibold text-amber-400">Finalizado</span>
            )}
          </div>

          {/* Premios row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {challenge.premios.map((p) => (
              <span key={p.puesto} className="flex items-center gap-1">
                <Gift className="h-3 w-3 text-amber-400" />
                <span className="font-semibold text-foreground">
                  {p.puesto === 1 ? "1er" : p.puesto === 2 ? "2do" : `${p.puesto}er`} lugar:
                </span>
                ${p.monto} {p.moneda}
              </span>
            ))}
          </div>

          {/* Position in ranking */}
          {posicion !== undefined && (
            <div className="mt-1 inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1">
              <span className="text-xs font-semibold text-primary">
                Tu posicion: #{posicion}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
