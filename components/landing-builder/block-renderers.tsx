"use client"

import { useState, useEffect } from "react"
import type { LandingBlock, LandingTheme } from "@/lib/landing-builder-types"
import {
  Sparkles, AlertTriangle, Clock, TrendingDown, Frown,
  Rocket, Target, BarChart3, Shield, Gift, Star,
  MessageSquare, HelpCircle, Play, ChevronDown, ChevronUp, Check,
  Heart, MessageCircle, Share2, Search, Crown, Trophy, Award, TrendingUp, Users,
  ChevronRight
} from "lucide-react"
import { WhatsAppFinal } from "@/components/experiences/exp8-whatsapp-final"

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, AlertTriangle, Clock, TrendingDown, Frown,
  Rocket, Target, BarChart: BarChart3, Shield, Gift, Star,
  MessageSquare, HelpCircle, Play, ChevronDown, ChevronUp, Check,
}

function getIcon(name: string) {
  return ICON_MAP[name] ?? Sparkles
}

function themeRadius(br: string) {
  const map: Record<string, string> = { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem", full: "9999px" }
  return map[br] ?? "0.75rem"
}

// --- HERO ---
function HeroBlock({ props, theme, onUpdate }: { props: Record<string, unknown>; theme: LandingTheme; onUpdate?: (key: string, value: any) => void }) {
  const p = props as { title: string; subtitle: string; ctaText: string; badgeText: string; backgroundStyle: string; alignment: string }
  const isCenter = p.alignment === "center"
  return (
    <section
      className="relative overflow-hidden px-6 py-20"
      style={{
        background: p.backgroundStyle === "gradient"
          ? `linear-gradient(135deg, ${theme.backgroundColor}, ${theme.primaryColor}33)`
          : theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className={`relative z-10 mx-auto max-w-3xl ${isCenter ? "text-center" : "text-left"}`}>
        {p.badgeText && (
          <span
            className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
            style={{ background: `${theme.primaryColor}22`, color: theme.accentColor, border: `1px solid ${theme.accentColor}44` }}
          >
            {p.badgeText}
          </span>
        )}
        <h1
          className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl outline-none focus:ring-2 focus:ring-primary/20 rounded-md transition-all px-1 -mx-1"
          style={{ color: theme.textColor }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdate?.("title", e.currentTarget.textContent)}
        >
          {p.title}
        </h1>
        <p
          className="mb-8 text-lg opacity-80 outline-none focus:ring-2 focus:ring-primary/20 rounded-md transition-all px-1 -mx-1"
          style={{ color: theme.textColor }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdate?.("subtitle", e.currentTarget.textContent)}
        >
          {p.subtitle}
        </p>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold shadow-lg transition-transform hover:scale-105"
          style={{ background: theme.primaryColor, color: "#fff", borderRadius: themeRadius(theme.borderRadius) }}
        >
          {p.ctaText}
        </button>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: `radial-gradient(circle at 50% 0%, ${theme.primaryColor}55, transparent 70%)` }}
      />
    </section>
  )
}

// --- PROBLEM ---
function ProblemBlock({ props, theme, onUpdate }: { props: Record<string, unknown>; theme: LandingTheme; onUpdate?: (key: string, value: any) => void }) {
  const p = props as { sectionTitle: string; painPoints: Array<{ icon: string; text: string }>; accentColor: string }
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-3xl">
        <h2
          className="mb-10 text-center text-3xl font-bold outline-none focus:ring-2 focus:ring-primary/20 rounded-md transition-all px-1 -mx-1"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdate?.("sectionTitle", e.currentTarget.textContent)}
        >
          {p.sectionTitle}
        </h2>
        <div className="flex flex-col gap-4">
          {p.painPoints.map((pp, i) => {
            const Icon = getIcon(pp.icon)
            return (
              <div key={i} className="flex items-start gap-4 rounded-xl border p-5"
                style={{ borderColor: `${p.accentColor || theme.accentColor}33`, background: `${p.accentColor || theme.accentColor}08`, borderRadius: themeRadius(theme.borderRadius) }}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: p.accentColor || theme.accentColor }} />
                <span
                  className="text-base flex-1 outline-none focus:ring-2 focus:ring-primary/20 rounded-md transition-all px-1 -mx-1"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const next = [...p.painPoints]
                    next[i] = { ...next[i], text: e.currentTarget.textContent || "" }
                    onUpdate?.("painPoints", next)
                  }}
                >
                  {pp.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// --- BENEFITS ---
function BenefitsBlock({ props, theme, onUpdate }: { props: Record<string, unknown>; theme: LandingTheme; onUpdate?: (key: string, value: any) => void }) {
  const p = props as { sectionTitle: string; benefits: Array<{ icon: string; title: string; description: string }>; layout: string }
  const isGrid = p.layout === "grid"
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-4xl">
        <h2
          className="mb-10 text-center text-3xl font-bold outline-none focus:ring-2 focus:ring-primary/20 rounded-md transition-all px-1 -mx-1"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdate?.("sectionTitle", e.currentTarget.textContent)}
        >
          {p.sectionTitle}
        </h2>
        <div className={isGrid ? "grid grid-cols-1 gap-6 md:grid-cols-2" : "flex flex-col gap-4"}>
          {p.benefits.map((b, i) => {
            const Icon = getIcon(b.icon)
            return (
              <div key={i} className="rounded-xl border p-6"
                style={{ borderColor: `${theme.primaryColor}22`, background: `${theme.primaryColor}08`, borderRadius: themeRadius(theme.borderRadius) }}
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `${theme.primaryColor}22` }}>
                  <Icon className="h-5 w-5" style={{ color: theme.primaryColor }} />
                </div>
                <h3 className="mb-1 text-lg font-semibold">{b.title}</h3>
                <p className="text-sm opacity-70">{b.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// --- TESTIMONIALS ---
function TestimonialsBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { sectionTitle: string; testimonials: Array<{ name: string; text: string; label: string }> }
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-center text-3xl font-bold">{p.sectionTitle}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {p.testimonials.map((t, i) => (
            <div key={i} className="rounded-xl border p-6"
              style={{ borderColor: `${theme.primaryColor}22`, background: `${theme.primaryColor}06`, borderRadius: themeRadius(theme.borderRadius) }}
            >
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-current" style={{ color: theme.accentColor }} />
                ))}
              </div>
              <p className="mb-4 text-sm italic opacity-80">{`"${t.text}"`}</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs opacity-60">{t.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- CTA ---
function CtaBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { title: string; description: string; originalPrice: string; offerPrice: string; buttonText: string; urgencyText: string; features: string[] }
  return (
    <section className="px-6 py-16" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}11, ${theme.accentColor}11)`, color: theme.textColor }}>
      <div className="mx-auto max-w-2xl rounded-2xl border p-8 text-center"
        style={{ borderColor: `${theme.primaryColor}33`, background: `${theme.backgroundColor}cc`, borderRadius: themeRadius(theme.borderRadius) }}
      >
        {p.urgencyText && (
          <span className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "#ef444422", color: "#ef4444" }}>
            {p.urgencyText}
          </span>
        )}
        <h2 className="mb-3 text-3xl font-bold">{p.title}</h2>
        <p className="mb-6 opacity-70">{p.description}</p>
        <div className="mb-6 flex items-center justify-center gap-3">
          {p.originalPrice && (
            <span className="text-xl line-through opacity-40">{p.originalPrice}</span>
          )}
          <span className="text-4xl font-bold" style={{ color: theme.primaryColor }}>{p.offerPrice}</span>
        </div>
        {p.features && p.features.length > 0 && (
          <ul className="mb-6 inline-flex flex-col gap-2 text-left text-sm">
            {p.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4" style={{ color: theme.primaryColor }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
        <div>
          <button
            className="w-full rounded-lg px-8 py-4 text-lg font-bold shadow-lg transition-transform hover:scale-105 md:w-auto"
            style={{ background: theme.primaryColor, color: "#fff", borderRadius: themeRadius(theme.borderRadius) }}
          >
            {p.buttonText}
          </button>
        </div>
      </div>
    </section>
  )
}

// --- FAQ ---
function FaqBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { sectionTitle: string; questions: Array<{ question: string; answer: string }>; style: string }
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-bold">{p.sectionTitle}</h2>
        <div className="flex flex-col gap-3">
          {p.questions.map((q, i) => (
            <div key={i} className="rounded-xl border"
              style={{ borderColor: `${theme.primaryColor}22`, borderRadius: themeRadius(theme.borderRadius) }}
            >
              <button
                className="flex w-full items-center justify-between p-5 text-left text-base font-medium"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{q.question}</span>
                {open === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>
              {open === i && (
                <div className="border-t px-5 pb-5 pt-3 text-sm opacity-70"
                  style={{ borderColor: `${theme.primaryColor}15` }}>
                  {q.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- COUNTDOWN ---
function CountdownBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { targetDate: string; title: string; subtitle: string; style: string }
  const [time, setTime] = useState({ days: 0, hrs: 0, min: 0, sec: 0 })

  useEffect(() => {
    function calc() {
      const diff = new Date(p.targetDate).getTime() - Date.now()
      if (diff <= 0) return { days: 0, hrs: 0, min: 0, sec: 0 }
      return {
        days: Math.floor(diff / 86400000),
        hrs: Math.floor((diff / 3600000) % 24),
        min: Math.floor((diff / 60000) % 60),
        sec: Math.floor((diff / 1000) % 60),
      }
    }
    setTime(calc())
    const interval = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(interval)
  }, [p.targetDate])

  const units = [
    { label: "Dias", value: time.days },
    { label: "Horas", value: time.hrs },
    { label: "Min", value: time.min },
    { label: "Seg", value: time.sec },
  ]

  return (
    <section className="px-6 py-16 text-center" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <h2 className="mb-2 text-3xl font-bold">{p.title}</h2>
      <p className="mb-8 opacity-70">{p.subtitle}</p>
      <div className="mx-auto flex max-w-md items-center justify-center gap-3">
        {units.map((u) => (
          <div key={u.label} className="flex flex-1 flex-col items-center rounded-xl border p-4"
            style={{ borderColor: `${theme.primaryColor}33`, background: `${theme.primaryColor}11`, borderRadius: themeRadius(theme.borderRadius) }}
          >
            <span className="text-3xl font-bold" style={{ color: theme.primaryColor }}>
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wider opacity-60">{u.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// --- FORM ---
function FormBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { title: string; subtitle: string; fields: Array<{ name: string; type: string; label: string; required: boolean }>; buttonText: string; successMessage: string }
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")

    try {
      // Send to CRM API
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre || formData.name || "Lead del Builder",
          correo: formData.email || "desconocido@magic.com",
          whatsapp: formData.whatsapp || formData.telefono || formData.tel || formData.phone || "",
          fuente: "Magic Builder",
          embudo_id: "magic-builder",
          ref: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') || '' : ''
        }),
      })

      if (res.ok) {
        setStatus("success")
        setFormData({})
      } else {
        setStatus("error")
      }
    } catch (err) {
      console.error("Error submitting form:", err)
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
        <div className="mx-auto max-w-lg rounded-2xl border p-12 text-center"
          style={{ borderColor: `${theme.primaryColor}44`, background: `${theme.primaryColor}11`, borderRadius: themeRadius(theme.borderRadius) }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
            <Check className="h-8 w-8 text-emerald-500" strokeWidth={3} />
          </div>
          <h2 className="mb-2 text-2xl font-bold">{p.successMessage || "¡Gracias por registrarte!"}</h2>
          <p className="text-sm opacity-70">En breve nos pondremos en contacto contigo.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-lg rounded-2xl border p-8"
        style={{ borderColor: `${theme.primaryColor}22`, background: `${theme.primaryColor}06`, borderRadius: themeRadius(theme.borderRadius) }}
      >
        <h2 className="mb-2 text-center text-2xl font-bold">{p.title}</h2>
        <p className="mb-6 text-center text-sm opacity-70">{p.subtitle}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {p.fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {f.label}{f.required && <span style={{ color: theme.accentColor }}> *</span>}
              </label>
              <input
                type={f.type}
                name={f.name}
                required={f.required}
                placeholder={f.label}
                value={formData[f.name] || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, [f.name]: e.target.value }))}
                className="rounded-lg border bg-black/20 backdrop-blur-md px-4 py-3 text-sm outline-none transition-all focus:border-current focus:ring-2 focus:ring-primary/20"
                style={{ borderColor: `${theme.primaryColor}33`, color: theme.textColor, borderRadius: themeRadius(theme.borderRadius) }}
              />
            </div>
          ))}

          {status === "error" && (
            <p className="text-xs text-red-400 font-medium text-center">Hubo un error. Intentalo de nuevo.</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-2 group relative flex items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-4 font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            style={{ background: theme.primaryColor, color: "#fff", borderRadius: themeRadius(theme.borderRadius) }}
          >
            {status === "submitting" ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span>{p.buttonText}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}

// --- VIDEO ---
function VideoBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { url: string; title: string; description: string; layout: string }
  const isFull = p.layout === "full"
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className={`mx-auto ${isFull ? "max-w-5xl" : "max-w-3xl"}`}>
        {p.title && <h2 className="mb-2 text-center text-3xl font-bold">{p.title}</h2>}
        {p.description && <p className="mb-8 text-center opacity-70">{p.description}</p>}
        <div className="relative overflow-hidden rounded-2xl border"
          style={{ borderColor: `${theme.primaryColor}22`, borderRadius: themeRadius(theme.borderRadius), aspectRatio: "16/9" }}
        >
          <iframe
            src={p.url}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={p.title}
          />
        </div>
      </div>
    </section>
  )
}

// --- GALLERY ---
function GalleryBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { sectionTitle: string; images: Array<{ url: string; alt: string }>; columns: number }
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center text-3xl font-bold">{p.sectionTitle}</h2>
        <div className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${p.columns}, minmax(0, 1fr))` }}
        >
          {p.images.map((img, i) => (
            <div key={i} className="overflow-hidden rounded-xl border"
              style={{ borderColor: `${theme.primaryColor}22`, borderRadius: themeRadius(theme.borderRadius) }}
            >
              <img src={img.url} alt={img.alt} className="h-auto w-full object-cover" crossOrigin="anonymous" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- COMMUNITY ---
function CommunityBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as {
    sectionTitle: string; description: string; communityName: string; memberCount: string
    categories: Array<{ name: string; emoji: string }>
    posts: Array<{ author: string; content: string; timeAgo: string; likes: number; comments: number; category: string; badge?: string }>
    leaderboard: Array<{ name: string; points: number; level: number; badge: string }>
    showLeaderboard: boolean; showCategories: boolean; layout: "feed" | "split"
  }
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const radius = themeRadius(theme.borderRadius)

  const AVATAR_COLORS = [
    ["#6366f1", "#8b5cf6"], ["#ec4899", "#f43f5e"], ["#14b8a6", "#06b6d4"],
    ["#f59e0b", "#f97316"], ["#10b981", "#34d399"], ["#8b5cf6", "#a78bfa"],
  ]

  const BADGE_STYLES: Record<string, { bg: string; text: string; glow: string }> = {
    "Diamante": { bg: "linear-gradient(135deg, #818cf8, #6366f1, #4f46e5)", text: "#ffffff", glow: "0 0 12px #6366f133" },
    "Oro": { bg: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)", text: "#ffffff", glow: "0 0 12px #f59e0b33" },
    "Plata": { bg: "linear-gradient(135deg, #94a3b8, #64748b, #475569)", text: "#ffffff", glow: "0 0 12px #64748b33" },
    "Bronce": { bg: "linear-gradient(135deg, #d97706, #b45309, #92400e)", text: "#ffffff", glow: "0 0 12px #d9770633" },
    "Top Contributor": { bg: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`, text: "#ffffff", glow: `0 0 12px ${theme.primaryColor}33` },
    "Mentor": { bg: `linear-gradient(135deg, #10b981, #059669)`, text: "#ffffff", glow: "0 0 12px #10b98133" },
  }

  function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  }

  function getAvatarColor(name: string): string[] {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  }

  function toggleLike(index: number) {
    setLikedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const filteredPosts = activeCategory === "Todos" ? p.posts : p.posts.filter((post) => post.category === activeCategory)
  const isSplit = p.layout === "split" && p.showLeaderboard

  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold">{p.sectionTitle}</h2>
          <p className="mx-auto max-w-2xl opacity-70">{p.description}</p>
        </div>

        {/* Community Bar */}
        <div
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4"
          style={{
            borderColor: `${theme.primaryColor}20`,
            background: `${theme.primaryColor}06`,
            borderRadius: radius,
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
            >
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{p.communityName}</h3>
              <p className="text-xs opacity-60">{p.memberCount} miembros activos</p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2"
            style={{ borderColor: `${theme.primaryColor}20`, background: `${theme.backgroundColor}80` }}
          >
            <Search className="h-3.5 w-3.5 opacity-40" />
            <span className="text-xs opacity-40">Buscar en la comunidad...</span>
          </div>
        </div>

        {/* Categories */}
        {p.showCategories && p.categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("Todos")}
              className="rounded-full px-4 py-2 text-xs font-medium transition-all"
              style={{
                background: activeCategory === "Todos" ? theme.primaryColor : `${theme.primaryColor}10`,
                color: activeCategory === "Todos" ? "#ffffff" : theme.textColor,
                borderRadius: "9999px",
              }}
            >
              Todos
            </button>
            {p.categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className="rounded-full px-4 py-2 text-xs font-medium transition-all"
                style={{
                  background: activeCategory === cat.name ? theme.primaryColor : `${theme.primaryColor}10`,
                  color: activeCategory === cat.name ? "#ffffff" : theme.textColor,
                  borderRadius: "9999px",
                }}
              >
                <span className="mr-1.5">{cat.emoji}</span>{cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className={isSplit ? "grid grid-cols-1 gap-6 lg:grid-cols-3" : ""}>
          {/* Feed */}
          <div className={isSplit ? "lg:col-span-2" : ""}>
            {/* New Post Box */}
            <div
              className="mb-4 flex items-center gap-3 rounded-xl border p-4"
              style={{ borderColor: `${theme.primaryColor}15`, background: `${theme.primaryColor}04`, borderRadius: radius }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
              >
                T
              </div>
              <div
                className="flex-1 rounded-lg border px-3 py-2 text-xs opacity-50"
                style={{ borderColor: `${theme.primaryColor}15`, background: `${theme.backgroundColor}60` }}
              >
                Comparte algo con la comunidad...
              </div>
            </div>

            {/* Posts */}
            <div className="flex flex-col gap-4">
              {filteredPosts.map((post, i) => {
                const colors = getAvatarColor(post.author)
                const isLiked = likedPosts.has(i)
                return (
                  <div
                    key={i}
                    className="group rounded-xl border p-5 transition-all duration-200"
                    style={{
                      borderColor: `${theme.primaryColor}12`,
                      background: `${theme.primaryColor}03`,
                      borderRadius: radius,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${theme.primaryColor}30`
                      e.currentTarget.style.boxShadow = `0 4px 20px ${theme.primaryColor}08`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${theme.primaryColor}12`
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    {/* Post Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                        >
                          {getInitials(post.author)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{post.author}</span>
                            {post.badge && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                  background: BADGE_STYLES[post.badge]?.bg ?? `${theme.primaryColor}20`,
                                  color: BADGE_STYLES[post.badge]?.text ?? theme.primaryColor,
                                  boxShadow: BADGE_STYLES[post.badge]?.glow ?? "none",
                                }}
                              >
                                {post.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] opacity-50">
                            <span>{post.timeAgo}</span>
                            <span>en</span>
                            <span className="font-medium" style={{ color: theme.primaryColor, opacity: 0.8 }}>
                              {post.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="mb-4 text-sm leading-relaxed opacity-85">{post.content}</p>

                    {/* Reactions Bar */}
                    <div
                      className="flex items-center gap-1 border-t pt-3"
                      style={{ borderColor: `${theme.primaryColor}10` }}
                    >
                      <button
                        onClick={() => toggleLike(i)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all"
                        style={{
                          background: isLiked ? `${theme.primaryColor}15` : "transparent",
                          color: isLiked ? theme.primaryColor : `${theme.textColor}88`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${theme.primaryColor}10` }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isLiked ? `${theme.primaryColor}15` : "transparent" }}
                      >
                        <Heart
                          className="h-3.5 w-3.5 transition-transform"
                          style={{
                            fill: isLiked ? theme.primaryColor : "none",
                            transform: isLiked ? "scale(1.1)" : "scale(1)",
                          }}
                        />
                        <span className="font-medium">{isLiked ? post.likes + 1 : post.likes}</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all"
                        style={{ color: `${theme.textColor}88` }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${theme.primaryColor}10` }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="font-medium">{post.comments}</span>
                      </button>
                      <button
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all"
                        style={{ color: `${theme.textColor}88` }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${theme.primaryColor}10` }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="font-medium">Compartir</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          {isSplit && (
            <div className="lg:col-span-1">
              <div
                className="sticky top-6 rounded-xl border p-5"
                style={{
                  borderColor: `${theme.primaryColor}15`,
                  background: `${theme.primaryColor}04`,
                  borderRadius: radius,
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4" style={{ color: theme.accentColor }} />
                  <h4 className="text-sm font-bold">Leaderboard</h4>
                </div>
                <div className="flex flex-col gap-3">
                  {p.leaderboard.map((member, i) => {
                    const colors = getAvatarColor(member.name)
                    const maxPoints = p.leaderboard[0]?.points ?? 1
                    const progress = (member.points / maxPoints) * 100
                    const RankIcon = i === 0 ? Crown : i === 1 ? Award : i === 2 ? TrendingUp : Star
                    const rankColors = ["#f59e0b", "#94a3b8", "#d97706", `${theme.primaryColor}88`, `${theme.primaryColor}66`]
                    return (
                      <div
                        key={i}
                        className="group flex items-center gap-3 rounded-lg p-2.5 transition-all"
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${theme.primaryColor}08` }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                      >
                        {/* Rank */}
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                          {i < 3 ? (
                            <RankIcon className="h-4 w-4" style={{ color: rankColors[i] }} />
                          ) : (
                            <span className="text-xs font-bold opacity-40">#{i + 1}</span>
                          )}
                        </div>
                        {/* Avatar */}
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                        >
                          {getInitials(member.name)}
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-semibold">{member.name}</span>
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{
                                background: BADGE_STYLES[member.badge]?.bg ?? `${theme.primaryColor}20`,
                                color: BADGE_STYLES[member.badge]?.text ?? theme.primaryColor,
                                boxShadow: BADGE_STYLES[member.badge]?.glow ?? "none",
                              }}
                            >
                              {member.badge}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div
                              className="h-1.5 flex-1 overflow-hidden rounded-full"
                              style={{ background: `${theme.primaryColor}15` }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                  background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor})`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-medium opacity-60">{member.points.toLocaleString()} pts</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Stats */}
                <div
                  className="mt-5 grid grid-cols-2 gap-3 border-t pt-4"
                  style={{ borderColor: `${theme.primaryColor}10` }}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: theme.primaryColor }}>{p.memberCount}</p>
                    <p className="text-[10px] opacity-50">Miembros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: theme.accentColor }}>{p.posts.length * 47}</p>
                    <p className="text-[10px] opacity-50">Posts hoy</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// --- WHATSAPP FINAL ---
function WhatsAppBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor }}>
      <div className="mx-auto max-w-[400px] overflow-hidden rounded-[2rem] border-8 border-black shadow-2xl">
        <div className="h-[600px] overflow-hidden overflow-y-auto">
          <WhatsAppFinal
            onContinue={() => { console.log("Continue clicked") }}
            title={props.title as string}
            customMessages={props.messages as any[]}
          />
        </div>
      </div>
    </section>
  )
}

// --- Main renderer ---
export function BlockRenderer({
  block,
  theme,
  onUpdateProp
}: {
  block: LandingBlock;
  theme: LandingTheme;
  onUpdateProp?: (id: string, key: string, value: any) => void
}) {
  const map: Record<string, React.ComponentType<{
    props: Record<string, unknown>;
    theme: LandingTheme;
    onUpdate?: (key: string, value: any) => void
  }>> = {
    hero: HeroBlock,
    problem: ProblemBlock,
    benefits: BenefitsBlock,
    testimonials: TestimonialsBlock,
    cta: CtaBlock,
    faq: FaqBlock,
    countdown: CountdownBlock,
    form: FormBlock,
    video: VideoBlock,
    gallery: GalleryBlock,
    community: CommunityBlock,
    whatsapp_final: WhatsAppBlock,
  }

  const Component = map[block.type]
  if (!Component) return null
  return (
    <Component
      props={block.props}
      theme={theme}
      onUpdate={onUpdateProp ? (key, val) => onUpdateProp(block.id, key, val) : undefined}
    />
  )
}
