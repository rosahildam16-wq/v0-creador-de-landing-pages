"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EmbudoGHLConfig } from "@/lib/embudos-config"
import {
  Plug,
  CheckCircle2,
  XCircle,
  History,
  RotateCcw,
  RefreshCw,
  Loader2,
  Activity,
} from "lucide-react"

interface GHLLog {
  id: string
  timestamp: string
  embudoId: string
  embudoNombre?: string
  leadEmail: string
  leadNombre: string
  method: "api" | "webhook"
  action: string
  status: "success" | "error" | "rejected"
  httpCode: number | null
  contactId: string | null
  attempt: number
  maxAttempts: number
  elapsed: string
  tag: string
}

interface Props {
  embudoId: string
  embudoNombre: string
  ghlConfig?: EmbudoGHLConfig
}

export function EmbudoGHLBlock({ embudoId, embudoNombre, ghlConfig }: Props) {
  const [logs, setLogs] = useState<GHLLog[]>([])
  const [stats, setStats] = useState({ total: 0, success: 0, errors: 0, rejected: 0 })
  const [loading, setLoading] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ghl-logs?embudoId=${embudoId}&limit=15`)
      const data = await res.json()
      setLogs(data.logs || [])
      setStats(data.stats || { total: 0, success: 0, errors: 0, rejected: 0 })
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [embudoId])

  useEffect(() => { loadLogs() }, [loadLogs])

  const retryLog = async (logId: string) => {
    setRetryingId(logId)
    try {
      await fetch("/api/admin/ghl-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      })
      await loadLogs()
    } catch { /* ignore */ }
    finally { setRetryingId(null) }
  }

  const isEnabled = ghlConfig?.enabled ?? false
  const tag = ghlConfig?.tag || `mf_${embudoId.replace(/-/g, "_")}`

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Plug className="h-4 w-4 text-primary" />
            GoHighLevel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] ${
                isEnabled
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {isEnabled ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" /> Activo</>
              ) : (
                <><XCircle className="mr-1 h-3 w-3" /> Inactivo</>
              )}
            </Badge>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Config summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Tag:</span>
            <code className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{tag}</code>
          </div>
          {ghlConfig?.pipelineStageId && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Pipeline:</span>
              <code className="rounded bg-card px-1.5 py-0.5 text-[10px] font-mono text-foreground">{ghlConfig.pipelineStageId}</code>
            </div>
          )}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-emerald-400">{stats.success} OK</span>
            <span className="text-destructive">{stats.errors} Error</span>
          </div>
        </div>

        {/* Logs mini-table */}
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Activity className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Sin registros para este embudo.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            <div className="grid grid-cols-[1fr_70px_70px_50px_50px] items-center gap-2 border-b border-border/50 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Lead</span>
              <span>Metodo</span>
              <span>Estado</span>
              <span>HTTP</span>
              <span></span>
            </div>
            {logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1fr_70px_70px_50px_50px] items-center gap-2 border-b border-border/30 py-2 text-xs last:border-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">{log.leadNombre || log.leadEmail}</span>
                  <span className="text-[9px] text-muted-foreground/50">
                    {new Date(log.timestamp).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`w-fit text-[9px] ${log.method === "api" ? "border-blue-500/30 text-blue-400" : "border-emerald-500/30 text-emerald-400"}`}
                >
                  {log.method === "api" ? "API" : "WH"}
                </Badge>
                <Badge
                  variant="outline"
                  className={`w-fit text-[9px] ${
                    log.status === "success"
                      ? "border-emerald-500/30 text-emerald-400"
                      : log.status === "rejected"
                        ? "border-amber-500/30 text-amber-400"
                        : "border-destructive/30 text-destructive"
                  }`}
                >
                  {log.action}
                </Badge>
                <code className={`text-[10px] ${
                  log.httpCode && log.httpCode >= 200 && log.httpCode < 300
                    ? "text-emerald-400" : log.httpCode ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {log.httpCode || "-"}
                </code>
                <div>
                  {log.status === "error" && (
                    <button
                      onClick={() => retryLog(log.id)}
                      disabled={retryingId === log.id}
                      className="flex h-5 w-5 items-center justify-center rounded border border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                      title="Reintentar"
                    >
                      {retryingId === log.id ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-2.5 w-2.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
