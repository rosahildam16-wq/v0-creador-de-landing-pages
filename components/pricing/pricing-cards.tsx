"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PLAN_TIERS } from "@/lib/subscription-types"
import { Check, Zap, Crown, Rocket, Loader2 } from "lucide-react"

const PLANS = [
  {
    id: "basico",
    nombre: "Basico",
    precioMensual: 27,
    icon: Rocket,
    features: [
      "Dashboard personal",
      "Seguimiento de leads (hasta 50)",
      "1 embudo",
      "Academia basica",
      "Soporte por email",
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    precioMensual: 47,
    icon: Zap,
    features: [
      "Todo lo del plan Basico",
      "Leads ilimitados",
      "3 embudos",
      "Pipeline CRM completo",
      "Analytics avanzado",
      "Integraciones (WhatsApp)",
      "Retos y gamificacion",
    ],
  },
  {
    id: "elite",
    nombre: "Elite",
    precioMensual: 97,
    icon: Crown,
    features: [
      "Todo lo del plan Pro",
      "Equipo ilimitado (miembros incluidos)",
      "Meta Ads dashboard",
      "Workflows automatizados",
      "Academia completa",
      "Soporte prioritario",
      "White-label (logo personalizado)",
    ],
  },
]

const ANNUAL_DISCOUNT = 0.20 // 20% off

export function PricingCards() {
  const router = useRouter()
  const { user } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [isAnnual, setIsAnnual] = useState(false)

  const handleSelectPlan = async (planId: string) => {
    const finalPlanId = isAnnual ? `${planId}-anual` : planId
    setLoadingPlan(planId)
    try {
      const res = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user?.email || "demo@magicfunnel.com",
          userRole: user?.role || "admin",
          planId: finalPlanId,
          billingPeriod: isAnnual ? "anual" : "mensual",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la factura")
      }

      if (data.demo) {
        router.push(data.invoiceUrl)
      } else {
        window.location.href = data.invoiceUrl
      }
    } catch (err) {
      console.error("Error:", err)
      alert(err instanceof Error ? err.message : "Error al procesar el pago")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-white" : "text-violet-300/40"}`}>
          Mensual
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative h-8 w-[52px] rounded-full transition-all duration-300 ${isAnnual
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
              : "bg-white/[0.08] border border-white/[0.1]"
            }`}
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isAnnual ? "translate-x-5" : "translate-x-0"
              }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-white" : "text-violet-300/40"}`}>
          Anual
        </span>
        {isAnnual && (
          <span className="ml-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-xs font-bold text-emerald-400 animate-in fade-in slide-in-from-left-2 duration-300">
            -20% OFF
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const tier = PLAN_TIERS[plan.id as keyof typeof PLAN_TIERS]
          const isPopular = tier.popular
          const Icon = plan.icon

          const monthlyPrice = plan.precioMensual
          const annualTotal = Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT) * 100) / 100
          const annualMonthly = Math.round((annualTotal / 12) * 100) / 100
          const displayPrice = isAnnual ? annualMonthly : monthlyPrice
          const savings = Math.round(monthlyPrice * 12 - annualTotal)

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] ${isPopular
                ? "border-violet-500/30 bg-violet-500/[0.05] shadow-[0_0_60px_-15px_rgba(139,92,246,0.2)]"
                : "border-white/[0.06] bg-white/[0.02]"
                }`}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                    <Zap className="w-3 h-3" />
                    {tier.badge}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex flex-1 flex-col p-8">
                {/* Header */}
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.nombre}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 2)}</span>
                    <span className="text-sm text-violet-300/40"> USDT/mes</span>
                  </div>
                  {isAnnual ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-emerald-400 font-medium">
                        ${annualTotal.toFixed(2)} USDT/año — Ahorras ${savings} USDT
                      </p>
                      <p className="text-xs text-violet-300/30 line-through">
                        ${monthlyPrice * 12} USDT/año sin descuento
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-violet-300/30">{tier.badge}</p>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tier.color}`}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-violet-200/60">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`relative w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 ${isPopular
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]"
                    : "border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
                    }`}
                >
                  {loadingPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </span>
                  ) : user ? (
                    isAnnual ? "Suscribirse anual" : "Suscribirse ahora"
                  ) : (
                    "Comenzar ahora"
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
