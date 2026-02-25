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
    precio: 27,
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
    precio: 47,
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
    precio: 97,
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

export function PricingCards() {
  const router = useRouter()
  const { user } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId)
    try {
      const res = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user?.email || "demo@magicfunnel.com",
          userRole: user?.role || "admin",
          planId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al crear la factura")
      }

      if (data.demo) {
        // NOWPayments not configured - redirect to status page
        router.push(data.invoiceUrl)
      } else {
        // Redirect to NOWPayments checkout
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
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const tier = PLAN_TIERS[plan.id as keyof typeof PLAN_TIERS]
          const isPopular = tier.popular
          const Icon = plan.icon

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
                    <span className="text-4xl font-bold text-white">${plan.precio}</span>
                    <span className="text-sm text-violet-300/40"> USDT/mes</span>
                  </div>
                  <p className="mt-2 text-xs text-violet-300/30">{tier.badge}</p>
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
                  ) : (
                    "Comenzar prueba gratis (5 d\u00EDas)"
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
