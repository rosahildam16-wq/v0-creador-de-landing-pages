"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { MagicFunnelLogo } from "@/components/magic-funnel-logo"
import {
  Eye, EyeOff, ArrowRight, Check, X, AtSign, Loader2,
  Users, Sparkles, Shield, ChevronRight,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommunityData {
  id: string
  nombre: string
  descripcion: string
  slug: string
  color: string
  trial_days: number
  allow_trial: boolean
}

interface PlanData {
  code: string
  name: string
  trial_days: number
  effective_monthly: number
  effective_annual: number
  limits: {
    funnels_max: number
    communities_max: number
    contacts_max: number
    tools: string[]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCookiePersist(key: string, value: string | null, days = 30) {
  useEffect(() => {
    if (!value) return
    const expires = new Date()
    expires.setDate(expires.getDate() + days)
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  }, [key, value, days])
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JoinPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const communitySlug = params.community_slug as string

  // URL params
  const inviteTokenFromUrl = searchParams.get("token") ?? searchParams.get("invite") ?? ""
  const refFromUrl = searchParams.get("ref") ?? searchParams.get("r") ?? ""

  // Persist join context in cookies (30d)
  useCookiePersist("mf_join_community", communitySlug)
  useCookiePersist("mf_join_ref", refFromUrl || null)
  useCookiePersist("mf_join_utm_source", searchParams.get("utm_source"))
  useCookiePersist("mf_join_utm_medium", searchParams.get("utm_medium"))
  useCookiePersist("mf_join_utm_campaign", searchParams.get("utm_campaign"))

  // Data
  const [community, setCommunity] = useState<CommunityData | null>(null)
  const [plans, setPlans] = useState<PlanData[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState("")

  // Invite token state
  const [inviteToken, setInviteToken] = useState(inviteTokenFromUrl)
  const [inviteSponsor, setInviteSponsor] = useState<{ username: string; name: string | null } | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [refUsername, setRefUsername] = useState(refFromUrl)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Async checks
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [refStatus, setRefStatus] = useState<"idle" | "checking" | "found" | "not_found">("idle")
  const [refName, setRefName] = useState("")

  // Load community + plans
  useEffect(() => {
    if (!communitySlug) return
    fetch(`/api/join/${communitySlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setDataError(data.error)
        } else {
          setCommunity(data.community)
          setPlans(data.plans)
        }
      })
      .catch(() => setDataError("No se pudo cargar la comunidad"))
      .finally(() => setDataLoading(false))
  }, [communitySlug])

  // Validate invite token on mount (if present in URL)
  useEffect(() => {
    if (!inviteTokenFromUrl) return
    setInviteLoading(true)
    fetch(`/api/invites/${encodeURIComponent(inviteTokenFromUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid && data.sponsor) {
          setInviteSponsor(data.sponsor)
          setRefUsername(data.sponsor.username)
          setRefStatus("found")
          setRefName(data.sponsor.name ?? data.sponsor.username)
          setInviteError("")
        } else {
          setInviteError(data.error ?? "Invitación inválida")
        }
      })
      .catch(() => setInviteError("No se pudo validar la invitación"))
      .finally(() => setInviteLoading(false))
  }, [inviteTokenFromUrl])

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
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`)
        const d = await r.json()
        setUsernameStatus(d.available ? "available" : "taken")
      } catch {
        setUsernameStatus("idle")
      }
    }, 500)
    return () => clearTimeout(t)
  }, [username])

  // Debounced referrer check
  useEffect(() => {
    if (!refUsername || refUsername.length < 3) {
      setRefStatus(refUsername.length > 0 ? "not_found" : "idle")
      setRefName("")
      return
    }
    setRefStatus("checking")
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/users/check-sponsor?username=${encodeURIComponent(refUsername)}`)
        const d = await r.json()
        if (d.exists) {
          setRefStatus("found")
          setRefName(d.name)
        } else {
          setRefStatus("not_found")
          setRefName("")
        }
      } catch {
        setRefStatus("idle")
      }
    }, 500)
    return () => clearTimeout(t)
  }, [refUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) return setError("Ingresa tu nombre completo.")
    if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username))
      return setError("El usuario debe tener mínimo 3 caracteres (letras, números y _).")
    if (usernameStatus === "taken") return setError("Ese nombre de usuario ya está en uso.")
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.")
    if (refUsername && refStatus !== "found")
      return setError("Si ingresas un referido, debe ser un usuario válido.")

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/join/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          username,
          communitySlug,
          refUsername: refUsername || undefined,
          invite_token: inviteToken || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al registrar")
        return
      }

      // Success → redirect to plan selection
      router.push(`/join/${communitySlug}/plans`)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render states ────────────────────────────────────────────────────────────

  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#050012" }}>
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  if (dataError || !community) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4" style={{ background: "#050012" }}>
        <p className="text-red-400 text-sm">{dataError || "Comunidad no encontrada"}</p>
        <a href="/" className="text-violet-400 text-xs underline">Volver al inicio</a>
      </div>
    )
  }

  const lowestPlan = plans[0]

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#050012" }}>
      {/* Background gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${community.color || "#7c3aed"}22 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* ── Left: Community info ──────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[48%] flex-col justify-center p-16 gap-8">
          <MagicFunnelLogo size="md" animated />

          <div className="mt-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{
                background: `${community.color || "#7c3aed"}22`,
                color: community.color || "#a78bfa",
                border: `1px solid ${community.color || "#7c3aed"}44`,
              }}
            >
              <Users className="w-3 h-3" />
              Comunidad privada
            </div>

            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
              {community.nombre}
            </h1>

            {community.descripcion && (
              <p className="text-lg text-violet-200/50 leading-relaxed max-w-md">
                {community.descripcion}
              </p>
            )}
          </div>

          {/* Plan preview */}
          {lowestPlan && (
            <div className="mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 max-w-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300/70 uppercase tracking-widest">
                  Planes disponibles
                </span>
              </div>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <div key={plan.code} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-violet-400/40" />
                      <span className="text-sm text-white/70">{plan.name}</span>
                      {plan.trial_days > 0 && (
                        <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                          {plan.trial_days}d gratis
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white">
                      ${plan.effective_monthly}
                      <span className="text-xs text-white/30">/mes</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust indicators */}
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-xs text-violet-300/40">
              <Shield className="w-3.5 h-3.5" />
              <span>Pago seguro</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-violet-300/40">
              <Check className="w-3.5 h-3.5" />
              <span>Cancela cuando quieras</span>
            </div>
          </div>
        </div>

        {/* ── Right: Registration form ──────────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-[420px]">
            {/* Mobile logo */}
            <div className="flex justify-center mb-8 lg:hidden">
              <MagicFunnelLogo size="md" animated />
            </div>

            <div className="relative rounded-[2.5rem] border border-white/[0.08] bg-white/[0.01] backdrop-blur-[40px] p-8 lg:p-10 shadow-[0_24px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute -top-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
              <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />

              {/* Mobile community name */}
              <div className="mb-6 lg:hidden">
                <p className="text-[11px] text-violet-400/60 uppercase tracking-widest mb-1">Unirte a</p>
                <h2 className="text-xl font-bold text-white">{community.nombre}</h2>
              </div>

              <div className="hidden lg:block mb-8">
                <p className="text-[11px] text-violet-400/60 uppercase tracking-widest mb-1">Crear tu cuenta</p>
                <h2 className="text-2xl font-bold text-white">Únete ahora</h2>
                <p className="text-sm text-violet-200/30 mt-1">
                  {lowestPlan?.trial_days
                    ? `${lowestPlan.trial_days} días de prueba gratis`
                    : "Acceso inmediato tras el registro"}
                </p>
              </div>

              {/* Invite token status */}
              {inviteLoading && (
                <div className="mb-4 flex items-center gap-2 text-xs text-violet-400/60">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400" />
                  Verificando invitación...
                </div>
              )}
              {!inviteLoading && inviteSponsor && (
                <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-400">
                  Invitado por <span className="font-semibold">@{inviteSponsor.username}</span>
                  {inviteSponsor.name ? ` (${inviteSponsor.name})` : ""}
                </div>
              )}
              {!inviteLoading && inviteError && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400">
                  {inviteError}
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3 text-sm text-amber-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <Field label="Nombre completo" focusedField={focusedField} fieldKey="name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Tu nombre completo"
                    autoComplete="off"
                    className="w-full px-5 py-3.5 bg-white/[0.02] text-white text-sm placeholder:text-violet-400/20 focus:outline-none rounded-2xl"
                    required
                  />
                </Field>

                {/* Email */}
                <Field label="Email" focusedField={focusedField} fieldKey="email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="tu@email.com"
                    autoComplete="off"
                    className="w-full px-5 py-3.5 bg-white/[0.02] text-white text-sm placeholder:text-violet-400/20 focus:outline-none rounded-2xl"
                    required
                  />
                </Field>

                {/* Password */}
                <Field label="Contraseña" focusedField={focusedField} fieldKey="password">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="off"
                    className="w-full px-5 py-3.5 bg-white/[0.02] text-white text-sm placeholder:text-violet-400/20 focus:outline-none rounded-2xl pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-violet-400/30 hover:text-violet-300/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>

                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                    Nombre de usuario
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all duration-300 ${
                      usernameStatus === "taken" || usernameStatus === "invalid"
                        ? "border-red-500/40"
                        : usernameStatus === "available"
                        ? "border-emerald-500/40"
                        : focusedField === "username"
                        ? "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
                        : "border-white/[0.06] hover:border-white/[0.10]"
                    }`}
                  >
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400/25" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="tu_usuario"
                      autoComplete="off"
                      className="w-full pl-11 pr-11 py-3.5 bg-white/[0.02] text-white text-sm font-mono placeholder:text-violet-400/20 focus:outline-none rounded-2xl"
                      required
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                      )}
                      {usernameStatus === "available" && <Check className="w-4 h-4 text-emerald-400" />}
                      {(usernameStatus === "taken" || usernameStatus === "invalid") && <X className="w-4 h-4 text-red-400" />}
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-violet-300/30">
                    {usernameStatus === "taken" ? (
                      <span className="text-red-400">Ya está en uso</span>
                    ) : usernameStatus === "invalid" ? (
                      <span className="text-red-400">Mín. 3 caracteres: letras, números y _</span>
                    ) : usernameStatus === "available" ? (
                      <span className="text-emerald-400">Disponible ✓</span>
                    ) : (
                      "Este será tu link de referido"
                    )}
                  </p>
                </div>

                {/* Referrer */}
                <div>
                  <label className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">
                    Usuario que te invitó <span className="text-violet-400/30">(opcional)</span>
                  </label>
                  <div
                    className={`relative rounded-xl border transition-all duration-300 ${
                      refStatus === "found"
                        ? "border-emerald-500/40"
                        : refStatus === "not_found" && refUsername.length >= 3
                        ? "border-amber-500/40"
                        : focusedField === "ref"
                        ? "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
                        : "border-white/[0.06] hover:border-white/[0.10]"
                    }`}
                  >
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400/25" />
                    <input
                      type="text"
                      value={refUsername}
                      onChange={(e) => setRefUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      onFocus={() => setFocusedField("ref")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="usuario_referidor"
                      autoComplete="off"
                      className="w-full pl-11 pr-11 py-3.5 bg-white/[0.02] text-white text-sm font-mono placeholder:text-violet-400/20 focus:outline-none rounded-2xl"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {refStatus === "checking" && (
                        <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                      )}
                      {refStatus === "found" && <Check className="w-4 h-4 text-emerald-400" />}
                      {refStatus === "not_found" && refUsername.length >= 3 && <X className="w-4 h-4 text-amber-400" />}
                    </div>
                  </div>
                  {refStatus === "found" && (
                    <p className="mt-1 text-[10px] text-emerald-400">Referido por: {refName}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="premium-submit-btn group relative w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-500 disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Crear cuenta y continuar
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-violet-300/30">
                ¿Ya tienes cuenta?{" "}
                <a href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Inicia sesión
                </a>
              </p>

              <p className="mt-6 text-center text-[10px] text-violet-300/10 leading-relaxed">
                Al registrarte aceptas nuestros términos y política de privacidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  focusedField,
  fieldKey,
  children,
}: {
  label: string
  focusedField: string | null
  fieldKey: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-violet-200/60 mb-2 ml-0.5">{label}</label>
      <div
        className={`relative rounded-xl border transition-all duration-300 ${
          focusedField === fieldKey
            ? "border-violet-500/40 shadow-[0_0_0_3px_rgba(139,92,246,0.06)]"
            : "border-white/[0.06] hover:border-white/[0.10]"
        }`}
      >
        {children}
      </div>
    </div>
  )
}
