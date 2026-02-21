"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { LoginPremiumBg } from "@/components/login-premium-bg"
import { useAuth } from "@/lib/auth-context"
import { Eye, EyeOff, ArrowRight, Sparkles, Bot, TrendingUp, Network } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace("/admin")
  }, [isAuthenticated, authLoading, router])

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#050012" }}>
        <div className="flex flex-col items-center gap-6">
          <MagicFunnelLogo size="lg" animated />
          <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600" />
          </div>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    const ok = await login(email, password)
    if (ok) {
      router.push("/admin")
    } else {
      setError("Credenciales incorrectas. Verifica tu email y contrasena.")
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsSubmitting(true)
    const ok = await loginWithGoogle()
    if (ok) {
      router.push("/admin")
    } else {
      setIsSubmitting(false)
    }
  }

  const features = [
    { icon: Bot, label: "IA Avanzada", desc: "Automatizacion inteligente que aprende y optimiza" },
    { icon: TrendingUp, label: "Marketing Elite", desc: "Embudos de alta conversion con analytics en tiempo real" },
    { icon: Network, label: "Red Multinivel", desc: "Escalamiento con estructura de equipos integrada" },
  ]

  return (
    <div className="relative flex min-h-screen" style={{ background: "#050012" }}>
      <LoginPremiumBg />

      <div className="relative z-10 flex min-h-screen w-full">

        {/* ---- LEFT PANEL ---- */}
        <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between p-12 xl:p-16">

          {/* Logo */}
          <div className={`transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            <MagicFunnelLogo size="lg" animated />
          </div>

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-xl mt-4">
            {/* Badge */}
            <div className={`transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] mb-8">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300 tracking-widest uppercase">
                  IA + Marketing de Ultima Generacion
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className={`transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <h1 className="text-5xl xl:text-[3.5rem] font-bold leading-[1.08] tracking-tight text-white">
                <span className="text-balance">
                  {"¿Pensabas que la "}
                  <span className="premium-gradient-text">magia no existe</span>
                  {"? es hora de "}
                  <span className="premium-gradient-text">comprobarlo</span>
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-violet-200/60 max-w-md">
                Embudos automatizados, IA predictiva y herramientas multinivel.
                La plataforma que transforma contactos en comunidades rentables.
              </p>
            </div>

            {/* Feature cards */}
            <div className={`mt-12 space-y-4 transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              {features.map((feat, i) => (
                <div
                  key={feat.label}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all duration-500"
                  style={{ transitionDelay: `${600 + i * 100}ms` }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/10 shrink-0 group-hover:border-violet-500/25 transition-colors">
                    <feat.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feat.label}</h3>
                    <p className="text-xs text-violet-300/40 mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className={`transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="flex items-center gap-10">
              {[
                { value: "2,400+", label: "Marketers activos" },
                { value: "98.7%", label: "Uptime garantizado" },
                { value: "3.2x", label: "ROI promedio" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[11px] text-violet-300/40 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- RIGHT PANEL: Login form ---- */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
          <div className={`w-full max-w-[420px] transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-[0.97]"}`}>

            {/* Glass card */}
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-2xl p-8 lg:p-10">
              {/* Top glow bar */}
              <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
              {/* Corner glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

              {/* Mobile logo */}
              <div className="flex justify-center mb-8 lg:hidden">
                <MagicFunnelLogo size="md" animated />
              </div>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 justify-center lg:justify-start">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-[11px] font-bold text-violet-400/80 tracking-[0.2em] uppercase">
                    Acceso Premium
                  </span>
                </div>
                <h2 className="text-[1.65rem] font-bold text-white tracking-tight text-center lg:text-left">
                  Bienvenido de vuelta
                </h2>
                <p className="mt-2 text-sm text-violet-300/40 text-center lg:text-left">
                  Ingresa tus credenciales para continuar
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="group w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm font-medium transition-all duration-300 hover:bg-white/[0.07] hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/[0.04] disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-7">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                <span className="text-[10px] text-violet-400/30 font-semibold uppercase tracking-[0.2em]">o</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                    Email
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-300 ${
                    focusedField === "email"
                      ? "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
                      : "border-white/[0.06] hover:border-white/[0.10]"
                  }`}>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="tu@empresa.com"
                      className="w-full px-4 py-3 bg-transparent text-white text-sm placeholder:text-violet-400/25 focus:outline-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2 ml-0.5">
                    <label htmlFor="login-password" className="block text-xs font-medium text-violet-200/60">
                      Contrasena
                    </label>
                    <button type="button" className="text-[11px] text-violet-400/60 hover:text-violet-400 transition-colors">
                      Olvidaste tu contrasena?
                    </button>
                  </div>
                  <div className={`relative rounded-xl border transition-all duration-300 ${
                    focusedField === "password"
                      ? "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
                      : "border-white/[0.06] hover:border-white/[0.10]"
                  }`}>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ingresa tu contrasena"
                      className="w-full px-4 py-3 bg-transparent text-white text-sm placeholder:text-violet-400/25 focus:outline-none rounded-xl pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-violet-400/30 hover:text-violet-300/60 transition-colors"
                      aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="premium-submit-btn group relative w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-500 disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Ingresando...
                      </>
                    ) : (
                      <>
                        Iniciar Sesion
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-violet-300/30">
                {"No tienes cuenta? "}
                <button className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Solicita acceso
                </button>
              </p>
            </div>

            {/* Bottom links */}
            <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-violet-400/20">
              <span className="hover:text-violet-300/40 transition-colors cursor-pointer">Privacidad</span>
              <span className="w-0.5 h-0.5 rounded-full bg-violet-500/20" />
              <span className="hover:text-violet-300/40 transition-colors cursor-pointer">Terminos</span>
              <span className="w-0.5 h-0.5 rounded-full bg-violet-500/20" />
              <span className="hover:text-violet-300/40 transition-colors cursor-pointer">Soporte</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
