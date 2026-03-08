"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  ShieldCheck,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string
  actor_user_id: string
  actor_role: string
  action_type: string
  target_type: string | null
  target_id: string | null
  payload: Record<string, unknown> | null
  reason: string | null
  ip: string | null
  user_agent: string | null
  timestamp: string
}

// ─── Action severity colours ──────────────────────────────────────────────────

const ACTION_SEVERITY: Record<string, string> = {
  login_admin:              "text-blue-400",
  login_admin_failed:       "text-red-400 font-semibold",
  logout_admin:             "text-muted-foreground",
  view_lead:                "text-sky-400",
  view_leads_list:          "text-sky-400",
  export_leads:             "text-amber-400 font-semibold",
  impersonation_start:      "text-orange-400 font-semibold",
  impersonation_end:        "text-muted-foreground",
  freeze_account:           "text-red-400 font-semibold",
  unfreeze_account:         "text-emerald-400",
  freeze_community:         "text-red-400 font-semibold",
  unfreeze_community:       "text-emerald-400",
  change_role:              "text-purple-400 font-semibold",
  "payout.paid":            "text-emerald-400 font-semibold",
  "payout.sent":            "text-blue-400",
  "payout.failed":          "text-red-400",
  sponsor_change_attempt:   "text-red-500 font-bold",
  settings_modified:        "text-amber-400 font-semibold",
  "data.cleanup_leads":     "text-red-500 font-bold",
  user_create:              "text-emerald-400",
  user_update:              "text-sky-400",
  user_delete:              "text-red-400 font-semibold",
}

const ALL_ACTIONS = Object.keys(ACTION_SEVERITY)

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const PAGE_SIZE = 50

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditoriaPage() {
  const [logs, setLogs]   = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset]   = useState(0)

  // Filters
  const [actor,  setActor]  = useState("")
  const [action, setAction] = useState("")
  const [from,   setFrom]   = useState("")
  const [to,     setTo]     = useState("")

  // Expanded payload row
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit",  String(PAGE_SIZE))
      params.set("offset", String(newOffset))
      if (actor.trim())  params.set("actor",  actor.trim())
      if (action)        params.set("action", action)
      if (from)          params.set("from",   from)
      if (to)            params.set("to",     to + "T23:59:59")

      const res = await fetch(`/api/admin/audit?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Error al cargar auditoría")
        return
      }
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setOffset(newOffset)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [actor, action, from, to])

  useEffect(() => { load(0) }, [])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditoría</h1>
          <p className="text-sm text-muted-foreground">
            Registro inmutable de todas las acciones administrativas críticas
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Actor (user_id / email)</Label>
              <Input
                placeholder="Buscar por actor..."
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Acción</Label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Todas las acciones</option>
                {ALL_ACTIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => load(0)} className="gap-2 h-8">
              <Search className="h-3 w-3" />
              Buscar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 h-8"
              onClick={() => {
                setActor(""); setAction(""); setFrom(""); setTo("")
                setTimeout(() => load(0), 0)
              }}
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 h-8 ml-auto"
              onClick={() => load(offset)}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Eventos de auditoría
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {total.toLocaleString()} registro{total !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !logs.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No hay eventos con estos filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Timestamp</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Actor</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Rol</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Acción</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground hidden md:table-cell">Target</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground hidden lg:table-cell">Motivo</th>
                    <th className="pb-2 text-center font-medium text-muted-foreground">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-secondary/20 cursor-pointer"
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      >
                        <td className="py-2 text-muted-foreground whitespace-nowrap">
                          {fmtDate(log.timestamp)}
                        </td>
                        <td className="py-2 font-mono text-foreground max-w-[120px] truncate">
                          {log.actor_user_id}
                        </td>
                        <td className="py-2">
                          <span className="rounded-full border border-border/40 bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground">
                            {log.actor_role}
                          </span>
                        </td>
                        <td className={`py-2 ${ACTION_SEVERITY[log.action_type] ?? "text-foreground"}`}>
                          {log.action_type === "sponsor_change_attempt" && (
                            <AlertTriangle className="inline h-3 w-3 mr-1 text-red-500" />
                          )}
                          {log.action_type}
                        </td>
                        <td className="py-2 text-muted-foreground hidden md:table-cell">
                          {log.target_type && (
                            <span>
                              {log.target_type}
                              {log.target_id && (
                                <span className="font-mono text-[10px] ml-1 opacity-60">
                                  {log.target_id.slice(0, 8)}…
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground max-w-[160px] truncate hidden lg:table-cell">
                          {log.reason ?? "—"}
                        </td>
                        <td className="py-2 text-center">
                          {log.payload && (
                            <button
                              className="text-[10px] text-primary/60 hover:text-primary underline underline-offset-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpanded(expanded === log.id ? null : log.id)
                              }}
                            >
                              {expanded === log.id ? "cerrar" : "ver"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === log.id && (
                        <tr key={`${log.id}-detail`} className="bg-secondary/10">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid gap-2 sm:grid-cols-2 text-xs">
                              {log.reason && (
                                <div>
                                  <span className="text-muted-foreground">Motivo: </span>
                                  <span className="text-foreground">{log.reason}</span>
                                </div>
                              )}
                              {log.ip && (
                                <div>
                                  <span className="text-muted-foreground">IP: </span>
                                  <span className="font-mono">{log.ip}</span>
                                </div>
                              )}
                              {log.target_id && (
                                <div>
                                  <span className="text-muted-foreground">Target ID: </span>
                                  <span className="font-mono">{log.target_id}</span>
                                </div>
                              )}
                              {log.payload && (
                                <div className="sm:col-span-2">
                                  <span className="text-muted-foreground">Payload: </span>
                                  <pre className="mt-1 rounded bg-secondary/40 p-2 text-[10px] leading-relaxed overflow-x-auto">
                                    {JSON.stringify(log.payload, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3">
              <p className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages} · {total.toLocaleString()} eventos
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={offset === 0 || loading}
                  onClick={() => load(offset - PAGE_SIZE)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={offset + PAGE_SIZE >= total || loading}
                  onClick={() => load(offset + PAGE_SIZE)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance note */}
      <div className="rounded-xl border border-border/30 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Compliance:</strong> Los logs de auditoría son de solo lectura e inmutables (RLS bloqueado en Supabase). Retención mínima: 12 meses. Solo accesible por <code className="text-xs bg-secondary px-1 rounded">super_admin</code> y <code className="text-xs bg-secondary px-1 rounded">compliance_admin</code>.
      </div>
    </div>
  )
}
