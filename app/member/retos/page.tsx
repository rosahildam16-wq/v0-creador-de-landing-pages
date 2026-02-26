"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Calendar, Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Challenge } from "@/lib/challenges-data"
import { DEFAULT_CHALLENGES, getRanking, getDiasRestantes, formatFechaCorta, TIPO_LABELS, METRICA_LABELS } from "@/lib/challenges-data"
import { useAuth } from "@/lib/auth-context"
import { getMemberCommunity } from "@/lib/communities-data"

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) ?? sessionStorage.getItem(key) } catch { return null }
}

export default function MemberRetosPage() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)

  useEffect(() => {
    const stored = safeGet("mf_challenges")
    if (stored) {
      try { setChallenges(JSON.parse(stored)) } catch { /* use defaults */ }
    }
  }, [])

  const communityId = user?.memberId ? getMemberCommunity(user.memberId)?.id : undefined

  const activos = challenges.filter((c) =>
    c.activo && (!c.communityId || c.communityId === communityId)
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Retos Activos</h1>
        <p className="text-sm text-muted-foreground">Compite con tu equipo y gana premios</p>
      </div>

      {activos.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-4 rounded-xl py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No hay retos activos</h3>
          <p className="text-sm text-muted-foreground">Tu administrador publicara retos pronto</p>
        </div>
      )}

      {activos.map((challenge) => {
        const ranking = getRanking(challenge)
        const diasRestantes = getDiasRestantes(challenge.fecha_fin)
        const myRank = ranking.find((r) => r.member.id === user?.memberId)

        return (
          <div key={challenge.id} className="flex flex-col gap-4">
            {/* Challenge Header Card */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Trophy className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground">{challenge.titulo}</h2>
                    <span className="rounded-full border border-border/50 bg-secondary/50 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {TIPO_LABELS[challenge.tipo]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatFechaCorta(challenge.fecha_inicio)} - {formatFechaCorta(challenge.fecha_fin)}
                    </span>
                    <span className="font-semibold text-primary">{diasRestantes} dias restantes</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {challenge.premios.map((p) => (
                      <span key={p.puesto} className="flex items-center gap-1">
                        <Gift className="h-3 w-3 text-amber-400" />
                        <span className="text-muted-foreground">
                          {p.puesto === 1 ? "1er" : p.puesto === 2 ? "2do" : `${p.puesto}er`} lugar:
                        </span>
                        <span className="font-semibold text-foreground">${p.monto} {p.moneda}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* My position highlight */}
              {myRank && (
                <div className="mt-4 rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Tu posicion: #{myRank.posicion}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{myRank.valor} {METRICA_LABELS[challenge.metrica].toLowerCase()}</span>
                </div>
              )}
            </div>

            {/* Ranking Table */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/30 px-4 py-3">
                <Trophy className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Top 10 del Concurso</h3>
              </div>
              <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <span className="w-8">#</span>
                  <span className="flex-1">Nombre</span>
                  <span className="w-16 text-right">{challenge.metrica === "leads" ? "Leads" : challenge.metrica === "cerrados" ? "Cerrados" : "Afiliados"}</span>
                </div>
                {ranking.slice(0, 10).map((r) => {
                  const isMe = r.member.id === user?.memberId
                  return (
                    <div
                      key={r.member.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 transition-colors",
                        isMe ? "bg-emerald-500/10 border-l-2 border-emerald-500" : "hover:bg-secondary/20"
                      )}
                    >
                      <span className="w-8 shrink-0">
                        {r.posicion === 1 && <span className="text-amber-400 text-sm">&#x1F947;</span>}
                        {r.posicion === 2 && <span className="text-slate-300 text-sm">&#x1F948;</span>}
                        {r.posicion === 3 && <span className="text-orange-400 text-sm">&#x1F949;</span>}
                        {r.posicion > 3 && <span className="text-sm text-muted-foreground">{r.posicion}</span>}
                      </span>
                      <span className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {r.member.avatar_initials}
                        </span>
                        <span className={cn("text-sm truncate", isMe ? "font-bold text-foreground" : "text-foreground")}>
                          {r.member.nombre}
                        </span>
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">Tu</span>
                        )}
                      </span>
                      <span className={cn("w-16 text-right text-sm font-semibold", isMe ? "text-emerald-400" : "text-foreground")}>
                        {r.valor}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
