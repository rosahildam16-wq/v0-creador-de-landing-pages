"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Clock,
  Download,
  FileJson,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payout {
  id: string
  user_id: string
  amount: number
  currency: string
  status: string
  notes: string | null
  created_at: string
  paid_at: string | null
}

type PayoutAction = "sent" | "paid" | "failed"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  queued: { label: "En cola",  className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  sent:   { label: "Enviado",  className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  paid:   { label: "Pagado",   className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  failed: { label: "Fallido",  className: "border-red-500/30 bg-red-500/10 text-red-400" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "border-border bg-secondary text-muted-foreground" }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminFinanzasPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    payout: Payout | null
    action: PayoutAction | null
    reason: string
    submitting: boolean
  }>({ open: false, payout: null, action: null, reason: "", submitting: false })

  // ── Load ──────────────────────────────────────────────────────────────────
  async function load(quiet = false) {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/admin/payouts")
      if (!res.ok) throw new Error("Error al cargar retiros")
      const data = await res.json()
      setPayouts(data.payouts ?? [])
    } catch {
      toast.error("Error al cargar retiros")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Update payout status ──────────────────────────────────────────────────
  function openConfirm(payout: Payout, action: PayoutAction) {
    setConfirmDialog({ open: true, payout, action, reason: "", submitting: false })
  }

  async function handleConfirm() {
    const { payout, action, reason } = confirmDialog
    if (!payout || !action) return

    // Both "paid" and "failed" require a reason (compliance)
    if ((action === "failed" || action === "paid") && !reason.trim()) {
      toast.error(action === "paid"
        ? "Debes indicar el motivo/referencia del pago (compliance)"
        : "Debes indicar el motivo del fallo"
      )
      return
    }

    setConfirmDialog((d) => ({ ...d, submitting: true }))
    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, reason: reason || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Error al actualizar retiro")
        return
      }

      const labels: Record<PayoutAction, string> = {
        sent: "Marcado como enviado",
        paid: "Marcado como pagado ✓",
        failed: "Marcado como fallido",
      }
      toast.success(labels[action])
      setConfirmDialog({ open: false, payout: null, action: null, reason: "", submitting: false })
      load(true)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setConfirmDialog((d) => ({ ...d, submitting: false }))
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalQueued = payouts.filter((p) => p.status === "queued").reduce((s, p) => s + p.amount, 0)
  const countQueued = payouts.filter((p) => p.status === "queued").length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanzas — Retiros</h1>
          <p className="text-sm text-muted-foreground">Gestión de solicitudes de retiro de comisiones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a href="/api/admin/payouts/export?format=csv&status=queued" download>
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a href="/api/admin/payouts/export?format=json&status=queued" download>
              <FileJson className="h-4 w-4" />
              Export JSON
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{countQueued}</p>
              <p className="text-xs text-muted-foreground">Retiros pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fmt(totalQueued)}</p>
              <p className="text-xs text-muted-foreground">Total en cola</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Banknote className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{payouts.length}</p>
              <p className="text-xs text-muted-foreground">Total listados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            Cola de retiros
            {countQueued > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-400">
                {countQueued}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !payouts.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/40 mb-3" />
              <p className="text-sm text-muted-foreground">No hay retiros en cola</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Los nuevos retiros aparecerán aquí</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Usuario</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Monto</th>
                    <th className="pb-3 text-center text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Solicitado</th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Notas</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {payouts.map((p) => (
                    <tr key={p.id} className="group">
                      <td className="py-3">
                        <span className="font-mono text-xs text-muted-foreground">{p.user_id}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-foreground">
                        {fmt(p.amount, p.currency)}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 text-muted-foreground text-xs hidden md:table-cell">
                        {fmtDate(p.created_at)}
                      </td>
                      <td className="py-3 text-muted-foreground text-xs hidden lg:table-cell max-w-[160px] truncate">
                        {p.notes ?? "—"}
                      </td>
                      <td className="py-3 text-right">
                        {p.status === "queued" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                              onClick={() => openConfirm(p, "sent")}
                            >
                              <Send className="h-3 w-3" />
                              Enviado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => openConfirm(p, "paid")}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Pagado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                              onClick={() => openConfirm(p, "failed")}
                            >
                              <XCircle className="h-3 w-3" />
                              Fallido
                            </Button>
                          </div>
                        )}
                        {p.status === "sent" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => openConfirm(p, "paid")}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmar pago
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                              onClick={() => openConfirm(p, "failed")}
                            >
                              <XCircle className="h-3 w-3" />
                              Fallido
                            </Button>
                          </div>
                        )}
                        {(p.status === "paid" || p.status === "failed") && (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !confirmDialog.submitting && setConfirmDialog((d) => ({ ...d, open }))
        }
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "sent"   && "Marcar como enviado"}
              {confirmDialog.action === "paid"   && "Confirmar pago"}
              {confirmDialog.action === "failed" && "Marcar como fallido"}
            </DialogTitle>
            {confirmDialog.payout && (
              <DialogDescription>
                Retiro de{" "}
                <strong>{fmt(confirmDialog.payout.amount, confirmDialog.payout.currency)}</strong>{" "}
                para usuario{" "}
                <code className="text-xs">{confirmDialog.payout.user_id}</code>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {confirmDialog.action === "failed" && (
              <div className="space-y-2">
                <Label htmlFor="fail-reason">
                  Motivo del fallo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fail-reason"
                  placeholder="Ej: Cuenta bancaria incorrecta, transferencia rechazada..."
                  value={confirmDialog.reason}
                  onChange={(e) =>
                    setConfirmDialog((d) => ({ ...d, reason: e.target.value }))
                  }
                />
                {!confirmDialog.reason.trim() && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    Obligatorio para marcar como fallido
                  </p>
                )}
              </div>
            )}

            {confirmDialog.action === "paid" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Solo SUPER_ADMIN puede confirmar pagos. Acción irreversible. Se registra en auditoría.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid-reason">
                    Referencia / motivo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="paid-reason"
                    placeholder="Ej: Transferencia Alivio #TX-1234, confirmado el 2024-01-12"
                    value={confirmDialog.reason}
                    onChange={(e) =>
                      setConfirmDialog((d) => ({ ...d, reason: e.target.value }))
                    }
                  />
                  {!confirmDialog.reason.trim() && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      Obligatorio para compliance
                    </p>
                  )}
                </div>
              </div>
            )}

            {confirmDialog.action === "sent" && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-400">
                Confirma que la transferencia fue iniciada. El usuario recibirá notificación de que está en camino.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, payout: null, action: null, reason: "", submitting: false })
              }
              disabled={confirmDialog.submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                confirmDialog.submitting ||
                ((confirmDialog.action === "failed" || confirmDialog.action === "paid") && !confirmDialog.reason.trim())
              }
              variant={confirmDialog.action === "failed" ? "destructive" : "default"}
            >
              {confirmDialog.submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
