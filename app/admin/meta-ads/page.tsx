"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Wifi,
  WifiOff,
  Target,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface Resumen {
  gasto_total: number
  leads_totales: number
  cpl_promedio: number
  clics_totales: number
  impresiones_totales: number
  ctr_promedio: number
}

interface Campana {
  id: string
  nombre: string
  gasto: number
  impresiones: number
  clics: number
  leads: number
  cpl: number
  cpc: number
  cpm: number
  ctr: number
  fecha_inicio: string
  fecha_fin: string
}

interface DatosDiarios {
  fecha: string
  gasto: number
  impresiones: number
  clics: number
  leads: number
}

interface MetaAdsData {
  resumen: Resumen
  campanas: Campana[]
  diario: DatosDiarios[]
}

interface ApiResponse {
  mode: "live" | "demo" | "error"
  message: string
  data: MetaAdsData
}

const CAMPAIGN_COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(145, 65%, 42%)",
  "hsl(43, 74%, 66%)",
  "hsl(197, 60%, 50%)",
  "hsl(27, 87%, 67%)",
]

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function MetaAdsPage() {
  const [data, setData] = useState<MetaAdsData | null>(null)
  const [mode, setMode] = useState<"live" | "demo" | "error">("demo")
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showConfig, setShowConfig] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/meta-ads?date_preset=last_30d")
      const json: ApiResponse = await res.json()
      setData(json.data)
      setMode(json.mode)
      setLastRefresh(new Date())
    } catch {
      setMode("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Conectando con Meta Ads...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Compute CPL per day for the chart
  const cplDiario = data.diario.map((d) => ({
    ...d,
    cpl: d.leads > 0 ? Math.round((d.gasto / d.leads) * 100) / 100 : 0,
    fechaLabel: formatDate(d.fecha),
  }))

  // Pie chart data for spend by campaign
  const gastoPorCampana = data.campanas.map((c, i) => ({
    nombre: c.nombre.replace("Nomada VIP - ", ""),
    gasto: c.gasto,
    fill: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length],
  }))

  // Best & worst CPL campaigns
  const sortedByCpl = [...data.campanas].filter((c) => c.leads > 0).sort((a, b) => a.cpl - b.cpl)
  const bestCampaign = sortedByCpl[0]
  const worstCampaign = sortedByCpl[sortedByCpl.length - 1]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Meta Ads</h1>
            <Badge
              variant="outline"
              className={
                mode === "live"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : mode === "demo"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
              }
            >
              {mode === "live" ? (
                <><Wifi className="mr-1 h-3 w-3" /> En vivo</>
              ) : mode === "demo" ? (
                <><WifiOff className="mr-1 h-3 w-3" /> Demo</>
              ) : (
                <><WifiOff className="mr-1 h-3 w-3" /> Error</>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === "demo"
              ? "Conecta tus credenciales de Meta para ver datos reales"
              : "Costo por lead y rendimiento de campanas en tiempo real"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Actualizado: {lastRefresh.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" />
            Configurar
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <Card className="border-primary/30 bg-card/80 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Configuración de Integración</h3>
                <p className="text-sm text-muted-foreground">Ingresa tus credenciales para conectar este dashboard con la cuenta real.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ad Account ID</label>
                  <input
                    type="text"
                    placeholder="act_XXXXXXXXX"
                    className="w-full rounded-lg border border-border/50 bg-secondary/50 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                    defaultValue={process.env.NEXT_PUBLIC_META_AD_ACCOUNT_ID || ""}
                    id="config-account-id"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Token</label>
                  <input
                    type="password"
                    placeholder="EAAB..."
                    className="w-full rounded-lg border border-border/50 bg-secondary/50 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                    id="config-token"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={async () => {
                    const accId = (document.getElementById("config-account-id") as HTMLInputElement).value
                    const token = (document.getElementById("config-token") as HTMLInputElement).value
                    if (!accId || !token) {
                      alert("Por favor completa ambos campos")
                      return
                    }
                    try {
                      // Step 1: Ensure the table exists
                      await fetch("/api/meta-ads/setup", { method: "POST" })

                      // Step 2: Wait a moment for schema refresh
                      await new Promise(r => setTimeout(r, 1500))

                      // Step 3: Save the config
                      const res = await fetch("/api/meta/insights", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ memberId: "super-admin", adAccountId: accId, accessToken: token }),
                      })
                      const result = await res.json()
                      if (res.ok && result.success) {
                        alert("✅ Configuración guardada correctamente. Recargando datos...")
                        fetchData()
                        setShowConfig(false)
                      } else {
                        alert(`❌ Error al guardar: ${result.error || "Error desconocido"}`)
                      }
                    } catch (e: any) {
                      alert(`❌ Error de conexión: ${e.message || "No se pudo conectar con el servidor"}`)
                    }
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
                >
                  Guardar y Sincronizar
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Obtener Token en Meta <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Gasto Total</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatMoney(data.resumen.gasto_total)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">Leads</span>
            </div>
            <p className="mt-2 text-xl font-bold">{data.resumen.leads_totales}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">CPL Promedio</span>
            </div>
            <p className="mt-2 text-xl font-bold text-primary">{formatMoney(data.resumen.cpl_promedio)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <MousePointerClick className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground">Clics</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatNumber(data.resumen.clics_totales)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                <Eye className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-xs text-muted-foreground">Impresiones</span>
            </div>
            <p className="mt-2 text-xl font-bold">{formatNumber(data.resumen.impresiones_totales)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">CTR</span>
            </div>
            <p className="mt-2 text-xl font-bold">{data.resumen.ctr_promedio}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Best / Worst CPL quick insight */}
      {bestCampaign && worstCampaign && bestCampaign.id !== worstCampaign.id && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowDownRight className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-emerald-400">Mejor CPL</p>
                <p className="truncate text-sm font-semibold text-foreground">{bestCampaign.nombre.replace("Nomada VIP - ", "")}</p>
                <p className="text-lg font-bold text-emerald-400">{formatMoney(bestCampaign.cpl)} <span className="text-xs font-normal text-muted-foreground">por lead</span></p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <ArrowUpRight className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-red-400">Peor CPL</p>
                <p className="truncate text-sm font-semibold text-foreground">{worstCampaign.nombre.replace("Nomada VIP - ", "")}</p>
                <p className="text-lg font-bold text-red-400">{formatMoney(worstCampaign.cpl)} <span className="text-xs font-normal text-muted-foreground">por lead</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* CPL Over Time */}
        <Card className="border-border/50 lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Costo por Lead - Tendencia diaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cplDiario}>
                  <defs>
                    <linearGradient id="cplGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                  <XAxis
                    dataKey="fechaLabel"
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 7%)",
                      border: "1px solid hsl(0, 0%, 16%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "hsl(0, 0%, 93%)",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "cpl") return [`$${value.toFixed(2)}`, "CPL"]
                      if (name === "gasto") return [`$${value.toFixed(2)}`, "Gasto"]
                      if (name === "leads") return [value, "Leads"]
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Dia: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpl"
                    stroke="hsl(0, 72%, 51%)"
                    strokeWidth={2}
                    fill="url(#cplGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(145, 65%, 42%)"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-5 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">CPL ($)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-px w-5 border-t-2 border-dashed border-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Leads</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spend by Campaign Pie */}
        <Card className="border-border/50 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gasto por Campana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gastoPorCampana}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="gasto"
                  >
                    {gastoPorCampana.map((entry, i) => (
                      <Cell key={entry.nombre} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 7%)",
                      border: "1px solid hsl(0, 0%, 16%)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "hsl(0, 0%, 93%)",
                    }}
                    formatter={(value: number) => [formatMoney(value), "Gasto"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5">
              {gastoPorCampana.map((c, i) => (
                <div key={c.nombre} className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.fill }} />
                  <span className="min-w-0 truncate text-[10px] text-muted-foreground">{c.nombre}</span>
                  <span className="ml-auto shrink-0 text-[10px] font-medium">{formatMoney(c.gasto)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Spend + Leads Bar Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Gasto diario vs Leads generados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cplDiario}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis
                  dataKey="fechaLabel"
                  tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  yAxisId="gasto"
                  orientation="left"
                  tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  yAxisId="leads"
                  orientation="right"
                  tick={{ fill: "hsl(0, 0%, 55%)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 7%)",
                    border: "1px solid hsl(0, 0%, 16%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(0, 0%, 93%)",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "gasto") return [formatMoney(value), "Gasto"]
                    return [value, "Leads"]
                  }}
                />
                <Bar yAxisId="gasto" dataKey="gasto" fill="hsl(0, 72%, 51%)" radius={[2, 2, 0, 0]} opacity={0.7} />
                <Bar yAxisId="leads" dataKey="leads" fill="hsl(145, 65%, 42%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detalle por Campana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs">Campana</TableHead>
                  <TableHead className="text-right text-xs">Gasto</TableHead>
                  <TableHead className="text-right text-xs">Leads</TableHead>
                  <TableHead className="text-right text-xs">CPL</TableHead>
                  <TableHead className="text-right text-xs">Clics</TableHead>
                  <TableHead className="text-right text-xs">CPC</TableHead>
                  <TableHead className="text-right text-xs">CTR</TableHead>
                  <TableHead className="text-right text-xs">Impresiones</TableHead>
                  <TableHead className="text-right text-xs">Rendimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.campanas.map((campana, i) => {
                  const avgCpl = data.resumen.cpl_promedio
                  const isGoodCpl = campana.cpl <= avgCpl
                  return (
                    <TableRow key={campana.id} className="border-border/30 hover:bg-secondary/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length] }}
                          />
                          <span className="max-w-[200px] truncate text-sm font-medium">
                            {campana.nombre.replace("Nomada VIP - ", "")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatMoney(campana.gasto)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{campana.leads}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-bold ${isGoodCpl ? "text-emerald-400" : "text-red-400"}`}>
                          {formatMoney(campana.cpl)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatNumber(campana.clics)}</TableCell>
                      <TableCell className="text-right text-sm">{formatMoney(campana.cpc)}</TableCell>
                      <TableCell className="text-right text-sm">{campana.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right text-sm">{formatNumber(campana.impresiones)}</TableCell>
                      <TableCell className="text-right">
                        {isGoodCpl ? (
                          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400" variant="outline">
                            <TrendingDown className="mr-1 h-3 w-3" />
                            Bueno
                          </Badge>
                        ) : (
                          <Badge className="border-red-500/30 bg-red-500/10 text-red-400" variant="outline">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Costoso
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
