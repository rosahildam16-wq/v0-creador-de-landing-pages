"use client"

import { useState, useEffect } from "react"
import type { LandingBlock, LandingTheme } from "@/lib/landing-builder-types"
import {
  Sparkles, AlertTriangle, Clock, TrendingDown, Frown,
  Rocket, Target, BarChart3, Shield, Gift, Star,
  MessageSquare, HelpCircle, Play, ChevronDown, ChevronUp, Check,
} from "lucide-react"

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
function HeroBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
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
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl" style={{ color: theme.textColor }}>
          {p.title}
        </h1>
        <p className="mb-8 text-lg opacity-80" style={{ color: theme.textColor }}>
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
function ProblemBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { sectionTitle: string; painPoints: Array<{ icon: string; text: string }>; accentColor: string }
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-bold">{p.sectionTitle}</h2>
        <div className="flex flex-col gap-4">
          {p.painPoints.map((pp, i) => {
            const Icon = getIcon(pp.icon)
            return (
              <div key={i} className="flex items-start gap-4 rounded-xl border p-5"
                style={{ borderColor: `${p.accentColor || theme.accentColor}33`, background: `${p.accentColor || theme.accentColor}08`, borderRadius: themeRadius(theme.borderRadius) }}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: p.accentColor || theme.accentColor }} />
                <span className="text-base">{pp.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// --- BENEFITS ---
function BenefitsBlock({ props, theme }: { props: Record<string, unknown>; theme: LandingTheme }) {
  const p = props as { sectionTitle: string; benefits: Array<{ icon: string; title: string; description: string }>; layout: string }
  const isGrid = p.layout === "grid"
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-center text-3xl font-bold">{p.sectionTitle}</h2>
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
  const p = props as { title: string; subtitle: string; fields: Array<{ name: string; type: string; label: string; required: boolean }>; buttonText: string }
  return (
    <section className="px-6 py-16" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <div className="mx-auto max-w-lg rounded-2xl border p-8"
        style={{ borderColor: `${theme.primaryColor}22`, background: `${theme.primaryColor}06`, borderRadius: themeRadius(theme.borderRadius) }}
      >
        <h2 className="mb-2 text-center text-2xl font-bold">{p.title}</h2>
        <p className="mb-6 text-center text-sm opacity-70">{p.subtitle}</p>
        <div className="flex flex-col gap-4">
          {p.fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{f.label}{f.required && <span style={{ color: theme.accentColor }}> *</span>}</label>
              <input
                type={f.type}
                placeholder={f.label}
                className="rounded-lg border bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-current"
                style={{ borderColor: `${theme.primaryColor}33`, color: theme.textColor, borderRadius: themeRadius(theme.borderRadius) }}
                readOnly
              />
            </div>
          ))}
          <button
            className="mt-2 rounded-lg px-6 py-3 font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ background: theme.primaryColor, color: "#fff", borderRadius: themeRadius(theme.borderRadius) }}
          >
            {p.buttonText}
          </button>
        </div>
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

// --- Main renderer ---
export function BlockRenderer({ block, theme }: { block: LandingBlock; theme: LandingTheme }) {
  const map: Record<string, React.ComponentType<{ props: Record<string, unknown>; theme: LandingTheme }>> = {
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
  }

  const Component = map[block.type]
  if (!Component) return null
  return <Component props={block.props} theme={theme} />
}
