"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import { LoginPremiumBg } from "@/components/login-premium-bg"
import { useAuth } from "@/lib/auth-context"
import { Eye, EyeOff, ArrowRight, Sparkles, Bot, TrendingUp, Network, Tag, AtSign, Check, X, UserPlus, Users } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, register, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [sponsorUsername, setSponsorUsername] = useState("")
  const [showDiscountField, setShowDiscountField] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [justRegisteredAsLeader, setJustRegisteredAsLeader] = useState(false)

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  // Sponsor verification
  const [sponsorStatus, setSponsorStatus] = useState<"idle" | "checking" | "found" | "not_found">("idle")
  const [sponsorRealName, setSponsorRealName] = useState("")

  // Debounced username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(username.length > 0 ? "invalid" : "idle")
      return
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setUsernameStatus("invalid")
      return
    }
    setUsernameStatus("checking")
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        setUsernameStatus(data.available ? "available" : "taken")
      } catch {
        setUsernameStatus("idle")
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  // Debounced sponsor check
  useEffect(() => {
    if (!sponsorUsername || sponsorUsername.length < 3) {
      setSponsorStatus(sponsorUsername.length > 0 ? "not_found" : "idle")
      setSponsorRealName("")
      return
    }
    setSponsorStatus("checking")
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check-sponsor?username=${encodeURIComponent(sponsorUsername)}`)
        const data = await res.json()
        if (data.exists) {
          setSponsorStatus("found")
          setSponsorRealName(data.name)
        } else {
          setSponsorStatus("not_found")
          setSponsorRealName("")
        }
      } catch {
        setSponsorStatus("idle")
        setSponsorRealName("")
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [sponsorUsername])
  // Handle referral from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref") || params.get("sponsor")
    if (ref && mode === "register") {
      setSponsorUsername(ref.toLowerCase())
      setShowDiscountField(false) // prioritise sponsor
    }
  }, [mode])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "super_admin") router.replace("/admin")
      else router.replace("/member")
    }
  }, [isAuthenticated, authLoading, user, router])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    if (mode === "register") {
      if (!name.trim()) {
        setError("Ingresa tu nombre completo.")
        setIsSubmitting(false)
        return
      }
      if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
        setError("El nombre de usuario debe tener minimo 3 caracteres (letras, numeros y _).")
        setIsSubmitting(false)
        return
      }
      if (usernameStatus === "taken") {
        setError("Este nombre de usuario ya esta en uso. Elige otro.")
        setIsSubmitting(false)
        return
      }
      if (password.length < 6) {
        setError("La contrasena debe tener al menos 6 caracteres.")
        setIsSubmitting(false)
        return
      }
      if (sponsorStatus !== "found") {
        setError("Se requiere un patrocinador valido para registrarse en Skalia VIP.")
        setIsSubmitting(false)
        return
      }
      // Todos se registran como miembros
      const ok = await register(name, email, password, username, discountCode || undefined, sponsorUsername.trim())
      if (!ok) {
        setError("Este email o usuario ya esta registrado. Intenta iniciar sesion.")
        setIsSubmitting(false)
      }
    } else {
      const ok = await login(email, password)
      if (!ok) {
        setError("Credenciales incorrectas. Verifica tu email y contrasena.")
        setIsSubmitting(false)
      }
    }
  }

  const toggleMode = () => {
    setMode((m) => m === "login" ? "register" : "login")
    setError("")
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

              {/* Mode toggle tabs */}
              <div className="mb-6 flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError("") }}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all duration-300 ${mode === "login"
                    ? "bg-violet-600/20 text-violet-300 shadow-sm"
                    : "text-violet-400/40 hover:text-violet-300/60"
                    }`}
                >
                  Iniciar Sesion
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError("") }}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all duration-300 ${mode === "register"
                    ? "bg-violet-600/20 text-violet-300 shadow-sm"
                    : "text-violet-400/40 hover:text-violet-300/60"
                    }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3 justify-center lg:justify-start">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-[11px] font-bold text-violet-400/80 tracking-[0.2em] uppercase">
                    {mode === "login" ? "Acceso Premium" : "Crear Cuenta"}
                  </span>
                </div>
                <h2 className="text-[1.65rem] font-bold text-white tracking-tight text-center lg:text-left">
                  {mode === "login" ? "Bienvenido de vuelta" : "Unete a Magic Funnel"}
                </h2>
                <p className="mt-2 text-sm text-violet-300/40 text-center lg:text-left">
                  {mode === "login" ? "Ingresa tus credenciales para continuar" : "Crea tu cuenta y comienza a crecer"}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name field (register only) */}
                {mode === "register" && (
                  <div>
                    <label htmlFor="login-name" className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                      Nombre completo
                    </label>
                    <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === "name"
                      ? "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
                      : "border-white/[0.06] hover:border-white/[0.10]"
                      }`}>
                      <input
                        id="login-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Tu nombre completo"
                        className="w-full px-4 py-3 bg-transparent text-white text-sm placeholder:text-violet-400/25 focus:outline-none rounded-xl"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                    Email
                  </label>
                  <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === "email"
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
                    {mode === "login" && (
                      <button type="button" className="text-[11px] text-violet-400/60 hover:text-violet-400 transition-colors">
                        Olvidaste tu contrasena?
                      </button>
                    )}
                  </div>
                  <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === "password"
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

                {/* Username, Sponsor, Community code (register only) */}
                {mode === "register" && (
                  <>
                    {/* Username */}
                    <div>
                      <label htmlFor="login-username" className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                        Nombre de usuario
                      </label>
                      <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === "username"
                        ? usernameStatus === "taken" || usernameStatus === "invalid"
                          ? "border-red-500/40 shadow-[0_0_0_3px_rgba(239,68,68,0.06)]"
                          : usernameStatus === "available"
                            ? "border-emerald-500/40 shadow-[0_0_0_3px_rgba(16,185,129,0.06)]"
                            : "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
                        : "border-white/[0.06] hover:border-white/[0.10]"
                        }`}>
                        <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400/25" />
                        <input
                          id="login-username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          onFocus={() => setFocusedField("username")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="tu_usuario"
                          className="w-full pl-10 pr-10 py-3 bg-transparent text-white text-sm font-mono placeholder:text-violet-400/25 focus:outline-none rounded-xl"
                          required
                        />
                        {/* Status indicator */}
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {usernameStatus === "checking" && (
                            <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                          )}
                          {usernameStatus === "available" && <Check className="w-4 h-4 text-emerald-400" />}
                          {(usernameStatus === "taken" || usernameStatus === "invalid") && <X className="w-4 h-4 text-red-400" />}
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] text-violet-300/30">
                        {usernameStatus === "taken" ? (
                          <span className="text-red-400">Este usuario ya esta en uso</span>
                        ) : usernameStatus === "invalid" ? (
                          <span className="text-red-400">Minimo 3 caracteres: letras, numeros y _</span>
                        ) : usernameStatus === "available" ? (
                          <span className="text-emerald-400">Disponible</span>
                        ) : (
                          "Unico e irrepetible. Este sera tu link de referido."
                        )}
                      </p>
                    </div>

                    {/* Sponsor by username */}
                    <div>
                      <label htmlFor="login-sponsor" className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                        Usuario de tu patrocinador
                      </label>
                      <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === "sponsor"
                        ? sponsorStatus === "found"
                          ? "border-emerald-500/40 shadow-[0_0_0_3px_rgba(16,185,129,0.06)]"
                          : sponsorStatus === "not_found" && sponsorUsername.length >= 3
                            ? "border-amber-500/40 shadow-[0_0_0_3px_rgba(245,158,11,0.06)]"
                            : "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
                        : "border-white/[0.06] hover:border-white/[0.10]"
                        }`}>
                        <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400/25" />
                        <input
                          id="login-sponsor"
                          type="text"
                          value={sponsorUsername}
                          onChange={(e) => setSponsorUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          onFocus={() => setFocusedField("sponsor")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="usuario_de_quien_te_invito"
                          className="w-full pl-10 pr-10 py-3 bg-transparent text-white text-sm font-mono placeholder:text-violet-400/25 focus:outline-none rounded-xl"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {sponsorStatus === "checking" && (
                            <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                          )}
                          {sponsorStatus === "found" && <Check className="w-4 h-4 text-emerald-400" />}
                          {sponsorStatus === "not_found" && sponsorUsername.length >= 3 && <X className="w-4 h-4 text-amber-400" />}
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] text-violet-300/30">
                        {sponsorStatus === "found" ? (
                          <span className="text-emerald-400">Patrocinador: {sponsorRealName}</span>
                        ) : sponsorStatus === "not_found" && sponsorUsername.length >= 3 ? (
                          <span className="text-amber-400">Usuario no encontrado</span>
                        ) : (
                          "Opcional. El username de la persona que te invito."
                        )}
                      </p>
                    </div>

                    {/* Community code */}
                    <div>
                      {!showDiscountField ? (
                        <button
                          type="button"
                          onClick={() => setShowDiscountField(true)}
                          className="flex items-center gap-1.5 text-xs text-violet-400/50 hover:text-violet-400 transition-colors"
                        >
                          <Tag className="w-3 h-3" />
                          Tengo un codigo de comunidad
                        </button>
                      ) : (
                        <div>
                          <label htmlFor="login-discount" className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                            Codigo de comunidad
                          </label>
                          <div className={`relative rounded-xl border transition-all duration-300 ${focusedField === "discount"
                            ? "border-emerald-500/40 shadow-[0_0_0_3px_rgba(16,185,129,0.06)]"
                            : "border-white/[0.06] hover:border-white/[0.10]"
                            }`}>
                            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400/25" />
                            <input
                              id="login-discount"
                              type="text"
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                              onFocus={() => setFocusedField("discount")}
                              onBlur={() => setFocusedField(null)}
                              placeholder="Ej: MIEQUIPO2026"
                              className="w-full pl-10 pr-4 py-3 bg-transparent text-white text-sm font-mono placeholder:text-violet-400/25 focus:outline-none rounded-xl uppercase"
                            />
                          </div>
                          <p className="mt-1.5 text-[10px] text-violet-300/30">Si tu lider te dio un codigo, ingresalo para unirte a su comunidad.</p>
                        </div>
                      )}
                      {/* Role hint */}
                      <div className="mt-3 rounded-lg border border-violet-500/10 bg-violet-500/[0.03] px-3 py-2.5">
                        <p className="text-[10px] text-violet-300/50 leading-relaxed">
                          {discountCode ? (
                            <>Te registraras como miembro de la comunidad asociada a este codigo.</>
                          ) : (
                            <>Al registrarte, podras crear y gestionar tu propia comunidad con todas las herramientas activas.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="premium-submit-btn group relative w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-500 disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {mode === "login" ? "Ingresando..." : "Creando cuenta..."}
                      </>
                    ) : (
                      <>
                        {mode === "login" ? "Iniciar Sesion" : "Crear Cuenta"}
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-violet-300/30">
                {mode === "login" ? "No tienes cuenta? " : "Ya tienes cuenta? "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  {mode === "login" ? "Registrate aqui" : "Inicia sesion"}
                </button>
              </p>

              {/* TEST SHORTCUT BUTTONS */}
              <div className="mt-10 pt-8 border-t border-white/[0.05]">
                <p className="text-[10px] font-bold text-violet-400/40 tracking-[0.2em] uppercase text-center mb-4">
                  Accesos Directos (Explorar Interfaz)
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={async () => {
                      setIsSubmitting(true)
                      await login("iajorgeleon21@gmail.com", "Leon321$#")
                      setIsSubmitting(false)
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.03] text-violet-200 text-xs hover:bg-violet-500/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span>Entrar como Super Admin</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </button>

                  <button
                    onClick={async () => {
                      setIsSubmitting(true)
                      await login("test_member@magic.com", "test1234")
                      setIsSubmitting(false)
                    }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-violet-200 text-xs hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-violet-400/60" />
                      <span>Entrar como Miembro</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </button>
                </div>
              </div>
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
