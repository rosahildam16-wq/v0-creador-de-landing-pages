"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMemberData, type TeamMember } from "@/lib/team-data"
import type { Challenge } from "@/lib/challenges-data"
import { DEFAULT_CHALLENGES, getRanking } from "@/lib/challenges-data"
import { PersonalLinkCard } from "@/components/member/personal-link-card"
import { getMemberCommunity } from "@/lib/communities-data"
import { ChallengeLeaderboard } from "@/components/shared/challenge-leaderboard"
import Link from "next/link"
import {
  Users, Target, GraduationCap, Award, TrendingUp,
  Route, Trophy, Kanban, Bot, Calendar, Flame, Zap,
  ArrowUpRight, ChevronRight, Shield,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts"
import useSWR from "swr"
import type { Lead } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) ?? sessionStorage.getItem(key) } catch { return null }
}

function generateLeadsPorDia(totalLeads: number, seed: number): { fecha: string; leads: number }[] {
  const data: { fecha: string; leads: number }[] = []
  const today = new Date()
  let remaining = totalLeads
  // Simple seeded pseudo-random to avoid hydration mismatch
  let s = seed
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s & 0x7fffffff) / 2147483647 }
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`
    let dayLeads = 0
    if (remaining > 0 && i <= 20) {
      dayLeads = Math.min(remaining, Math.floor(rand() * 4))
      remaining -= dayLeads
    }
    if (i === 0 && remaining > 0) dayLeads += remaining
    data.push({ fecha: dayLabel, leads: dayLeads })
  }
  return data
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Buenos dias"
  if (h < 18) return "Buenas tardes"
  return "Buenas noches"
}

// Animated count-up hook (SSR safe)
function useCountUp(end: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current || typeof window === "undefined") return
    startedRef.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * end))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [end, duration])

  return value
}

// SVG progress ring
function ProgressRing({ value, max, size = 72, strokeWidth = 5, color = "hsl(var(--primary))" }: {
  value: number; max: number; size?: number; strokeWidth?: number; color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(value / max, 1)
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const t = setTimeout(() => setOffset(circumference * (1 - pct)), 100)
    return () => clearTimeout(t)
  }, [circumference, pct])

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="hsl(var(--border))" strokeWidth={strokeWidth} opacity={0.4} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-[1.5s] ease-out" />
    </svg>
  )
}

// Animated metric card
function MetricCard({ icon, iconGradient, value, label, suffix, delay = 0, href }: {
  icon: React.ReactNode; iconGradient: string; value: number;
  label: string; suffix?: string; delay?: number; href?: string
}) {
  const animated = useCountUp(value)

  const cardContent = (
    <>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: iconGradient }} />
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconGradient }}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {animated}{suffix}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    </>
  )

  const cls = "group relative overflow-hidden rounded-2xl border border-border/30 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.15)]"

  if (href) {
    return (
      <Link href={href} className={cls} style={{ animationDelay: `${delay}ms` }}>
        {cardContent}
      </Link>
    )
  }

  return (
    <div className={cls} style={{ animationDelay: `${delay}ms` }}>
      {cardContent}
    </div>
  )
}

// Quick access card with distinct style
function QuickCard({ icon: Icon, label, desc, href, delay = 0, accent }: {
  icon: React.ComponentType<{ className?: string }>; label: string;
  desc: string; href: string; delay?: number; accent: string
}) {
  return (
    <Link href={href}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/30 bg-card/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card/70"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: accent }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="truncate text-[11px] text-muted-foreground">{desc}</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  )
}

export default function MemberDashboard() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)
  const [member, setMember] = useState<TeamMember | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const stored = safeGet("mf_challenges")
    if (stored) { try { setChallenges(JSON.parse(stored)) } catch { /* defaults */ } }
  }, [])

  const { data: leads, isLoading: leadsLoading } = useSWR<Lead[]>(
    user?.email ? `/api/member/leads?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  useEffect(() => {
    if (user) {
      setMember(getMemberData(user))
    }
  }, [user])

  const getMemberPosition = useCallback((challenge: Challenge): number => {
    if (!member || !member.id) return 0
    const ranking = getRanking(challenge)
    const entry = ranking.find((r) => r.member.id === member.id)
    return entry?.posicion ?? 0
  }, [member])

  if (!member || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const activeChallenges = challenges.filter((c) => c.activo)

  // Safely calculate lead metrics
  const leadsArray = Array.isArray(leads) ? leads : []
  const totalLeads = leadsArray.length
  const hotLeads = leadsArray.filter(l => l.etapa === 'cerrado' || l.etapa === 'presentado').length

  const leadsPorDia = generateLeadsPorDia(totalLeads, 42)
  const firstName = member.nombre.split(" ")[0]
  const memberCommunity = user?.memberId ? getMemberCommunity(user.memberId) : undefined
  const trainingPercent = 37
  const achievements = 3
  const streak = 12

  return (
    <div className={`flex flex-col gap-8 transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>

      {/* === HERO GREETING === */}
      <div className="relative overflow-hidden rounded-3xl border border-border/20 bg-gradient-to-br from-card/80 via-card/60 to-primary/[0.04] p-8">
        {/* Decorative accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "hsl(var(--primary))" }} />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "hsl(var(--accent))" }} />

        <div className="relative flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
              {firstName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground text-balance">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu centro de comando personal
              </p>
            </div>
          </div>

          {/* Streak & quick status */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {memberCommunity && (
              <div
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5"
                style={{
                  borderColor: `${memberCommunity.color}33`,
                  backgroundColor: `${memberCommunity.color}0A`,
                }}
              >
                <Shield className="h-3.5 w-3.5" style={{ color: memberCommunity.color }} />
                <span className="text-xs font-semibold" style={{ color: memberCommunity.color }}>
                  {memberCommunity.nombre}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">{streak} dias de racha</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">+{member.metricas.leads > 3 ? 3 : member.metricas.leads} leads esta semana</span>
            </div>
            {activeChallenges.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Puesto #{getMemberPosition(activeChallenges[0])} en el reto</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === BENTO METRICS GRID === */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5 text-white" />}
          iconGradient="linear-gradient(135deg, #10b981, #059669)"
          value={totalLeads}
          label="Leads totales"
          delay={0}
          href="/member/mis-leads"
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-white" />}
          iconGradient="linear-gradient(135deg, #ef4444, #dc2626)"
          value={hotLeads}
          label="Leads calientes"
          delay={80}
          href="/member/pipeline"
        />
        <MetricCard
          icon={<Award className="h-5 w-5 text-white" />}
          iconGradient="linear-gradient(135deg, #f59e0b, #d97706)"
          value={achievements}
          label="Logros obtenidos"
          delay={160}
          href="/member/retos"
        />
        <MetricCard
          icon={<Zap className="h-5 w-5 text-white" />}
          iconGradient="linear-gradient(135deg, hsl(260 70% 58%), hsl(280 65% 55%))"
          value={streak}
          suffix=" dias"
          label="Racha activa"
          delay={240}
        />
      </div>

      {/* === MAIN CONTENT: 3 cols === */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* LEFT: Chart + Link + Quick Access */}
        <div className="flex flex-col gap-6 lg:col-span-8">

          {/* Training progress + Chart side by side */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Training ring card */}
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm">
              <div className="relative">
                <ProgressRing value={trainingPercent} max={100} size={90} strokeWidth={6} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{trainingPercent}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Entrenamiento</p>
                <p className="text-[11px] text-muted-foreground">3 de 8 modulos</p>
              </div>
              <Link href="/member/academia"
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                Continuar <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Leads chart */}
            <div className="rounded-2xl border border-border/30 bg-card/50 p-5 backdrop-blur-sm md:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Actividad de leads</h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">Ultimos 30 dias</span>
              </div>
              <div className="h-[180px]">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={leadsPorDia} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                      <defs>
                        <linearGradient id="memberGradV2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="fecha" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false} axisLine={false} interval={4} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px", fontSize: "11px",
                          color: "hsl(var(--foreground))", boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        }}
                      />
                      <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))"
                        fill="url(#memberGradV2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal link */}
          <PersonalLinkCard memberId={member.id} />

          {/* Quick Access */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground">Accesos rapidos</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <QuickCard icon={Calendar} label="Mi Agenda" desc="Proximas tareas pendientes"
                href="/member" delay={0} accent="linear-gradient(135deg, #6366f1, #4f46e5)" />
              <QuickCard icon={GraduationCap} label="Entrenamiento" desc="Continua donde te quedaste"
                href="/member/academia" delay={60} accent="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
              <QuickCard icon={Users} label="Mis Leads" desc="Gestiona tus contactos"
                href="/member/mis-leads" delay={120} accent="linear-gradient(135deg, #10b981, #059669)" />
              <QuickCard icon={Bot} label="Asistente IA" desc="Consulta y genera contenido"
                href="/member" delay={180} accent="linear-gradient(135deg, #f59e0b, #d97706)" />
            </div>
          </div>
        </div>

        {/* RIGHT: Leaderboard + Active Challenge */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Active challenge card redesigned */}
          {activeChallenges.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.04] to-transparent p-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/[0.08] blur-2xl" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{activeChallenges[0].titulo}</h3>
                    <p className="text-[11px] text-muted-foreground">Reto activo</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center rounded-xl bg-card/60 px-4 py-2.5">
                    <span className="text-lg font-bold text-emerald-400">#{getMemberPosition(activeChallenges[0])}</span>
                    <span className="text-[10px] text-muted-foreground">Tu puesto</span>
                  </div>
                  <div className="flex flex-col items-center rounded-xl bg-card/60 px-4 py-2.5">
                    <span className="text-lg font-bold text-foreground">{activeChallenges[0].premios[0]?.monto ? `$${activeChallenges[0].premios[0].monto}` : "---"}</span>
                    <span className="text-[10px] text-muted-foreground">1er premio</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
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
