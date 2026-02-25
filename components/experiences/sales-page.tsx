"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowRight,
  Phone,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  Users,
  Shield,
  Sparkles,
  ChevronDown,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiagnosticQuiz } from "./diagnostic-quiz"

interface Props {
  leadId?: string | null
  onTrack?: () => void
}

export function SalesPage({ leadId, onTrack }: Props) {
  const [isSticky, setIsSticky] = useState(false)
  const [tracked, setTracked] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)
  const [bookingSubmitted, setBookingSubmitted] = useState(false)

  // Countdown timer - 1 hour
  const [timeLeft, setTimeLeft] = useState(3600)

  useEffect(() => {
    // Initialize from sessionStorage on client
    const saved = sessionStorage.getItem("sales-countdown-end")
    if (saved) {
      const remaining = Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000))
      setTimeLeft(remaining)
    } else {
      const end = Date.now() + 3600 * 1000
      sessionStorage.setItem("sales-countdown-end", end.toString())
      setTimeLeft(3600)
    }
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  // Track that the user reached the sales page
  useEffect(() => {
    if (!tracked && onTrack) {
      onTrack()
      setTracked(true)
    }
  }, [tracked, onTrack])

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 300)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToCTA = () => {
    document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" })
  }

  const whatsappNumber = "15558865145"
  const whatsappMessage = encodeURIComponent("Hola, acabo de completar el diagnóstico y quiero solicitar mi llamada de admisión.")
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  if (bookingSubmitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10">
          <CheckCircle2 className="h-10 w-10 text-[#25D366]" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-foreground text-balance">
          {'Has pasado el diagnóstico!'}
        </h1>
        <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {'Felicidades, calificas para una llamada de admisión. Escríbenos directamente por WhatsApp para agendar tu llamada.'}
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 flex w-full max-w-xs items-center justify-center gap-3 rounded-xl bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:bg-[#20BD5A] hover:shadow-xl hover:shadow-[#25D366]/30 active:scale-[0.98]"
        >
          <MessageCircle className="h-5 w-5" />
          SOLICITAR LLAMADA POR WHATSAPP
        </a>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">{'Mientras tanto, prepara tus preguntas.'}</p>
          <p className="mt-2 text-xs text-muted-foreground">{'Esta llamada es para ti. Aprovéchala.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full bg-background">
      {/* ── COUNTDOWN BANNER ── */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-destructive px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 animate-pulse text-destructive-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-destructive-foreground/80">
            Tu acceso expira en
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex h-7 min-w-[28px] items-center justify-center rounded bg-destructive-foreground/15 px-1.5 font-mono text-sm font-bold tabular-nums text-destructive-foreground">
            {String(minutes).padStart(2, "0")}
          </span>
          <span className="text-sm font-bold text-destructive-foreground animate-pulse">:</span>
          <span className="flex h-7 min-w-[28px] items-center justify-center rounded bg-destructive-foreground/15 px-1.5 font-mono text-sm font-bold tabular-nums text-destructive-foreground">
            {String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-16">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3 w-3" />
            Solo por invitación
          </span>

          {/* Animated Metallic Code Card */}
          <div className="sales-code-card relative mb-8 w-72 overflow-hidden rounded-2xl border border-primary/20 p-5"
            style={{
              background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.06) 40%, hsl(var(--card)) 60%, hsl(var(--primary) / 0.04) 100%)",
            }}
          >
            {/* Shimmer sweep */}
            <div className="sales-shimmer pointer-events-none absolute inset-0" />
            {/* Holographic edge glow */}
            <div className="pointer-events-none absolute -inset-px rounded-2xl"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.3) 0%, transparent 30%, transparent 70%, hsl(var(--primary) / 0.15) 100%)",
              }}
            />

            <div className="relative z-10">
              {/* Top row: chip + label */}
              <div className="mb-4 flex items-center justify-between">
                {/* Chip icon */}
                <div className="flex h-9 w-12 items-center justify-center rounded-md border border-primary/30"
                  style={{
                    background: "linear-gradient(145deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
                  }}
                >
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="text-primary">
                    <rect x="0.5" y="0.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="0.8" />
                    <line x1="6" y1="0.5" x2="6" y2="13.5" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
                    <line x1="12" y1="0.5" x2="12" y2="13.5" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
                    <line x1="0.5" y1="5" x2="17.5" y2="5" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
                    <line x1="0.5" y1="9" x2="17.5" y2="9" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-sm shadow-primary/50" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/70">Acceso privado</span>
                </div>
              </div>

              {/* Code digits - animated reveal */}
              <div className="mb-3 flex items-center justify-center gap-2 font-mono">
                {["R3S", "3T", "VIP", "24"].map((group, i) => (
                  <span
                    key={group}
                    className="sales-code-digit inline-flex items-center justify-center rounded-md border border-primary/15 px-2.5 py-1.5 text-[15px] font-bold tracking-[0.15em] text-primary"
                    style={{
                      background: "linear-gradient(180deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))",
                      animationDelay: `${0.4 + i * 0.15}s`,
                    }}
                  >
                    {group}
                  </span>
                ))}
              </div>

              {/* Separator line */}
              <div className="mb-3 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)" }} />

              {/* Bottom barcode + text */}
              <div className="flex items-end justify-between">
                <div className="flex items-end gap-[1.5px]">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className="sales-barcode-line rounded-sm bg-primary/25"
                      style={{
                        width: i % 4 === 0 ? "2px" : "1px",
                        height: `${6 + Math.sin(i * 0.7) * 4}px`,
                        animationDelay: `${0.8 + i * 0.02}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  Uso exclusivo
                </span>
              </div>
            </div>
          </div>

          <h1 className="mb-6 text-center text-[28px] font-bold leading-[1.15] tracking-tight text-foreground text-balance">
            {'Solicita tu llamada de admisión'}
          </h1>

          <p className="mb-10 max-w-[320px] text-center text-[15px] leading-relaxed text-muted-foreground">
            {'Has completado todas las fases. Ahora es el momento de hablar contigo directamente.'}
          </p>

          <Button
            onClick={() => setQuizOpen(true)}
            className="w-full max-w-xs gap-2 bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Calendar className="h-5 w-5" />
            SOLICITAR MI LLAMADA
          </Button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
            {'Gratuita. Sin compromiso. 100% personalizada.'}
          </p>
        </div>
      </section>

      {/* ── WHAT YOU PROVED ── */}
      <section className="border-t border-border px-6 py-14">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Lo que demostraste
        </span>
        <h2 className="mb-8 text-xl font-bold text-foreground text-balance">
          {'No cualquiera llega hasta aquí.'}
        </h2>
        <div className="flex flex-col gap-3">
          {[
            "Viste el video completo sin cerrar",
            "Contestaste la llamada sin saber quién era",
            "Respondiste el quiz con honestidad",
            "Superaste el terminal sin rendirte",
            "Hiciste login cuando otros dudan",
            "Exploraste el feed hasta el final",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-foreground/80">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT THE CALL IS ── */}
      <section className="border-t border-border bg-card/50 px-6 py-14">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          La llamada
        </span>
        <h2 className="mb-8 text-xl font-bold text-foreground text-balance">
            {'No es una llamada de ventas. Es una llamada de admisión.'}
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              icon: Phone,
              title: "Conversación 1 a 1",
              desc: "Hablas directamente con alguien del equipo. Sin bots, sin grabaciones.",
            },
            {
              icon: Clock,
              title: "15-20 minutos",
              desc: "Lo suficiente para entender tu situación y ver si encajas en el programa.",
            },
            {
              icon: Users,
              title: "Evaluación mutua",
              desc: "Tú nos evalúas a nosotros tanto como nosotros a ti. Sin presión.",
            },
            {
              icon: Shield,
              title: "Confidencial",
              desc: "Todo lo que compartas se queda entre nosotros. Punto.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-lg border border-border bg-background p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="border-t border-border px-6 py-14">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Testimonios
        </span>
        <h2 className="mb-8 text-xl font-bold text-foreground text-balance">
          {'Lo que dicen quienes tomaron la llamada.'}
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              name: "Carlos M.",
              loc: "Ciudad de México",
              text: "Pensé que sería otra llamada comercial. Me equivoqué. Me hicieron preguntas que nadie me había hecho.",
            },
            {
              name: "Valentina R.",
              loc: "Medellín",
              text: "La llamada me aclaró todo. En 15 minutos entendí exactamente qué necesitaba hacer.",
            },
            {
              name: "David L.",
              loc: "Madrid",
              text: "Lo mejor fue la honestidad. Me dijeron que el programa no era para mí en ese momento. Eso me dio más confianza.",
            },
          ].map((review) => (
            <div key={review.name} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-foreground/80">
                {`"${review.text}"`}
              </p>
              <div>
                <p className="text-xs font-semibold text-foreground">{review.name}</p>
                <p className="text-[11px] text-muted-foreground">{review.loc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border bg-card/50 px-6 py-14">
        <h2 className="mb-8 text-xl font-bold text-foreground">Preguntas frecuentes</h2>
        <div className="flex flex-col gap-3">
          {[
            { q: "¿Es gratis la llamada?", a: "Sí. No tiene ningún costo. Es una llamada de evaluación mutua." },
            { q: "¿Me van a vender algo?", a: "No en la llamada. Solo evaluamos si eres candidato. Si lo eres, te explicamos las opciones." },
            { q: "¿Cuánto dura?", a: "Entre 15 y 20 minutos. Directo al grano." },
            { q: "¿Qué pasa si no encajo?", a: "Te lo decimos con honestidad y te damos recomendaciones alternativas. Sin resentimientos." },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-lg border border-border bg-background">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-foreground">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── BOOKING FORM ── */}
      <section id="booking-section" className="border-t border-border px-6 py-14">
        <div className="rounded-xl border border-primary/20 bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Solicitar llamada</h2>
              <p className="text-xs text-muted-foreground">Cupos limitados por semana</p>
            </div>
          </div>

          <Button
            onClick={() => setQuizOpen(true)}
            className="w-full gap-2 bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            QUIERO MI LLAMADA DE ADMISIÓN
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* ── FINAL PUSH ── */}
      <section className="border-t border-border px-6 py-14">
        <div className="text-center">
          <h2 className="mb-3 text-xl font-bold text-foreground text-balance">
            {'Llegaste hasta aquí por algo.'}
          </h2>
          <p className="text-base font-medium text-primary">
            {'No dejes que esto quede en "casi".'}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          {'Experiencia Privada \u2014 Todos los derechos reservados'}
        </p>
      </footer>

      {/* ── DIAGNOSTIC QUIZ POPUP ── */}
      <DiagnosticQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onComplete={async () => {
          setQuizOpen(false)
          setQuizPassed(true)
          // Track CTA and submit booking directly (data already collected in quiz exp3)
          if (leadId) {
            try {
              await fetch("/api/tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  lead_id: leadId,
                  step: 8,
                  step_name: "cta_clicked",
                }),
              })
            } catch {}
          }
          setBookingSubmitted(true)
        }}
      />

      {/* ── STICKY CTA ── */}
      {isSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto max-w-md">
            <Button
              onClick={() => setQuizOpen(true)}
              className="w-full gap-2 bg-primary py-5 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Calendar className="h-4 w-4" />
              SOLICITAR LLAMADA
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
