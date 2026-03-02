"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Users,
  Target,
  MousePointerClick,
  Eye,
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Wifi,
  WifiOff,
  Settings,
  ChevronRight,
  Calendar,
  Loader2,
  Activity,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

// Mock colors
const COLORS = ["#008F11", "#00B215", "#10B981", "#34D399", "#6EE7B7"]
const CAMPAIGN_COLORS = ["#008F11", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("es-MX").format(num)
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

export default function MetaAdsPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [mode, setMode] = useState<"live" | "demo" | "error">("demo")
  const [showConfig, setShowConfig] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/meta/insights")
      const result = await res.json()
      if (res.ok) {
        setData(result.data)
        setMode(result.mode)
        setLastRefresh(new Date())
      } else {
        setMode("error")
      }
    } catch (e) {
      setMode("error")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-black border border-primary/40 shadow-[0_0_30px_rgba(0,143,17,0.3)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Sincronizando con Meta</p>
          <p className="text-xs text-muted-foreground mt-1">Obteniendo métricas de tus campañas...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Compute CPL per day for the chart
  const cplDiario = data.diario.map((d: any) => ({
    ...d,
    cpl: d.leads > 0 ? Math.round((d.gasto / d.leads) * 100) / 100 : 0,
    fechaLabel: formatDate(d.fecha),
  }))

  const gastoPorCampana = data.campanas.map((c: any, i: number) => ({
    nombre: c.nombre.replace("Nomada VIP - ", ""),
    gasto: c.gasto,
    fill: CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length],
  }))

  const sortedByCpl = [...data.campanas].filter((c) => c.leads > 0).sort((a, b) => a.cpl - b.cpl)
  const bestCampaign = sortedByCpl[0]
  const worstCampaign = sortedByCpl[sortedByCpl.length - 1]

  return (
    <div className="flex flex-col gap-6 font-sans">
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

      {/* Config panel - Sin la opción de Pixel, ahora es per-embudo */}
      {showConfig && (
        <Card className="border-primary/30 bg-card/80 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Configuración de Integración</h3>
                <p className="text-sm text-muted-foreground">Ingresa tus credenciales de Meta Ads API para sincronizar tus campañas.</p>
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
                  <p className="text-[10px] text-muted-foreground/60">Identificador de tu cuenta publicitaria</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Token</label>
                  <input
                    type="password"
                    placeholder="EAAB..."
                    className="w-full rounded-lg border border-border/50 bg-secondary/50 px-4 py-2 text-sm focus:border-primary focus:outline-none"
                    id="config-token"
                  />
                  <p className="text-[10px] text-muted-foreground/60">System User Access Token con ads_read</p>
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
                      await fetch("/api/meta-ads/setup", { method: "POST" })
                      await new Promise(r => setTimeout(r, 1000))
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
                      alert(`❌ Error de conexión: ${e.message}`)
                    }
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:opacity-90 transition-opacity"
                >
                  Guardar y Sincronizar
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <p className="text-[10px] text-muted-foreground italic">El Meta Pixel ahora se configura individualmente dentro de cada embudo.</p>
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Obtener Token en Meta Explorer <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
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
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Mejor Rendimiento (CPL)</p>
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
                <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Peor Rendimiento (CPL)</p>
                <p className="truncate text-sm font-semibold text-foreground">{worstCampaign.nombre.replace("Nomada VIP - ", "")}</p>
                <p className="text-lg font-bold text-red-400">{formatMoney(worstCampaign.cpl)} <span className="text-xs font-normal text-muted-foreground">por lead</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 flex flex-col min-h-[400px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Historial de Costo por Lead (MXN)</CardTitle>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">CPL Promedio</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-2">
            <div className="h-full min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cplDiario}>
                  <defs>
                    <linearGradient id="colorCpl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#008F11" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#008F11" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="fechaLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                    itemStyle={{ color: "#008F11" }}
                  />
                  <Area type="monotone" dataKey="cpl" name="CPL" stroke="#008F11" strokeWidth={2} fillOpacity={1} fill="url(#colorCpl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 flex flex-col min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribución de Gasto por Campaña</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-full min-h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gastoPorCampana} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="gasto" nameKey="nombre">
                    {gastoPorCampana.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px" }}
                    formatter={(val: number) => formatMoney(val)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 ml-4">
                {gastoPorCampana.slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.fill }} />
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{c.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Campaigns Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Desempeño Detallado por Campaña</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Campaña</th>
                  <th className="px-4 py-3 font-medium text-right">Gasto</th>
                  <th className="px-4 py-3 font-medium text-right">Leads</th>
                  <th className="px-4 py-3 font-medium text-right text-primary">CPL</th>
                  <th className="px-4 py-3 font-medium text-right">Clics</th>
                  <th className="px-4 py-3 font-medium text-right">CTR</th>
                  <th className="px-4 py-3 font-medium text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.campanas.map((campana: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground line-clamp-1">{campana.nombre.replace("Nomada VIP - ", "")}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{campana.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">{formatMoney(campana.gasto)}</td>
                    <td className="px-4 py-4 text-right font-bold">{campana.leads}</td>
                    <td className="px-4 py-4 text-right font-black text-primary">{formatMoney(campana.cpl)}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{formatNumber(campana.clics)}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground">{campana.ctr}%</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${campana.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/30'}`} />
                        <span className="text-[10px] font-bold uppercase">{campana.status === 'ACTIVE' ? 'Activo' : 'Pausado'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes scan { from { transform: translateY(-100%); } to { transform: translateY(100%); } }
        .scan-line { animation: scan 3s linear infinite; box-shadow: 0 0 15px #008f11; }
      `}</style>
    </div>
  )
}
