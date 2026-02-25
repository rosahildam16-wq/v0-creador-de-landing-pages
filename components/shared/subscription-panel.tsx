"use client"

import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { Crown, Clock, CreditCard, ArrowRight, CheckCircle2, AlertTriangle, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { PLAN_TIERS } from "@/lib/subscription-types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatDate(d: string | null | undefined) {
  if (!d) return "N/A"
  return new Date(d).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function daysUntil(d: string | null | undefined) {
  if (!d) return 0
  const diff = new Date(d).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function SubscriptionPanel() {
  const { user } = useAuth()

  const { data, isLoading } = useSWR(
    user?.email ? `/api/payments/check-subscription?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const sub = data?.subscription
  const hasAccess = data?.hasAccess
  const reason = data?.reason

  // No subscription
  if (!sub) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border/30 bg-card/50 p-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Sin suscripcion activa</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Elige un plan para acceder a todas las funcionalidades de Magic Funnel.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]"
          >
            Ver planes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const planId = sub.plan_id as keyof typeof PLAN_TIERS
  const tier = PLAN_TIERS[planId]
  const isTrial = sub.status === "trial"
  const isActive = sub.status === "active"
  const isExpired = reason === "trial_expired" || reason === "subscription_expired"
  const trialDays = daysUntil(sub.trial_ends_at)
  const periodDays = daysUntil(sub.current_period_end)

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="relative overflow-hidden rounded-xl border border-border/30 bg-card/50">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tier?.color || "from-primary to-accent"}`} />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tier?.color || "from-primary to-accent"}`}>
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Plan {sub.plan?.nombre || sub.plan_id}
                </h3>
                <p className="text-sm text-muted-foreground">
                  ${sub.plan?.precio_usdt || "?"} USDT/mes
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isTrial
                ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                : isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {isTrial && <Clock className="w-3 h-3" />}
              {isActive && <CheckCircle2 className="w-3 h-3" />}
              {isExpired && <AlertTriangle className="w-3 h-3" />}
              {isTrial ? "Prueba gratuita" : isActive ? "Activa" : "Vencida"}
            </div>
          </div>

          {/* Period info */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {isTrial && (
              <>
                <div className="rounded-lg border border-border/20 bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Inicio de prueba</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(sub.trial_starts_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/20 bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Fin de prueba</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(sub.trial_ends_at)}
                    {trialDays > 0 && (
                      <span className="ml-2 text-xs text-violet-400">({trialDays} dias restantes)</span>
                    )}
                  </p>
                </div>
              </>
            )}
            {isActive && (
              <>
                <div className="rounded-lg border border-border/20 bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Periodo actual</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(sub.current_period_start)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/20 bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Proxima renovacion</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDate(sub.current_period_end)}
                    {periodDays > 0 && (
                      <span className="ml-2 text-xs text-emerald-400">({periodDays} dias restantes)</span>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Features */}
          {sub.plan?.features && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Incluye
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(sub.plan.features as string[]).map((f: string) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="border-t border-border/20 bg-secondary/20 px-6 py-4">
          <div className="flex items-center justify-between">
            {(isTrial || isExpired) && !isActive ? (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)]"
              >
                {isTrial ? "Activar plan" : "Renovar suscripcion"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cambiar de plan
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Payment history */}
      {data?.payments && data.payments.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-card/50 p-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">Historial de pagos</h4>
          <div className="space-y-3">
            {data.payments.map((p: { id: string; amount_usdt: number; status: string; created_at: string; network: string | null }) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/20 bg-secondary/20 p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${
                    p.status === "finished" ? "bg-emerald-400" : p.status === "waiting" ? "bg-amber-400" : "bg-red-400"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      ${p.amount_usdt} USDT
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.created_at)} {p.network && `- ${p.network}`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  p.status === "finished"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : p.status === "waiting"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                }`}>
                  {p.status === "finished" ? "Completado" : p.status === "waiting" ? "Esperando" : p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
