"use client"

import { Trophy, Calendar, Pencil, Power, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Challenge } from "@/lib/challenges-data"
import { TIPO_LABELS, getDiasRestantes, formatFechaCorta, getRanking } from "@/lib/challenges-data"

interface ChallengeCardProps {
  challenge: Challenge
  onEdit: (challenge: Challenge) => void
  onToggleActive: (id: string) => void
  onViewRanking: (challenge: Challenge) => void
}

export function ChallengeCard({ challenge, onEdit, onToggleActive, onViewRanking }: ChallengeCardProps) {
  const dias = getDiasRestantes(challenge.fecha_fin)
  const ranking = getRanking(challenge)
  const top3 = ranking.slice(0, 3)

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 transition-all",
        !challenge.activo && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground">{challenge.titulo}</h3>
              <span className="rounded-full border border-border bg-secondary/80 px-2.5 py-0.5 text-[10px] font-semibold text-foreground">
                {TIPO_LABELS[challenge.tipo]}
              </span>
              {challenge.activo ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  Activo
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Inactivo
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatFechaCorta(challenge.fecha_inicio)} - {formatFechaCorta(challenge.fecha_fin)}
              </span>
              {challenge.activo && dias > 0 && (
                <span className="font-semibold text-primary">{dias} dias restantes</span>
              )}
              {challenge.activo && dias === 0 && (
                <span className="font-semibold text-destructive">Finalizado</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewRanking(challenge)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Ver ranking"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(challenge)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Editar reto"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onToggleActive(challenge.id)}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              challenge.activo
                ? "text-emerald-400 hover:bg-emerald-500/10"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            aria-label={challenge.activo ? "Desactivar reto" : "Activar reto"}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Premios */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {challenge.premios.map((p) => (
          <span key={p.puesto} className="flex items-center gap-1">
            <span className="font-semibold text-foreground">
              {p.puesto === 1 ? "1er" : p.puesto === 2 ? "2do" : `${p.puesto}er`} lugar:
            </span>
            <span>${p.monto} {p.moneda}</span>
          </span>
        ))}
      </div>

      {/* Top 3 mini ranking */}
      {challenge.activo && top3.length > 0 && (
        <div className="mt-4 flex items-center gap-3 border-t border-border/30 pt-4">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Top 3:</span>
          <div className="flex items-center gap-2">
            {top3.map((r) => (
              <div
                key={r.member.id}
                className="flex items-center gap-1.5 rounded-full bg-secondary/60 px-2.5 py-1"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                  {r.member.avatar_initials}
                </span>
                <span className="text-[11px] text-foreground">{r.member.nombre.split(" ")[0]}</span>
                <span className="text-[10px] text-muted-foreground">{r.valor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
