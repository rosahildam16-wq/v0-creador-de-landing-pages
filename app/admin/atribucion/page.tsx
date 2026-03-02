"use client"

import { useEffect, useState, useMemo } from "react"
import {
    TrendingUp, TrendingDown, Users, Zap, Globe, Target,
    RefreshCw, BarChart3, Megaphone, Leaf, ArrowUpRight,
    ArrowDownRight, Activity, MapPin, Funnel, Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend
} from "recharts"

interface AttributionData {
    leads: any[]
    totalLeads: number
    pauta: number
    organico: number
    pautaPct: number
    organicoPct: number
    porDia: { fecha: string; pauta: number; organico: number; total: number }[]
    porEmbudo: { embudo: string; pauta: number; organico: number; total: number }[]
    porPais: { pais: string; total: number; pauta: number; organico: number }[]
    porFuente: { fuente: string; cantidad: number }[]
    ultimosLeads: any[]
    tendencia: "up" | "down" | "stable"
    cambio7dias: number
}

const COLORS = {
    pauta: "hsl(0, 72%, 51%)",      // Red/Meta
    organico: "hsl(145, 65%, 42%)", // Green/Organic
    primary: "hsl(270, 70%, 60%)",
}

const PIE_COLORS = ["hsl(0,72%,51%)", "hsl(145,65%,42%)", "hsl(43,74%,66%)", "hsl(197,60%,50%)", "hsl(270,70%,60%)"]

function formatPct(n: number) { return `${n.toFixed(1)}%` }
function formatDate(d: string) {
    const date = new Date(d)
    return `${date.getDate()}/${date.getMonth() + 1}`
}

export default function AtribucionPage() {
    const [data, setData] = useState<AttributionData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [period, setPeriod] = useState("30")
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const loadData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const res = await fetch(`/api/analytics/attribution?days=${period}`)
            if (res.ok) {
                const json = await res.json()
                setData(json)
                setLastUpdate(new Date())
            }
        } catch (err) {
            console.error("Error loading attribution:", err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => { loadData() }, [period])
    useEffect(() => {
        const interval = setInterval(() => loadData(true), 60 * 1000) // Refresh every 60s
        return () => clearInterval(interval)
    }, [period])

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Activity className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">Analizando atribución de tráfico...</p>
                </div>
            </div>
        )
    }

    if (!data) return null

    const pautaLeads = data.ultimosLeads?.filter(l => l.trafico === "Pauta" || l.fuente === "Meta Ads")
    const organicoLeads = data.ultimosLeads?.filter(l => l.trafico !== "Pauta" && l.fuente !== "Meta Ads")

    return (
        <div className="flex flex-col gap-6">

            {/* ── Header ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white">Atribución de Tráfico</h1>
                            <p className="text-xs text-zinc-500">Orgánico vs Pauta · Tiempo real desde tus leads</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {lastUpdate && (
                        <span className="text-xs text-zinc-600 flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {lastUpdate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="h-9 w-[130px] bg-zinc-900 border-zinc-800 text-xs font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white text-xs">
                            <SelectItem value="7">Últimos 7 días</SelectItem>
                            <SelectItem value="15">Últimos 15 días</SelectItem>
                            <SelectItem value="30">Últimos 30 días</SelectItem>
                            <SelectItem value="60">Últimos 60 días</SelectItem>
                            <SelectItem value="90">Últimos 90 días</SelectItem>
                        </SelectContent>
                    </Select>
                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* ── Hero Stats ── */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

                {/* Total Leads */}
                <Card className="border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm col-span-2 lg:col-span-1">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Leads</span>
                        </div>
                        <p className="text-4xl font-black italic text-white">{data.totalLeads}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                            {data.tendencia === "up" ? (
                                <><TrendingUp className="h-3 w-3 text-emerald-400" /><span className="text-xs text-emerald-400">+{data.cambio7dias}% vs sem. anterior</span></>
                            ) : data.tendencia === "down" ? (
                                <><TrendingDown className="h-3 w-3 text-red-400" /><span className="text-xs text-red-400">{data.cambio7dias}% vs sem. anterior</span></>
                            ) : (
                                <span className="text-xs text-zinc-500">Sin cambio vs sem. anterior</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pauta */}
                <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                                    <Megaphone className="h-4 w-4 text-red-400" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Pauta</span>
                            </div>
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-black">
                                {formatPct(data.pautaPct)}
                            </Badge>
                        </div>
                        <p className="text-4xl font-black italic text-white">{data.pauta}</p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${data.pautaPct}%` }} />
                        </div>
                    </CardContent>
                </Card>

                {/* Orgánico */}
                <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                                    <Leaf className="h-4 w-4 text-emerald-400" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Orgánico</span>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black">
                                {formatPct(data.organicoPct)}
                            </Badge>
                        </div>
                        <p className="text-4xl font-black italic text-white">{data.organico}</p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all" style={{ width: `${data.organicoPct}%` }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid gap-5 lg:grid-cols-12">

                {/* Evolución diaria */}
                <Card className="border-zinc-800/60 bg-zinc-900/30 lg:col-span-8">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
                            <BarChart3 className="h-4 w-4 text-zinc-500" />
                            Evolución diaria — Pauta vs Orgánico
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.porDia} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gpPauta" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.pauta} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={COLORS.pauta} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gpOrganico" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.organico} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={COLORS.organico} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,14%)" />
                                    <XAxis dataKey="fecha" tick={{ fill: "hsl(0,0%,40%)", fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(data.porDia.length / 7)} />
                                    <YAxis tick={{ fill: "hsl(0,0%,40%)", fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,16%)", borderRadius: "10px", fontSize: "12px", color: "white" }}
                                        formatter={(val: number, name: string) => [val, name === "pauta" ? "📢 Pauta" : "🌱 Orgánico"]}
                                        labelFormatter={(l) => `📅 ${l}`}
                                    />
                                    <Area type="monotone" dataKey="pauta" stroke={COLORS.pauta} strokeWidth={2} fill="url(#gpPauta)" />
                                    <Area type="monotone" dataKey="organico" stroke={COLORS.organico} strokeWidth={2} fill="url(#gpOrganico)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-5 mt-1">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-5 rounded-full" style={{ background: COLORS.pauta }} />
                                <span className="text-[10px] text-zinc-500 font-medium">PAUTA</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-5 rounded-full" style={{ background: COLORS.organico }} />
                                <span className="text-[10px] text-zinc-500 font-medium">ORGÁNICO</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie — Fuentes */}
                <Card className="border-zinc-800/60 bg-zinc-900/30 lg:col-span-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-white">Fuentes de tráfico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[190px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.porFuente}
                                        cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={75}
                                        paddingAngle={3}
                                        dataKey="cantidad"
                                    >
                                        {data.porFuente.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,16%)", borderRadius: "10px", fontSize: "11px", color: "white" }}
                                        formatter={(val: number, _: string, entry: any) => [val, entry.payload.fuente]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-1">
                            {data.porFuente.map((f, i) => (
                                <div key={f.fuente} className="flex items-center gap-2">
                                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-[11px] text-zinc-400 flex-1 truncate">{f.fuente}</span>
                                    <span className="text-[11px] font-bold text-white">{f.cantidad}</span>
                                    <span className="text-[10px] text-zinc-600">({formatPct(data.totalLeads > 0 ? (f.cantidad / data.totalLeads) * 100 : 0)})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Embudo + País ── */}
            <div className="grid gap-5 lg:grid-cols-2">

                {/* Por Embudo */}
                <Card className="border-zinc-800/60 bg-zinc-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
                            <Target className="h-4 w-4 text-zinc-500" />
                            Leads por Embudo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.porEmbudo} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,14%)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "hsl(0,0%,40%)", fontSize: 9 }} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="embudo" tick={{ fill: "hsl(0,0%,50%)", fontSize: 9 }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "hsl(0,0%,7%)", border: "1px solid hsl(0,0%,16%)", borderRadius: "10px", fontSize: "11px", color: "white" }}
                                        formatter={(val: number, name: string) => [val, name === "pauta" ? "📢 Pauta" : "🌱 Orgánico"]}
                                    />
                                    <Bar dataKey="pauta" stackId="a" fill={COLORS.pauta} radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="organico" stackId="a" fill={COLORS.organico} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Por País - Top 7 */}
                <Card className="border-zinc-800/60 bg-zinc-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
                            <Globe className="h-4 w-4 text-zinc-500" />
                            Top Países
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2.5">
                            {data.porPais.slice(0, 7).map((p, i) => {
                                const pct = data.totalLeads > 0 ? (p.total / data.totalLeads) * 100 : 0
                                return (
                                    <div key={p.pais} className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-zinc-600 w-4">{i + 1}</span>
                                        <div className="flex items-center gap-1.5 w-24 shrink-0">
                                            <MapPin className="h-3 w-3 text-zinc-600 shrink-0" />
                                            <span className="text-[11px] text-zinc-300 font-medium truncate">{p.pais || "Desconocido"}</span>
                                        </div>
                                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-bold text-white w-8 text-right">{p.total}</span>
                                        <div className="flex gap-1 w-16">
                                            <span className="text-[9px] text-red-400">{p.pauta}p</span>
                                            <span className="text-[9px] text-zinc-600">·</span>
                                            <span className="text-[9px] text-emerald-400">{p.organico}o</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Últimos leads en tiempo real ── */}
            <Card className="border-zinc-800/60 bg-zinc-900/30">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Leads en tiempo real
                        </div>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">
                            Últimos 20
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-1">
                        {data.ultimosLeads?.slice(0, 10).map((lead) => {
                            const isPauta = lead.trafico === "Pauta" || lead.fuente === "Meta Ads"
                            return (
                                <div key={lead.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-zinc-800/40 transition-colors group">
                                    {/* Traffic badge */}
                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isPauta ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                                        {isPauta
                                            ? <Megaphone className="h-3.5 w-3.5 text-red-400" />
                                            : <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                                        }
                                    </div>
                                    {/* Name & email */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-zinc-200 truncate">{lead.nombre}</p>
                                        <p className="text-[10px] text-zinc-600 truncate">{lead.email}</p>
                                    </div>
                                    {/* Source */}
                                    <Badge variant="outline" className={`shrink-0 text-[9px] font-black h-5 ${isPauta ? "border-red-500/20 text-red-400" : "border-emerald-500/20 text-emerald-400"}`}>
                                        {isPauta ? "PAUTA" : "ORGÁNICO"}
                                    </Badge>
                                    {/* Embudo */}
                                    <span className="text-[10px] text-zinc-600 hidden md:block shrink-0 truncate max-w-[100px]">{lead.embudo_id || "—"}</span>
                                    {/* País */}
                                    <span className="text-[10px] text-zinc-500 hidden lg:block shrink-0 w-16 truncate">{lead.pais || "—"}</span>
                                    {/* Time */}
                                    <div className="flex items-center gap-1 text-zinc-600 shrink-0">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-[10px]">
                                            {new Date(lead.fecha_ingreso).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        {(!data.ultimosLeads || data.ultimosLeads.length === 0) && (
                            <p className="text-center text-zinc-600 text-xs py-8">No hay leads en el período seleccionado</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
