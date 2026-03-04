"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import {
  Check, Loader2, ArrowRight, Sparkles, Zap, Crown,
  Users, Globe, BarChart3, Shield, Star,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanData {
  code: string
  name: string
  trial_days: number
  effective_monthly: number
  effective_annual: number
  global_monthly: number
  has_community_override: boolean
  limits: {
    funnels_max: number
    communities_max: number
    contacts_max: number
    commission_cap_monthly: number | null
    tools: string[]
  }
}

interface CommunityData {
  id: string
  nombre: string
  slug: string
  color: string
  trial_days: number
}

// ─── Plan metadata ─────────────────────────────────────────────────────────────

const PLAN_META: Record<string, {
  icon: React.ElementType
  color: string
  highlight: boolean
  features: string[]
}> = {
  plan_27: {
    icon: Star,
    color: "#8b5cf6",
    highlight: false,
    features: [
      "Acceso a la comunidad",
      "Academia y recursos",
      "CRM básico (500 contactos)",
      "Comisiones de afiliado",
    ],
  },
  plan_47: {
    icon: Zap,
    color: "#7c3aed",
    highlight: true,
    features: [
      "Todo lo de Member",
      "Hasta 3 embudos propios",
      "Hasta 3 comunidades",
      "CRM ilimitado",
      "Integraciones + Booking",
      "Comisiones hasta $1,500/mes",
    ],
  },
  plan_97: {
    icon: Crown,
    color: "#6d28d9",
    highlight: false,
    features: [
      "Todo lo de Creator",
      "Embudos y comunidades ilimitados",
      "Meta Ads + Workflows",
      "Gestión de equipos",
      "Comisiones hasta $10,000/mes",
    ],
  },
  plan_300: {
    icon: Globe,
    color: "#5b21b6",
    highlight: false,
    features: [
      "Todo lo de Elite",
      "White-label completo",
      "Comisiones ilimitadas",
      "Soporte prioritario",
    ],
  },
}

function formatLimit(v: number) {
  return v === -1 ? "Ilimitado" : v === 0 ? "—" : String(v)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JoinPlansPage() {
  const router = useRouter()
  const params = useParams()
  const communitySlug = params.community_slug as string

  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly")
  const [community, setCommunity] = useState<CommunityData | null>(null)
  const [plans, setPlans] = useState<PlanData[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState("")
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    if (!communitySlug) return
    fetch(`/api/join/${communitySlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setDataError(data.error)
        else {
          setCommunity(data.community)
          setPlans(data.plans)
        }
      })
      .catch(() => setDataError("No se pudo cargar los planes"))
      .finally(() => setDataLoading(false))
  }, [communitySlug])

  const selectPlan = async (planCode: string) => {
    setSelecting(planCode)
    try {
      const res = await fetch("/api/platform/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, billingInterval }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("select-plan error:", data.error)
        // Still redirect — user is registered, plan can be set later
      }
      router.push("/member")
    } catch {
      router.push("/member")
    }
  }

  const skipForNow = () => router.push("/member")

  // ── Render ─────────────────────────────────────────────────────────────────

  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#050012" }}>
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4" style={{ background: "#050012" }}>
        <p className="text-red-400 text-sm">{dataError}</p>
        <button onClick={skipForNow} className="text-violet-400 text-xs underline">Continuar sin plan</button>
      </div>
    )
  }

  const annualSavingsPct = 20

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#050012" }}>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, #7c3aed22 0%, transparent 70%)",
      }} />

      <div className="relative z-10 flex flex-col items-center px-4 py-12">
        {/* Header */}
        <div className="mb-2">
          <MagicFunnelLogo size="md" animated />
        </div>

        <div className="text-center mt-8 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/[0.06] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 tracking-widest uppercase">
              {community?.nombre ?? "Magic Funnel"}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Elige tu plan
          </h1>
          <p className="text-violet-200/40 text-base">
            Empieza con un período de prueba. Cancela cuando quieras.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 mt-8 mb-10">
          <span className={`text-sm font-medium transition-colors ${billingInterval === "monthly" ? "text-white" : "text-white/30"}`}>
            Mensual
          </span>
          <button
            onClick={() => setBillingInterval((b) => b === "monthly" ? "annual" : "monthly")}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${billingInterval === "annual" ? "bg-violet-600" : "bg-white/10"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${billingInterval === "annual" ? "translate-x-7" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${billingInterval === "annual" ? "text-white" : "text-white/30"}`}>
            Anual
          </span>
          {billingInterval === "annual" && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              -{annualSavingsPct}% descuento
            </span>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.code] ?? {
              icon: Star,
              color: "#7c3aed",
              highlight: false,
              features: [],
            }
            const Icon = meta.icon
            const price = billingInterval === "annual"
              ? plan.effective_annual
              : plan.effective_monthly
            const perMonth = billingInterval === "annual"
              ? Math.round(price / 12 * 100) / 100
              : price

            return (
              <div
                key={plan.code}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  meta.highlight
                    ? "border-violet-500/40 bg-violet-500/[0.06] shadow-[0_0_40px_rgba(124,58,237,0.15)]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]"
                }`}
              >
                {meta.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase text-violet-300 bg-violet-600 px-3 py-1 rounded-full">
                    Más popular
                  </div>
                )}

                {plan.has_community_override && (
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    Precio especial
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}22` }}>
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-1">
                  {billingInterval === "annual" ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">${perMonth}</span>
                        <span className="text-xs text-white/30">/mes</span>
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">
                        ${price} facturado anualmente
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">${price}</span>
                      <span className="text-xs text-white/30">/mes</span>
                    </div>
                  )}
                </div>

                {plan.trial_days > 0 && (
                  <p className="text-[11px] text-emerald-400 mb-4">
                    {plan.trial_days} días de prueba gratis
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1 mt-3">
                  {meta.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-white/60">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Limits summary */}
                <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <Stat icon={Globe} label="Embudos" value={formatLimit(plan.limits.funnels_max)} />
                  <Stat icon={Users} label="Comunidades" value={formatLimit(plan.limits.communities_max)} />
                  <Stat icon={BarChart3} label="Contactos" value={formatLimit(plan.limits.contacts_max)} />
                  <Stat icon={Shield} label="Cap comis." value={
                    plan.limits.commission_cap_monthly === null
                      ? "Sin límite"
                      : plan.limits.commission_cap_monthly === 0
                      ? "—"
                      : `$${plan.limits.commission_cap_monthly}/mo`
                  } />
                </div>

                <button
                  onClick={() => selectPlan(plan.code)}
                  disabled={!!selecting}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    meta.highlight
                      ? "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)]"
                      : "bg-white/[0.06] hover:bg-white/[0.10] text-white border border-white/[0.08]"
                  } disabled:opacity-50 disabled:pointer-events-none`}
                >
                  {selecting === plan.code ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {plan.trial_days > 0 ? `Probar ${plan.trial_days} días gratis` : "Seleccionar plan"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Skip */}
        <div className="mt-10 text-center">
          <button
            onClick={skipForNow}
            className="text-sm text-violet-300/30 hover:text-violet-300/60 transition-colors"
          >
            Continuar sin seleccionar plan →
          </button>
          <p className="mt-2 text-xs text-violet-300/20">
            Podrás elegir o cambiar tu plan en cualquier momento desde tu panel.
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-violet-400/40 shrink-0" />
      <div>
        <p className="text-[9px] text-white/30 uppercase tracking-wide">{label}</p>
        <p className="text-[11px] font-semibold text-white/70">{value}</p>
      </div>
    </div>
  )
}
