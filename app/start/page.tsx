"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { ArrowRight, Sparkles, Users, Zap, Crown, CheckCircle2, Loader2 } from "lucide-react"

// ─── Plans shown on this page ─────────────────────────────────────────────────

interface PlanOption {
  code: string
  name: string
  price: number
  highlight: boolean
  badge?: string
  features: string[]
}

const PLANS: PlanOption[] = [
  {
    code: "plan_47",
    name: "Starter",
    price: 47,
    highlight: false,
    features: [
      "3 embudos activos",
      "500 contactos",
      "Herramientas IA básicas",
      "Soporte por email",
    ],
  },
  {
    code: "plan_97",
    name: "Pro",
    price: 97,
    highlight: true,
    badge: "Más popular",
    features: [
      "10 embudos activos",
      "5,000 contactos",
      "IA avanzada + automatización",
      "Crear tu propia comunidad",
      "Comisiones sin límite",
    ],
  },
  {
    code: "plan_300",
    name: "Elite",
    price: 300,
    highlight: false,
    badge: "Todo incluido",
    features: [
      "Embudos ilimitados",
      "Contactos ilimitados",
      "IA premium + acceso anticipado",
      "Múltiples comunidades",
      "Comisiones sin límite",
      "Soporte prioritario",
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function StartPage() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("")
  const [checking, setChecking] = useState(true)

  // Verify session — redirect to login if not authenticated
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/login")
          return
        }
        // If user already has a community, send them to the member dashboard
        if (data.user?.communityId) {
          router.replace("/member")
          return
        }
        setUserName(data.user?.name ?? "")
        setChecking(false)
      })
      .catch(() => router.replace("/login"))
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#050012" }}>
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#050012" }}>
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.15) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 flex flex-col items-center justify-start px-6 py-16 min-h-screen">
        {/* Logo */}
        <div className="mb-12">
          <MagicFunnelLogo size="md" animated />
        </div>

        {/* Header */}
        <div className="text-center max-w-xl mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/[0.06] mb-6 text-xs font-semibold text-violet-300 tracking-widest uppercase">
            <Sparkles className="w-3 h-3" />
            Bienvenido a MagicFunnel
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            {userName ? `Hola, ${userName.split(" ")[0]}` : "Bienvenido"}
            <br />
            <span className="text-violet-400">aún no tienes comunidad</span>
          </h1>

          <p className="text-base text-violet-200/40 leading-relaxed">
            Para acceder a todas las herramientas activa tu plan y crea tu propia comunidad,
            o espera a que alguien te invite con un link.
          </p>
        </div>

        {/* Two paths */}
        <div className="w-full max-w-4xl mt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">

          {/* Path A: Activate a plan */}
          <div>
            <p className="text-[11px] text-violet-400/60 uppercase tracking-widest font-semibold mb-4 text-center">
              Opción 1 — Activa tu plan
            </p>
            <div className="space-y-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.code}
                  className={`relative rounded-2xl border p-5 transition-all ${
                    plan.highlight
                      ? "border-violet-500/40 bg-violet-500/[0.06] shadow-[0_0_30px_-10px_rgba(124,58,237,0.3)]"
                      : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12]"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-600 text-white">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{plan.name}</p>
                      <p className="text-2xl font-extrabold text-white mt-0.5">
                        ${plan.price}
                        <span className="text-xs text-violet-300/40 font-normal">/mes</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                      {plan.price >= 300 ? (
                        <Crown className="w-5 h-5 text-violet-400" />
                      ) : plan.price >= 97 ? (
                        <Zap className="w-5 h-5 text-violet-400" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-violet-400" />
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-violet-200/50">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/pricing"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      plan.highlight
                        ? "bg-violet-600 hover:bg-violet-500 text-white"
                        : "border border-white/10 hover:border-violet-500/30 text-violet-300/70 hover:text-white"
                    }`}
                  >
                    Elegir {plan.name}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-3 py-8">
            <div className="w-px h-20 bg-white/5" />
            <span className="text-xs text-violet-300/20 font-semibold">ó</span>
            <div className="w-px h-20 bg-white/5" />
          </div>
          <div className="flex lg:hidden items-center gap-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-violet-300/20 font-semibold">ó</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Path B: Wait for invite */}
          <div>
            <p className="text-[11px] text-violet-400/60 uppercase tracking-widest font-semibold mb-4 text-center">
              Opción 2 — Únete con un invite
            </p>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                <Users className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Espera tu invitación</h3>
                <p className="text-xs text-violet-200/30 leading-relaxed">
                  Si alguien te invitó a su comunidad, busca el link en tu WhatsApp o email.
                  El link tiene la forma:
                </p>
                <code className="mt-2 block text-[11px] text-violet-400/60 bg-white/[0.03] rounded-lg px-3 py-1.5 font-mono">
                  magicfunnel.io/join/[comunidad]?token=…
                </code>
              </div>
              <div className="w-full rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3 text-xs text-emerald-400/80">
                Una vez que uses ese link, podrás registrarte directamente y tendrás acceso inmediato.
              </div>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-12 text-xs text-violet-300/20">
          ¿Preguntas?{" "}
          <a href="mailto:soporte@magicfunnel.io" className="text-violet-400/50 hover:text-violet-400 transition-colors">
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  )
}
