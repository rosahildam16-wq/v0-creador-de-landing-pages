"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { LoginPremiumBg } from "@/components/login-premium-bg"
import { PricingCards } from "@/components/pricing/pricing-cards"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

function CancelledBanner() {
  const searchParams = useSearchParams()
  const cancelled = searchParams.get("cancelled")

  if (!cancelled) return null

  return (
    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-sm text-amber-300">
      El pago fue cancelado. Puedes intentar nuevamente cuando quieras.
    </div>
  )
}

function PricingContent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="relative min-h-screen" style={{ background: "#050012" }}>
      <LoginPremiumBg />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 lg:px-12">
          <Link href="/login" className="flex items-center gap-2 text-sm text-violet-300/50 hover:text-violet-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al login</span>
          </Link>
          <MagicFunnelLogo size="sm" animated={false} />
        </header>

        {/* Hero */}
        <div className="mx-auto max-w-4xl px-6 pt-8 pb-4 text-center">
          <div className={`transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300 tracking-widest uppercase">
                3 dias de prueba gratis
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight text-balance">
              {"Elige el plan que "}
              <span className="premium-gradient-text">impulse tu negocio</span>
            </h1>
            <p className="mt-4 text-lg text-violet-200/50 max-w-2xl mx-auto">
              Todos los planes incluyen 3 dias de prueba gratuita. Paga con USDT de forma segura y descentralizada.
            </p>
          </div>

          <Suspense fallback={null}>
            <CancelledBanner />
          </Suspense>
        </div>

        {/* Pricing cards */}
        <div className={`transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <PricingCards />
        </div>

        {/* Footer */}
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-violet-300/30">
              <span>Pagos procesados por</span>
              <span className="font-semibold text-violet-300/50">NOWPayments</span>
            </div>
            <p className="text-xs text-violet-300/20 max-w-lg">
              Todos los pagos se realizan en USDT (TRC-20) de forma segura. Tu suscripcion se activa automaticamente al confirmar el pago en la blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return <PricingContent />
}
