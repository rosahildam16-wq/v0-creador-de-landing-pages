"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getTeamMemberById, type TeamMember } from "@/lib/team-data"
import type { Challenge } from "@/lib/challenges-data"
import { DEFAULT_CHALLENGES, getRanking } from "@/lib/challenges-data"
import { ActiveChallengeCard } from "@/components/member/active-challenge-card"
import { PersonalLinkCard } from "@/components/member/personal-link-card"
import { Users, Target, TrendingUp } from "lucide-react"

// Safe storage helper
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export default function MemberDashboard() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)
  const [member, setMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    // Load challenges from storage
    const stored = safeGet("mf_challenges")
    if (stored) {
      try {
        setChallenges(JSON.parse(stored))
      } catch { /* use defaults */ }
    }
  }, [])

  useEffect(() => {
    if (user?.memberId) {
      const m = getTeamMemberById(user.memberId)
      if (m) setMember(m)
    }
  }, [user])

  if (!member || !user) return null

  const activeChallenges = challenges.filter((c) => c.activo)

  // Get member's position in each active challenge
  const getMemberPosition = (challenge: Challenge): number => {
    const ranking = getRanking(challenge)
    const entry = ranking.find((r) => r.member.id === member.id)
    return entry?.posicion ?? 0
  }

  const firstName = member.nombre.split(" ")[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground text-balance">
          {"Hola, "}{firstName}{"!"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Aqui esta tu resumen de actividad
        </p>
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="flex flex-col gap-3">
          {activeChallenges.map((challenge) => (
            <ActiveChallengeCard
              key={challenge.id}
              challenge={challenge}
              posicion={getMemberPosition(challenge)}
            />
          ))}
        </div>
      )}

      {/* Personal Link */}
      <PersonalLinkCard memberId={member.id} />

      {/* Metrics summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">{member.metricas.leads}</span>
              <span className="text-xs text-muted-foreground">Leads totales</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Target className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">{member.metricas.cerrados}</span>
              <span className="text-xs text-muted-foreground">Cerrados</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">{member.metricas.afiliados}</span>
              <span className="text-xs text-muted-foreground">Afiliados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
