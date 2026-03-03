"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { LoginPremiumBg } from "@/components/login-premium-bg"
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

type PaymentStatusType = "loading" | "demo" | "success" | "pending" | "failed"

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center" style={{ background: "#050012" }}>
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  )
}

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get("subscription_id")
  const statusParam = searchParams.get("status")
  const isDemo = searchParams.get("demo") === "true"
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>("loading")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (isDemo) {
      setPaymentStatus("demo")
      return
    }

    if (statusParam === "success") {
      setPaymentStatus("success")
      return
    }

    // Poll for payment confirmation
    if (subscriptionId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/check-subscription?email=poll_${subscriptionId}`)
          const data = await res.json()

          if (data.subscription?.status === "active") {
            setPaymentStatus("success")
            clearInterval(interval)
          } else if (data.subscription?.status === "trial") {
            setPaymentStatus("pending")
          }
        } catch {
          // Keep polling
        }
      }, 5000)

      // Set initial state
      setPaymentStatus("pending")

      return () => clearInterval(interval)
    }
  }, [subscriptionId, statusParam, isDemo])

  const statusConfig = {
    loading: {
      icon: Loader2,
      iconClass: "w-16 h-16 text-violet-400 animate-spin",
      title: "Verificando pago...",
      description: "Estamos confirmando tu pago con Alivio Payment.",
      showCTA: false,
    },
    demo: {
      icon: AlertTriangle,
      iconClass: "w-16 h-16 text-amber-400",
      title: "Modo demostracion",
      description: "Alivio Payment no esta configurado. Agrega ALIVIO_API_KEY en las variables de entorno para habilitar pagos reales.",
      showCTA: true,
    },
    success: {
      icon: CheckCircle2,
      iconClass: "w-16 h-16 text-emerald-400",
      title: "Pago confirmado",
      description: "Tu suscripcion ha sido activada exitosamente. Ya tienes acceso completo a la plataforma.",
      showCTA: true,
    },
    pending: {
      icon: Clock,
      iconClass: "w-16 h-16 text-violet-400",
      title: "Esperando confirmacion",
      description: "Tu pago esta siendo procesado por Alivio. Esto puede tardar unos minutos. Esta pagina se actualizara automaticamente.",
      showCTA: false,
    },
    failed: {
      icon: XCircle,
      iconClass: "w-16 h-16 text-red-400",
      title: "Pago fallido",
      description: "Hubo un problema con tu pago. Por favor intenta nuevamente.",
      showCTA: true,
    },
  }

  const config = statusConfig[paymentStatus]
  const StatusIcon = config.icon

  return (
    <div className="relative min-h-screen" style={{ background: "#050012" }}>
      <LoginPremiumBg />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <div className={`w-full max-w-md text-center transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Glass card */}
          <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-2xl p-10">
            <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            <div className="flex flex-col items-center gap-6">
              <MagicFunnelLogo size="sm" animated={false} />

              <div className="relative">
                {paymentStatus === "success" && (
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-30 bg-emerald-500" />
                )}
                <StatusIcon className={config.iconClass} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">{config.title}</h1>
                <p className="mt-3 text-sm text-violet-200/50 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {paymentStatus === "pending" && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/10 bg-violet-500/[0.03]">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  <span className="text-xs text-violet-300/50">Verificando automaticamente...</span>
                </div>
              )}

              {config.showCTA && (
                <div className="flex flex-col gap-3 w-full mt-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]"
                  >
                    Ir al login
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-xs text-violet-300/40 hover:text-violet-300 transition-colors"
                  >
                    Volver a planes
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
