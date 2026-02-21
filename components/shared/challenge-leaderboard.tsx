"use client"

import type { Challenge, RankedMember } from "@/lib/challenges-data"
import { getRanking } from "@/lib/challenges-data"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChallengeLeaderboardProps {
  challenge: Challenge
  currentMemberId?: string
  limit?: number
}

const MEDAL_COLORS: Record<number, string> = {
  1: "text-amber-400",
  2: "text-zinc-400",
  3: "text-orange-500",
}

export function ChallengeLeaderboard({ challenge, currentMemberId, limit = 10 }: ChallengeLeaderboardProps) {
  const ranking = getRanking(challenge).slice(0, limit)

  return (
    <div className="glass-card rounded-xl p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-bold text-foreground">
          Top {limit} del Concurso
        </h3>
      </div>

      {/* Table header */}
      <div className="mb-2 grid grid-cols-[2rem_1fr_3rem] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>#</span>
        <span>Nombre</span>
        <span className="text-right">Leads</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-0.5">
        {ranking.map((entry) => {
          const isCurrentUser = currentMemberId === entry.member.id
          const isTopThree = entry.posicion <= 3

          return (
            <div
              key={entry.member.id}
              className={cn(
                "grid grid-cols-[2rem_1fr_3rem] items-center gap-2 rounded-lg px-2 py-2.5 transition-colors",
                isCurrentUser
                  ? "border border-emerald-500/20 bg-emerald-500/[0.08]"
                  : "hover:bg-secondary/30"
              )}
            >
              {/* Position */}
              <span className={cn(
                "text-sm font-bold",
                isTopThree ? MEDAL_COLORS[entry.posicion] : "text-muted-foreground"
              )}>
                {entry.posicion <= 3 ? (
                  <MedalIcon position={entry.posicion} />
                ) : (
                  entry.posicion
                )}
              </span>

              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  "truncate text-sm",
                  isCurrentUser ? "font-bold text-emerald-400" : "text-foreground"
                )}>
                  {entry.member.nombre}
                </span>
                {isCurrentUser && (
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Tu
                  </span>
                )}
              </div>

              {/* Value */}
              <span className={cn(
                "text-right text-sm font-bold",
                isCurrentUser ? "text-emerald-400" : "text-foreground"
              )}>
                {entry.valor}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MedalIcon({ position }: { position: number }) {
  const colors: Record<number, string> = {
    1: "#FFD700",
    2: "#C0C0C0",
    3: "#CD7F32",
  }
  const color = colors[position] ?? "#9CA3AF"

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="14" r="8" fill={color} opacity="0.2" />
      <circle cx="12" cy="14" r="6" fill={color} opacity="0.4" />
      <circle cx="12" cy="14" r="4" fill={color} />
      <path d="M12 2L14 8H10L12 2Z" fill={color} opacity="0.6" />
    </svg>
  )
}
