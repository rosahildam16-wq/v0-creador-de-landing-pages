"use client"

import { useState, useEffect, useCallback } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts"
import {
  DollarSign, Users, Target, MousePointerClick, Eye, TrendingUp,
  Signal, Repeat2, RefreshCw, AlertCircle, Loader2, ArrowRight,
  ChevronUp, ChevronDown, Zap, BarChart2, Globe2, FlaskConical,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Campaign {
  id: string
  campaign_id: string
  nombre: string
  adset_nombre: string
  gasto: number
  impresiones: number
  clics: number
  alcance: number
  frecuencia: number
  leads: number
  cpl: number
  cpc: number
  cpm: number
  ctr: number
  fecha_inicio: string
  fecha_fin: string
}

interface DailyPoint { fecha: string; gasto: number; impresiones: number; clics: number; leads: number }
interface AgeGroup   { grupo: string; leads: number; pct: number }
interface GenderGroup { genero: string; leads: number; pct: number }
interface PixelEvent { evento: string; total: number }

interface MetaAdsData {
  resumen: {
    gasto_total: number; leads_totales: number; cpl_promedio: number
    clics_totales: number; impresiones_totales: number; ctr_promedio: number
    cpc_promedio: number; cpm_promedio: number; alcance_total: number; frecuencia_promedio: number
  }
  campanas: Campaign[]
  diario: DailyPoint[]
  demograficos?: { edad: AgeGroup[]; genero: GenderGroup[] }
  pixel_eventos?: PixelEvent[]
}

type SortKey = keyof Campaign
type SortDir = "asc" | "desc"

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_OPTIONS = [
  { label: "7 días",  value: "7"  },
  { label: "15 días", value: "15" },
  { label: "30 días", value: "30" },
  { label: "90 días", value: "90" },
]

const PIXEL_EVENT_COLORS: Record<string, string> = {
  PageView: "#6366f1", Lead: "#d946ef", ViewContent: "#8b5cf6",
  CompleteRegistration: "#10b981", Contact: "#f59e0b", Schedule: "#3b82f6",
}

const GENDER_COLORS = ["#6366f1", "#d946ef"]
const AGE_COLOR     = "#8b5cf6"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const fmtMoney = (n: number) =>
  "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (iso: string) => {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon, label, value, sub, color = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  color?: "primary" | "fuchsia" | "violet" | "emerald" | "amber" | "sky" | "rose"
}) {
  const colorMap = {
    primary:  { bg: "bg-primary/10",   icon: "text-primary",  border: "border-primary/20"  },
    fuchsia:  { bg: "bg-fuchsia-500/10", icon: "text-fuchsia-400", border: "border-fuchsia-500/20" },
    violet:   { bg: "bg-violet-500/10",  icon: "text-violet-400",  border: "border-violet-500/20"  },
    emerald:  { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
    amber:    { bg: "bg-amber-500/10",   icon: "text-amber-400",   border: "border-amber-500/20"   },
    sky:      { bg: "bg-sky-500/10",     icon: "text-sky-400",     border: "border-sky-500/20"     },
    rose:     { bg: "bg-rose-500/10",    icon: "text-rose-400",    border: "border-rose-500/20"    },
  }
  const c = colorMap[color]

  return (
    <div className={`rounded-2xl border ${c.border} bg-card/60 p-4 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-4 w-4 ${c.icon}`} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-[10px] text-muted-foreground/60">{sub}</p>}
    </div>
  )
}

function SortButton({
  col, active, dir, onClick,
}: { col: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors">
      {col}
      {active
        ? dir === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
        : <ChevronDown className="h-3 w-3 opacity-30" />
      }
    </button>
  )
}

// Custom area chart tooltip
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/40 bg-card/95 p-3 text-xs shadow-xl backdrop-blur-sm">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">
            {p.name.includes("Inversión") ? fmtMoney(p.value) : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

interface MetaAdsDashboardProps {
  memberId: string
}

export function MetaAdsDashboard({ memberId }: MetaAdsDashboardProps) {
  const [days, setDays]       = useState("30")
  const [data, setData]       = useState<MetaAdsData | null>(null)
  const [mode, setMode]       = useState<"live" | "demo" | "error" | "loading">("loading")
  const [error, setError]     = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("gasto")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [activeChart, setActiveChart] = useState<"leads" | "gasto">("leads")

  const load = useCallback(async () => {
    setMode("loading")
    try {
      const res  = await fetch(`/api/meta-ads?memberId=${memberId}&days=${days}`)
      const json = await res.json()
      if (json.data) {
        setData(json.data)
        setMode(json.mode === "live" ? "live" : "demo")
        setError(json.message || "")
      } else {
        setMode("error")
        setError(json.message || "Error al cargar")
      }
    } catch {
      setMode("error")
      setError("Error de conexión con la API")
    }
  }, [memberId, days])

  useEffect(() => { load() }, [load])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const sortedCampanas = data ? [...data.campanas].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    const mult = sortDir === "asc" ? 1 : -1
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * mult
    return String(av).localeCompare(String(bv)) * mult
  }) : []

  // Conversion funnel derived from data
  const funnel = data ? [
    { label: "Impresiones",       value: data.resumen.impresiones_totales, icon: Eye,            color: "text-slate-400" },
    { label: "Clicks en enlace",  value: data.resumen.clics_totales,       icon: MousePointerClick, color: "text-violet-400" },
    { label: "Leads generados",   value: data.resumen.leads_totales,       icon: Users,          color: "text-fuchsia-400" },
    { label: "Est. Diagnósticos", value: Math.round(data.resumen.leads_totales * 0.60), icon: FlaskConical, color: "text-emerald-400" },
    { label: "Est. Citas agend.", value: Math.round(data.resumen.leads_totales * 0.22), icon: Target,       color: "text-amber-400" },
  ] : []

  if (mode === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando datos de Meta Ads...</p>
      </div>
    )
  }

  if (mode === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">{error || "Error al cargar datos"}</p>
        <button onClick={load} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      </div>
    )
  }

  if (!data) return null

  const { resumen, diario, demograficos, pixel_eventos } = data

  return (
    <div className="space-y-6">

      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {mode === "demo" && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <Signal className="h-3 w-3" />
              MODO DEMO — Datos de ejemplo
            </span>
          )}
          {mode === "live" && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              EN VIVO — Meta Ads
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Date range filter */}
          <div className="flex rounded-xl border border-border/40 overflow-hidden">
            {DATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── 1. Metric cards (8) ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard icon={DollarSign}      label="Inversión total"  value={fmtMoney(resumen.gasto_total)}          color="primary"  />
        <MetricCard icon={Users}           label="Leads generados"  value={resumen.leads_totales.toLocaleString()}  color="fuchsia"  />
        <MetricCard icon={Target}          label="Costo por Lead"   value={fmtMoney(resumen.cpl_promedio)}          color="violet"   sub="CPL promedio" />
        <MetricCard icon={TrendingUp}      label="CTR"              value={`${fmt(resumen.ctr_promedio, 2)}%`}      color="emerald"  sub="Click-through rate" />
        <MetricCard icon={MousePointerClick} label="CPC promedio"   value={fmtMoney(resumen.cpc_promedio)}          color="sky"      sub="Costo por click" />
        <MetricCard icon={Eye}             label="CPM promedio"     value={fmtMoney(resumen.cpm_promedio)}          color="amber"    sub="Costo por mil impresiones" />
        <MetricCard icon={BarChart2}       label="Clicks en enlace" value={resumen.clics_totales.toLocaleString()}  color="rose"     />
        <MetricCard icon={Repeat2}         label="Frecuencia"       value={fmt(resumen.frecuencia_promedio, 2)}     color="primary"  sub="Veces que vio el anuncio" />
      </div>

      {/* ── 2. Performance chart ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground">Rendimiento diario</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Evolución en los últimos {days} días</p>
          </div>
          <div className="flex rounded-xl border border-border/40 overflow-hidden">
            <button
              onClick={() => setActiveChart("leads")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeChart === "leads" ? "bg-fuchsia-600 text-white" : "text-muted-foreground hover:bg-secondary/50"}`}
            >
              Leads
            </button>
            <button
              onClick={() => setActiveChart("gasto")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeChart === "gasto" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
            >
              Inversión
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={diario} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#d946ef" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d946ef" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="fecha"
              tickFormatter={fmtDate}
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(diario.length / 7)}
            />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            {activeChart === "leads" ? (
              <Area
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="#d946ef"
                strokeWidth={2}
                fill="url(#gradLeads)"
                dot={false}
                activeDot={{ r: 4, fill: "#d946ef" }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="gasto"
                name="Inversión $"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gradGasto)"
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 3. Campaigns table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
          <div>
            <h3 className="font-semibold text-foreground">Conjuntos de anuncios</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{data.campanas.length} conjuntos activos</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/20 text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Campaña / Conjunto</th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton col="leads"  active={sortKey === "leads"}  dir={sortDir} onClick={() => handleSort("leads")} />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton col="cpl"    active={sortKey === "cpl"}    dir={sortDir} onClick={() => handleSort("cpl")} />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton col="clics"  active={sortKey === "clics"}  dir={sortDir} onClick={() => handleSort("clics")} />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton col="ctr"    active={sortKey === "ctr"}    dir={sortDir} onClick={() => handleSort("ctr")} />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton col="cpc"    active={sortKey === "cpc"}    dir={sortDir} onClick={() => handleSort("cpc")} />
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <SortButton col="gasto"  active={sortKey === "gasto"}  dir={sortDir} onClick={() => handleSort("gasto")} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCampanas.map((c, i) => (
                <tr key={c.id} className={`border-b border-border/10 hover:bg-secondary/20 transition-colors ${i === 0 ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs leading-snug">{c.nombre}</p>
                    {c.adset_nombre && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.adset_nombre}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-fuchsia-400">{c.leads}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${c.cpl <= resumen.cpl_promedio ? "text-emerald-400" : "text-rose-400"}`}>
                      {fmtMoney(c.cpl)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">{c.clics.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmt(c.ctr, 2)}%</td>
                  <td className="px-4 py-3 text-right text-foreground">{fmtMoney(c.cpc)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{fmtMoney(c.gasto)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/30 bg-secondary/20">
                <td className="px-4 py-3 text-xs font-bold text-muted-foreground">TOTAL</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-fuchsia-400">{resumen.leads_totales}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-foreground">{fmtMoney(resumen.cpl_promedio)}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-foreground">{resumen.clics_totales.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-foreground">{fmt(resumen.ctr_promedio, 2)}%</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-foreground">{fmtMoney(resumen.cpc_promedio)}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-foreground">{fmtMoney(resumen.gasto_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── 4. Funnel + 5. Demographics ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Conversion funnel */}
        <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
          <h3 className="font-semibold text-foreground mb-1">Embudo de conversión</h3>
          <p className="text-xs text-muted-foreground mb-5">
            Flujo de usuarios: anuncio → lead → cliente
          </p>
          <div className="space-y-1.5">
            {funnel.map((step, i) => {
              const prev    = i > 0 ? funnel[i - 1].value : step.value
              const ratio   = pct(step.value, prev)
              const barW    = Math.max(15, pct(step.value, funnel[0].value))
              const isEst   = step.label.startsWith("Est.")
              return (
                <div key={step.label}>
                  <div className="flex items-center gap-3 mb-1">
                    <step.icon className={`h-3.5 w-3.5 shrink-0 ${step.color}`} />
                    <span className="text-xs text-muted-foreground flex-1">
                      {step.label}
                      {isEst && <span className="ml-1 text-[9px] text-muted-foreground/50">(estimado)</span>}
                    </span>
                    <span className="text-sm font-bold text-foreground">{step.value.toLocaleString()}</span>
                    {i > 0 && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        ratio >= 30 ? "bg-emerald-500/10 text-emerald-400"
                          : ratio >= 10 ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {ratio}%
                      </span>
                    )}
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barW}%`,
                        background: isEst
                          ? "linear-gradient(90deg, #64748b, #475569)"
                          : "linear-gradient(90deg, #6366f1, #d946ef)",
                      }}
                    />
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="flex items-center gap-2 mt-1.5 mb-0.5 ml-5">
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                      <span className="text-[9px] text-muted-foreground/40">
                        Conversión: {pct(funnel[i + 1].value, step.value)}%
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Demographics */}
        {demograficos && (
          <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
            <h3 className="font-semibold text-foreground mb-1">Demografía de audiencia</h3>
            <p className="text-xs text-muted-foreground mb-5">Distribución de leads por segmento</p>

            {/* Gender donut-style */}
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Género</p>
              <div className="flex gap-3 mb-2">
                {demograficos.genero.map((g, i) => (
                  <div key={g.genero} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GENDER_COLORS[i] }} />
                    <span className="text-xs text-muted-foreground">{g.genero}</span>
                    <span className="text-xs font-bold text-foreground">{g.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="h-3 w-full rounded-full overflow-hidden flex">
                {demograficos.genero.map((g, i) => (
                  <div key={g.genero} style={{ width: `${g.pct}%`, background: GENDER_COLORS[i] }} className="transition-all duration-700" />
                ))}
              </div>
            </div>

            {/* Age bars */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Edad</p>
              <div className="space-y-2.5">
                {demograficos.edad.map((a) => (
                  <div key={a.grupo} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">{a.grupo}</span>
                    <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${a.pct}%`, background: AGE_COLOR }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-10 text-right">{a.pct}%</span>
                    <span className="text-[10px] text-muted-foreground w-14 text-right">{a.leads} leads</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. Pixel Events ────────────────────────────────────────────────── */}
      {pixel_eventos && pixel_eventos.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold text-foreground">Eventos del Pixel</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {pixel_eventos.map((ev) => {
              const color = PIXEL_EVENT_COLORS[ev.evento] || "#6366f1"
              const maxVal = Math.max(...pixel_eventos.map((e) => e.total))
              const barH   = Math.max(20, Math.round((ev.total / maxVal) * 80))
              return (
                <div key={ev.evento} className="flex flex-col items-center gap-2 rounded-xl border border-border/30 bg-secondary/20 p-3">
                  <div className="flex items-end justify-center h-16 w-full">
                    <div
                      className="w-8 rounded-t-md transition-all duration-700"
                      style={{ height: `${barH}%`, background: `${color}40`, border: `1px solid ${color}60` }}
                    />
                  </div>
                  <p className="text-lg font-bold text-foreground">{ev.total.toLocaleString()}</p>
                  <p className="text-[10px] text-center text-muted-foreground leading-tight">{ev.evento}</p>
                  <div className="h-1 w-full rounded-full" style={{ background: color }} />
                </div>
              )
            })}
          </div>
          {mode === "demo" && (
            <p className="mt-3 text-[10px] text-muted-foreground/60 text-center">
              * Eventos estimados en modo demo. Conecta tu pixel para ver datos reales.
            </p>
          )}
        </div>
      )}

    </div>
  )
}
