"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getTeamMemberById, type TeamMember } from "@/lib/team-data"
import type { Challenge } from "@/lib/challenges-data"
import { DEFAULT_CHALLENGES, getRanking } from "@/lib/challenges-data"
import { ActiveChallengeCard } from "@/components/member/active-challenge-card"
import { PersonalLinkCard } from "@/components/member/personal-link-card"
import { ChallengeLeaderboard } from "@/components/shared/challenge-leaderboard"
import { QuickAccessGrid } from "@/components/shared/quick-access-grid"
import { Users, Target, TrendingUp, GraduationCap, Award } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

// Generate mock leads-per-day data for a member
function generateLeadsPorDia(totalLeads: number): { fecha: string; leads: number }[] {
  const data: { fecha: string; leads: number }[] = []
  const today = new Date()
  let remaining = totalLeads

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`

    // Distribute leads across the last 30 days with some randomness
    let dayLeads = 0
    if (remaining > 0 && i <= 20) {
      dayLeads = Math.min(remaining, Math.floor(Math.random() * 4))
      remaining -= dayLeads
    }
    // Dump remaining on last day
    if (i === 0 && remaining > 0) {
      dayLeads += remaining
    }

    data.push({ fecha: dayLabel, leads: dayLeads })
  }

  return data
}

export default function MemberDashboard() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)
  const [member, setMember] = useState<TeamMember | null>(null)

  useEffect(() => {
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
  const leadsPorDia = generateLeadsPorDia(member.metricas.leads)

  const getMemberPosition = (challenge: Challenge): number => {
    const ranking = getRanking(challenge)
    const entry = ranking.find((r) => r.member.id === member.id)
    return entry?.posicion ?? 0
  }

  const firstName = member.nombre.split(" ")[0]

  // Simulated training and achievements
  const trainingPercent = Math.floor(Math.random() * 40)
  const achievements = Math.floor(Math.random() * 5)

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

      {/* Main content: 2 columns on larger screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Metric cards grid - like screenshot */}
          <div className="grid grid-cols-2 gap-3">
            <MiniMetricCard
              icon={<Users className="h-5 w-5 text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              value={member.metricas.leads}
              label="Leads totales"
            />
            <MiniMetricCard
              icon={<Target className="h-5 w-5 text-red-400" />}
              iconBg="bg-red-500/10"
              value={member.metricas.cerrados}
              label="Leads calientes"
            />
            <MiniMetricCard
              icon={<GraduationCap className="h-5 w-5 text-muted-foreground" />}
              iconBg="bg-secondary/60"
              value={`${trainingPercent}%`}
              label="Entrenamiento"
            />
            <MiniMetricCard
              icon={<Award className="h-5 w-5 text-amber-400" />}
              iconBg="bg-amber-500/10"
              value={achievements}
              label="Logros obtenidos"
            />
          </div>

          {/* Quick Access */}
          <QuickAccessGrid role="member" />

          {/* Leads per day chart */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-bold text-foreground">Leads por Dia (30 dias)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadsPorDia} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="memberAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(var(--primary))"
                    fill="url(#memberAreaGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right column: Leaderboard */}
        <div className="lg:col-span-2">
          {activeChallenges.length > 0 && (
            <ChallengeLeaderboard
              challenge={activeChallenges[0]}
              currentMemberId={member.id}
              limit={10}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function MiniMetricCard({
  icon,
  iconBg,
  value,
  label,
}: {
  icon: React.ReactNode
  iconBg: string
  value: string | number
  label: string
}) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-xl p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-foreground">{value}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
