"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowDownToLine,
  History,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

interface Commission {
  id: string
  payer_user_id: string
  platform_plan_code: string
  sponsor_level1_user_id: string | null
  sponsor_level2_user_id: string | null
  level1_amount: number
  level2_amount: number
  currency: string
  period_start: string
  status: string
  created_at: string
}

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  notes: string | null
  created_at: string
  paid_at: string | null
}

interface CommissionsData {
  history: Commission[]
  payable: Commission[]
  monthlyUsage: { level1: number; level2: number }
  platformPlanCode: string | null
}

interface PayoutsData {
  payouts: Payout[]
  summary: {
    payableBalance: number
    pendingPayoutTotal: number
    lifetimePaid: number
    minimumPayout: number
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  queued:  { label: "En cola",    className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  sent:    { label: "Enviado",    className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  paid:    { label: "Pagado",     className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  failed:  { label: "Fallido",    className: "border-red-500/30 bg-red-500/10 text-red-400" },
  pending: { label: "Pendiente",  className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  payable: { label: "Disponible", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  paid_c:  { label: "Pagado",     className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  held:    { label: "Retenido",   className: "border-orange-500/30 bg-orange-500/10 text-orange-400" },
  void:    { label: "Anulado",    className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400" },
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
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComisionesPage() {
  const { user } = useAuth()

  const [commissionsData, setCommissionsData] = useState<CommissionsData | null>(null)
  const [payoutsData, setPayoutsData] = useState<PayoutsData | null>(null)
  const [loading, setLoading] = useState(true)

  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────────
  async function load() {
    setLoading(true)
    try {
      const [commRes, payRes] = await Promise.all([
        fetch("/api/commissions"),
        fetch("/api/payouts"),
      ])

      if (commRes.ok) setCommissionsData(await commRes.json())
      if (payRes.ok) setPayoutsData(await payRes.json())
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Request payout ─────────────────────────────────────────────────────────
  async function handleRequestPayout() {
    const amount = parseFloat(payoutAmount)
    const min = payoutsData?.summary.minimumPayout ?? 50

    if (isNaN(amount) || amount < min) {
      toast.error(`El monto mínimo es ${fmt(min)}`)
      return
    }

    setPayoutSubmitting(true)
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Error al solicitar retiro")
        return
      }

      toast.success("¡Retiro solicitado! Se procesará el próximo viernes.")
      setPayoutDialogOpen(false)
      setPayoutAmount("")
      load()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setPayoutSubmitting(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const summary = payoutsData?.summary
  const available = summary ? summary.payableBalance - summary.pendingPayoutTotal : 0
  const monthlyTotal = commissionsData
    ? commissionsData.monthlyUsage.level1 + commissionsData.monthlyUsage.level2
    : 0

  // My userId for determining which level amount to show
  const myId = user?.memberId as string | undefined

  function myCommissionAmount(c: Commission) {
    let total = 0
    if (c.sponsor_level1_user_id === myId) total += c.level1_amount
    if (c.sponsor_level2_user_id === myId) total += c.level2_amount
    return total
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comisiones y Retiros</h1>
            <p className="text-sm text-muted-foreground">Tus ganancias por referidos y historial de pagos</p>
          </div>
        </div>
        <Button
          onClick={() => setPayoutDialogOpen(true)}
          disabled={available < (summary?.minimumPayout ?? 50)}
          className="gap-2"
        >
          <ArrowDownToLine className="h-4 w-4" />
          Solicitar retiro
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fmt(available)}</p>
              <p className="text-xs text-muted-foreground">Disponible para retiro</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fmt(monthlyTotal)}</p>
              <p className="text-xs text-muted-foreground">Ganado este mes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fmt(summary?.pendingPayoutTotal ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Retiros en proceso</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fmt(summary?.lifetimePaid ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Total pagado (histórico)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      {commissionsData && (commissionsData.monthlyUsage.level1 > 0 || commissionsData.monthlyUsage.level2 > 0) && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Desglose este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/30 bg-secondary/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">Nivel 1 (referidos directos)</p>
                <p className="text-xl font-bold text-foreground">{fmt(commissionsData.monthlyUsage.level1)}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-secondary/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">Nivel 2 (referidos de tus referidos)</p>
                <p className="text-xl font-bold text-foreground">{fmt(commissionsData.monthlyUsage.level2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout history */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Historial de retiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!payoutsData?.payouts.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ArrowDownToLine className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Aún no has solicitado ningún retiro</p>
              <p className="text-xs text-muted-foreground/60 mt-1">El mínimo para retirar es {fmt(summary?.minimumPayout ?? 50)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Fecha</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Monto</th>
                    <th className="pb-2 text-center text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Pagado el</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {payoutsData.payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 text-foreground">{fmtDate(p.created_at)}</td>
                      <td className="py-3 text-right font-semibold text-foreground">{fmt(p.amount, p.currency)}</td>
                      <td className="py-3 text-center"><StatusBadge status={p.status} /></td>
                      <td className="py-3 text-muted-foreground hidden sm:table-cell">
                        {p.paid_at ? fmtDate(p.paid_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission history */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Historial de comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!commissionsData?.history.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Aún no tienes comisiones registradas</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Las comisiones se generan cuando tus referidos pagan su plan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Fecha</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Plan</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Comisión</th>
                    <th className="pb-2 text-center text-xs font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {commissionsData.history.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 text-foreground">{fmtDate(c.created_at)}</td>
                      <td className="py-3 text-muted-foreground capitalize hidden sm:table-cell">
                        {c.platform_plan_code.replace("plan_", "$")}
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-500">
                        +{fmt(myCommissionAmount(c), c.currency)}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge status={c.status === "paid" ? "paid_c" : c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-border/30 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary/60" />
        <p>
          Los retiros se procesan cada viernes. El monto mínimo es <strong className="text-foreground">{fmt(summary?.minimumPayout ?? 50)}</strong>.
          Las comisiones pasan a "Disponible" 7 días después del pago para verificación antifraude.
          Ganas el <strong className="text-foreground">20%</strong> por referidos directos (N1) y otro <strong className="text-foreground">20%</strong> por referidos de tus referidos (N2).
        </p>
      </div>

      {/* Request payout dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Solicitar retiro</DialogTitle>
            <DialogDescription>
              Saldo disponible: <strong>{fmt(available)}</strong>. Mínimo: {fmt(summary?.minimumPayout ?? 50)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payout-amount">Monto (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payout-amount"
                  type="number"
                  min={summary?.minimumPayout ?? 50}
                  max={available}
                  step="0.01"
                  placeholder="50.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
              {parseFloat(payoutAmount) > available && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Excede tu saldo disponible
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border/30 bg-secondary/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>• Procesado el próximo viernes</p>
              <p>• Recibirás confirmación por email</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={
                payoutSubmitting ||
                !payoutAmount ||
                parseFloat(payoutAmount) < (summary?.minimumPayout ?? 50) ||
                parseFloat(payoutAmount) > available
              }
            >
              {payoutSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Solicitando...</>
              ) : (
                "Confirmar retiro"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
