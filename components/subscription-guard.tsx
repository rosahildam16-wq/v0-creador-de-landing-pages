"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { Clock, AlertTriangle, ArrowRight, CreditCard } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SubscriptionGuardProps {
  children: ReactNode
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { data, isLoading } = useSWR(
    user?.email ? `/api/payments/check-subscription?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: true }
  )

  // While loading, show content (don't block the UI)
  if (isLoading || !mounted) {
    return <>{children}</>
  }

  // If no subscription data returned (API not reachable, tables empty, etc.), allow access
  // This ensures the app works even before NOWPayments is configured
  if (!data || data.error) {
    return <>{children}</>
  }

  // If user has valid access, show content
  if (data.hasAccess) {
    return <>{children}</>
  }

  // If no subscription at all, show paywall
  const reason = data.reason as string

  if (reason === "no_subscription") {
    return <PaywallScreen type="no_subscription" />
  }

  if (reason === "trial_expired") {
    return (
      <PaywallScreen
        type="trial_expired"
        trialEnd={data.subscription?.trial_ends_at}
      />
    )
  }

  if (reason === "subscription_expired" || reason === "pending_payment") {
    return (
      <PaywallScreen
        type="expired"
        periodEnd={data.subscription?.current_period_end}
      />
    )
  }

  // Default: allow access
  return <>{children}</>
}

function PaywallScreen({
  type,
  trialEnd,
  periodEnd,
}: {
  type: "no_subscription" | "trial_expired" | "expired"
  trialEnd?: string
  periodEnd?: string
}) {
  const config = {
    no_subscription: {
      icon: CreditCard,
      title: "Activa tu suscripcion",
      description: "Para acceder a la plataforma necesitas una suscripcion activa. Comienza con 3 dias de prueba gratis.",
      cta: "Ver planes y precios",
    },
    trial_expired: {
      icon: Clock,
      title: "Tu prueba gratuita ha terminado",
      description: `Tu periodo de prueba finalizo${trialEnd ? ` el ${new Date(trialEnd).toLocaleDateString("es-MX")}` : ""}. Elige un plan para seguir usando Magic Funnel.`,
      cta: "Elegir un plan",
    },
    expired: {
      icon: AlertTriangle,
      title: "Suscripcion vencida",
      description: `Tu suscripcion expiro${periodEnd ? ` el ${new Date(periodEnd).toLocaleDateString("es-MX")}` : ""}. Renueva para recuperar el acceso a todas tus herramientas.`,
      cta: "Renovar suscripcion",
    },
  }

  const c = config[type]
  const Icon = c.icon

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="relative w-full max-w-md rounded-2xl border border-border/30 bg-card/50 backdrop-blur-xl p-10 text-center">
        <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="flex flex-col items-center gap-6">
          <MagicFunnelLogo size="sm" animated={false} />

          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <Icon className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">{c.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {c.description}
            </p>
          </div>

          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]"
          >
            {c.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
