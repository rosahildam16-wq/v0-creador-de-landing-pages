"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ArrowRight,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Cpu,
  Gift,
  Globe,
  Lightbulb,
  MessageSquare,
  Monitor,
  Rocket,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  leadId?: string | null
  onTrack?: () => void
}

/* ── Event config ── */
const EVENT_DATE = new Date("2026-02-23T20:00:00-05:00") // Lunes 23 Feb 2026 8PM COL (UTC-5)
const EVENT_END = new Date("2026-02-23T22:00:00-05:00")

/* ── Real countdown to event date ── */
function useCountdown() {
  const [time, setTime] = useState({ days: 0, hrs: 0, min: 0, sec: 0 })

  useEffect(() => {
    function calc() {
      const now = new Date()
      const diff = EVENT_DATE.getTime() - now.getTime()
      if (diff <= 0) return { days: 0, hrs: 0, min: 0, sec: 0 }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const min = Math.floor((diff / (1000 * 60)) % 60)
      const sec = Math.floor((diff / 1000) % 60)
      return { days, hrs, min, sec }
    }
    setTime(calc())
    const interval = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(interval)
  }, [])

  return time
}

/* ── Typing effect ── */
function useTypingEffect(text: string, speed = 40, delay = 500) {
  const [displayed, setDisplayed] = useState("")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed, started])

  return { displayed, done: displayed.length === text.length }
}

/* ── Intersection Observer for scroll animations ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, inView }
}

/* ── Animated section wrapper ── */
function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`ed-section-enter ${inView ? "ed-section-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ── Feature card ── */
function FeatureCard({ icon: Icon, title, delay = 0 }: { icon: React.ComponentType<{ className?: string }>; title: string; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`ed-feature-card ed-section-enter ${inView ? "ed-section-visible" : ""} flex flex-col items-center gap-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-5 text-center transition-all duration-500`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
        <Icon className="h-6 w-6 text-cyan-400" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
  )
}

/* ── Audience card ── */
function AudienceCard({ icon: Icon, label, delay = 0 }: { icon: React.ComponentType<{ className?: string }>; label: string; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`ed-section-enter ${inView ? "ed-section-visible" : ""} flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4 transition-all duration-300 hover:border-cyan-500/20`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
        <Icon className="h-4 w-4 text-cyan-400" />
      </div>
      <span className="text-sm font-medium text-foreground/80">{label}</span>
    </div>
  )
}

/* ── Bonus card ── */
function BonusCard({ icon: Icon, title, desc, value, delay = 0 }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; value?: string; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`ed-feature-card ed-section-enter ${inView ? "ed-section-visible" : ""} relative overflow-hidden rounded-xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 to-amber-600/5 p-5 transition-all duration-500`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gift ribbon */}
      <div className="absolute -right-6 -top-6 h-12 w-12 rounded-full bg-amber-500/10" />
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <Icon className="h-5 w-5 text-amber-400" />
        </div>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
          Regalo
        </span>
      </div>
      <p className="mb-1 text-sm font-bold text-foreground">{title}</p>
      <p className="text-[12px] leading-relaxed text-[#8892b0]">{desc}</p>
    </div>
  )
}

/* ── Social proof bubble ── */
const FAKE_NAMES = [
  "Maria G.", "Carlos R.", "Andrea L.", "Juan P.", "Sofia M.",
  "Diego H.", "Laura V.", "Pedro S.", "Ana K.", "Miguel T.",
  "Valentina B.", "Santiago F.", "Camila N.", "Andres D.", "Isabella Q.",
  "Felipe O.", "Daniela C.", "Nicolas E.", "Lucia A.", "Mateo J.",
]

function SocialProofBubble() {
  const [visible, setVisible] = useState(false)
  const [person, setPerson] = useState({ name: "", city: "", time: "" })

  useEffect(() => {
    const cities = ["Bogota", "CDMX", "Lima", "Buenos Aires", "Madrid", "Santiago", "Medellin", "Quito", "Miami", "Barcelona"]
    const times = ["hace 2 min", "hace 5 min", "hace 8 min", "hace 12 min", "hace 1 min", "hace 3 min"]

    function show() {
      const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)]
      const city = cities[Math.floor(Math.random() * cities.length)]
      const time = times[Math.floor(Math.random() * times.length)]
      setPerson({ name, city, time })
      setVisible(true)
      setTimeout(() => setVisible(false), 4000)
    }

    const initial = setTimeout(show, 5000)
    const interval = setInterval(show, 12000)
    return () => { clearTimeout(initial); clearInterval(interval) }
  }, [])

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex max-w-[280px] items-center gap-3 rounded-xl border border-cyan-500/15 bg-[#0a1628]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-sm transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
        <Users className="h-4 w-4 text-cyan-400" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-foreground">
          {person.name} <span className="font-normal text-[#8892b0]">se registro</span>
        </p>
        <p className="text-[10px] text-[#8892b0]/70">
          {person.city} · {person.time}
        </p>
      </div>
    </div>
  )
}

/* ── Google Calendar URL builder ── */
function buildGoogleCalendarUrl() {
  const title = encodeURIComponent("Masterclass: Crea tu Esclavo Digital en 24h")
  const details = encodeURIComponent(
    "Masterclass EN VIVO: Aprende a crear contenido infinito, anuncios con IA y tu propio clon digital.\n\nNo faltes - conectate puntual."
  )
  const location = encodeURIComponent("Online - Link en tu email")

  // Google Calendar format: YYYYMMDDTHHMMSSZ (UTC)
  const startUtc = EVENT_DATE.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const endUtc = EVENT_END.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")

  // Reminders: at event time, 2 hours before, 8 hours before (morning)
  // Google Calendar doesn't support multiple reminders via URL, but we set the popup reminder
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}&sf=true&output=xml&reminders=useDefault`
}

/* ===================================================================
   MAIN COMPONENT - ESCLAVO DIGITAL MASTERCLASS LANDING
   =================================================================== */
export function EsclavoDigitalLanding({ leadId, onTrack }: Props) {
  const [tracked, setTracked] = useState(false)
  const countdown = useCountdown()
  const { displayed: heroText, done: heroDone } = useTypingEffect(
    "Crea tu propio esclavo digital en menos de 24 horas",
    35,
    800
  )

  useEffect(() => {
    if (!tracked && onTrack) { onTrack(); setTracked(true) }
  }, [tracked, onTrack])

  const scrollToCTA = () => {
    document.getElementById("ed-cta")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleRegister = useCallback(async () => {
    if (leadId) {
      try {
        await fetch("/api/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadId, step: 4, step_name: "esclavo_digital_mc_register" }),
        })
      } catch { /* don't block */ }
    }
    window.open(buildGoogleCalendarUrl(), "_blank")
  }, [leadId])

  return (
    <div className="ed-landing min-h-dvh w-full bg-[#030812] text-foreground">

      {/* Social proof bubble */}
      <SocialProofBubble />

      {/* ════════════════════════════════════════════════
          HERO - Full Screen Impact
         ════════════════════════════════════════════════ */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5">
        {/* Animated background grid */}
        <div className="ed-grid-bg pointer-events-none absolute inset-0" />

        {/* Glow orbs */}
        <div className="pointer-events-none absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full opacity-20 ed-orb-float-1" style={{ background: "radial-gradient(circle, hsl(185 80% 50%), transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full opacity-15 ed-orb-float-2" style={{ background: "radial-gradient(circle, hsl(260 80% 60%), transparent 70%)" }} />

        {/* Floating code particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {["01", "AI", ">>", "{}", "fn", "10", "//", "=>"].map((char, i) => (
            <span
              key={i}
              className="ed-code-particle absolute font-mono text-[10px] text-cyan-500/20"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
          {/* Badge */}
          <span className="ed-fade-in mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400" style={{ animationDelay: "0.2s" }}>
            <Cpu className="h-3 w-3" />
            Masterclass en vivo
          </span>

          {/* Date badge */}
          <span className="ed-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-[11px] font-bold text-amber-400" style={{ animationDelay: "0.4s" }}>
            <Calendar className="h-3.5 w-3.5" />
            Lunes 23 de Febrero · 8:00 PM COL
          </span>

          {/* Typing headline */}
          <h1 className="ed-fade-in mb-2 min-h-[100px] text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[36px]" style={{ animationDelay: "0.6s" }}>
            <span className="ed-gradient-text">{heroText}</span>
            {!heroDone && <span className="ed-cursor">|</span>}
          </h1>

          {/* Sub */}
          <p className="ed-fade-in mb-4 max-w-[380px] text-[14px] leading-relaxed text-[#8892b0]" style={{ animationDelay: "1.5s" }}>
            Crea contenido infinito, anuncios con inteligencia artificial y tu propio clon digital que produce videos por ti sin grabarte.
          </p>

          {/* Micro text */}
          <p className="ed-fade-in mb-8 max-w-[340px] text-[11px] leading-relaxed text-[#8892b0]/60" style={{ animationDelay: "1.7s" }}>
            Aprende a usar herramientas gratuitas para crear contenido viral en minutos.
          </p>

          {/* Mini countdown in hero */}
          <div className="ed-fade-in mb-8 flex items-center gap-2" style={{ animationDelay: "1.8s" }}>
            {countdown.days > 0 && (
              <>
                <div className="flex flex-col items-center rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5">
                  <span className="font-mono text-lg font-bold text-foreground">{String(countdown.days).padStart(2, "0")}</span>
                  <span className="text-[8px] uppercase text-[#8892b0]">dias</span>
                </div>
                <span className="text-sm font-bold text-[#8892b0]/50">:</span>
              </>
            )}
            <div className="flex flex-col items-center rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5">
              <span className="font-mono text-lg font-bold text-foreground">{String(countdown.hrs).padStart(2, "0")}</span>
              <span className="text-[8px] uppercase text-[#8892b0]">hrs</span>
            </div>
            <span className="text-sm font-bold text-[#8892b0]/50">:</span>
            <div className="flex flex-col items-center rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5">
              <span className="font-mono text-lg font-bold text-foreground">{String(countdown.min).padStart(2, "0")}</span>
              <span className="text-[8px] uppercase text-[#8892b0]">min</span>
            </div>
            <span className="text-sm font-bold text-[#8892b0]/50">:</span>
            <div className="flex flex-col items-center rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-1.5">
              <span className="font-mono text-lg font-bold text-foreground">{String(countdown.sec).padStart(2, "0")}</span>
              <span className="text-[8px] uppercase text-[#8892b0]">sec</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="ed-fade-in flex w-full max-w-xs flex-col gap-3" style={{ animationDelay: "2s" }}>
            <Button
              onClick={handleRegister}
              className="ed-cta-btn w-full gap-2 py-6 text-base font-semibold text-white"
            >
              <Calendar className="h-4 w-4" />
              AGENDAR EN MI CALENDARIO
            </Button>
            <button
              onClick={scrollToCTA}
              className="text-xs font-medium text-[#8892b0] underline-offset-2 hover:text-cyan-400 hover:underline transition-colors"
            >
              Ver que vas a aprender
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#8892b0]/50">Scroll</span>
          <ChevronDown className="h-4 w-4 text-cyan-500/40 ed-scroll-bounce" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PROBLEMA
         ════════════════════════════════════════════════ */}
      <section className="border-t border-cyan-500/10 px-5 py-16">
        <AnimatedSection>
          <div className="mx-auto max-w-lg">
            <h2 className="mb-4 text-xl font-bold text-balance text-foreground sm:text-2xl">
              Crear contenido manualmente ya no tiene sentido
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-[#8892b0]">
              Grabar, editar, pensar ideas, producir anuncios... La mayoria abandona por eso. La inteligencia artificial cambia el juego.
            </p>

            <div className="flex flex-col gap-3">
              {[
                "Tardas horas grabando y editando un solo video",
                "No sabes que contenido crear o te quedas sin ideas",
                "Pagas agencia o freelancers para cada pieza",
                "Te da pena grabarte frente a camara",
                "No tienes tiempo para producir contenido consistente",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-red-500/10 bg-red-500/5 px-4 py-3 transition-all duration-300 hover:border-red-500/20"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                    <span className="text-xs font-bold text-red-400">{'x'}</span>
                  </div>
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm font-medium text-cyan-400">
              Mientras otros ya crean contenido con IA en minutos.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════════════
          CONCEPTO "ESCLAVO DIGITAL"
         ════════════════════════════════════════════════ */}
      <section className="border-t border-cyan-500/10 bg-[#060d1a] px-5 py-16">
        <AnimatedSection>
          <div className="mx-auto max-w-lg">
            <h2 className="mb-3 text-xl font-bold text-balance text-foreground sm:text-2xl">
              Que es un <span className="ed-gradient-text">Esclavo Digital</span>?
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-[#8892b0]">
              Un sistema de inteligencia artificial que crea contenido por ti todos los dias, sin descanso, sin quejas, sin salario.
            </p>

            <div className="flex flex-col gap-3">
              {[
                { icon: Sparkles, label: "Crea videos automaticamente" },
                { icon: Target, label: "Genera anuncios listos para publicar" },
                { icon: MessageSquare, label: "Produce contenido organico sin parar" },
                { icon: Users, label: "Replica tu imagen o tu voz con IA" },
                { icon: TrendingUp, label: "Crea piezas virales todos los dias" },
                { icon: Clock, label: "Trabaja 24/7 sin que tengas que grabarte" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-3.5 transition-all duration-300 hover:border-cyan-500/20 hover:bg-cyan-500/8"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 ed-icon-glow">
                    <item.icon className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground/90">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════════════
          LO QUE APRENDERAS
         ════════════════════════════════════════════════ */}
      <section className="border-t border-cyan-500/10 px-5 py-16">
        <div className="mx-auto max-w-lg">
          <AnimatedSection>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Lo que aprenderas
            </span>
            <h2 className="mb-8 text-xl font-bold text-balance text-foreground sm:text-2xl">
              6 bloques de implementacion real
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-2 gap-3">
            <FeatureCard icon={Sparkles} title="Como crear contenido infinito con IA" delay={0} />
            <FeatureCard icon={Target} title="Como crear anuncios con inteligencia artificial" delay={100} />
            <FeatureCard icon={Bot} title="Como crear tu clon digital que habla por ti" delay={200} />
            <FeatureCard icon={Users} title="Como crear una influencer artificial" delay={300} />
            <FeatureCard icon={TrendingUp} title="Como viralizar contenido sin ser experto" delay={400} />
            <FeatureCard icon={Zap} title="Como usar 3 herramientas gratuitas de IA" delay={500} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          BONOS Y CREDITOS GRATIS
         ════════════════════════════════════════════════ */}
      <section className="border-t border-cyan-500/10 bg-[#060d1a] px-5 py-16">
        <div className="mx-auto max-w-lg">
          <AnimatedSection>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Gift className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Regalos exclusivos
                </span>
                <h2 className="text-xl font-bold text-balance text-foreground sm:text-2xl">
                  Bonos gratis al registrarte
                </h2>
              </div>
            </div>
          </AnimatedSection>

          <div className="flex flex-col gap-3">
            <BonusCard
              icon={Bot}
              title="Creditos gratis en herramientas de clonacion IA"
              desc="Recibe acceso y creditos para crear tu avatar digital, generar videos con tu clon de voz e imagen sin grabarte."
              delay={0}
            />
            <BonusCard
              icon={Sparkles}
              title="Creditos en herramientas de creacion de contenido con IA"
              desc="Accede gratis a herramientas que generan contenido, anuncios y material visual para tus redes sociales."
              delay={100}
            />
          </div>

          {/* CTA inside bonuses */}
          <AnimatedSection delay={500}>
            <div className="mt-6 text-center">
              <Button
                onClick={handleRegister}
                className="ed-cta-btn mx-auto w-full max-w-xs gap-2 py-6 text-sm font-semibold text-white"
              >
                <Calendar className="h-4 w-4" />
                AGENDAR Y RECLAMAR MIS BONOS
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PARA QUIEN ES
         ════════════════════════════════════════════════ */}
      <section className="border-t border-cyan-500/10 px-5 py-16">
        <div className="mx-auto max-w-lg">
          <AnimatedSection>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Para quien es
            </span>
            <h2 className="mb-8 text-xl font-bold text-balance text-foreground sm:text-2xl">
              Esta masterclass es para ti si eres...
            </h2>
          </AnimatedSection>

          <div className="flex flex-col gap-2">
            <AudienceCard icon={Sparkles} label="Creadores de contenido" delay={0} />
            <AudienceCard icon={Rocket} label="Emprendedores digitales" delay={60} />
            <AudienceCard icon={Target} label="Personas que quieren hacer anuncios sin agencia" delay={120} />
            <AudienceCard icon={Monitor} label="Personas que quieren crear videos sin grabarse" delay={180} />
            <AudienceCard icon={Users} label="Personas con pena frente a camara" delay={240} />
            <AudienceCard icon={Clock} label="Personas que quieren ahorrar tiempo creando contenido" delay={300} />
            <AudienceCard icon={TrendingUp} label="Marketers y networkers" delay={360} />
            <AudienceCard icon={Lightbulb} label="Infoproductores" delay={420} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CTA FINAL
         ════════════════════════════════════════════════ */}
      <section id="ed-cta" className="relative border-t border-cyan-500/10 px-5 py-20">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10" style={{ background: "radial-gradient(circle, hsl(185 80% 50%), transparent 60%)" }} />

        <AnimatedSection>
          <div className="relative z-10 mx-auto max-w-lg text-center">
            {/* Countdown */}
            <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">La masterclass inicia en:</p>
              <p className="mb-3 text-[11px] font-medium text-amber-400/70">Lunes 23 de Febrero · 8:00 PM (hora Colombia)</p>
              <div className="flex items-center justify-center gap-2">
                {[
                  { val: countdown.days, label: "dias" },
                  { val: countdown.hrs, label: "hrs" },
                  { val: countdown.min, label: "min" },
                  { val: countdown.sec, label: "seg" },
                ].map((t, i) => (
                  <div key={t.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-3xl font-bold text-foreground">{String(t.val).padStart(2, "0")}</span>
                      <span className="text-[9px] text-[#8892b0]">{t.label}</span>
                    </div>
                    {i < 3 && <span className="text-xl font-bold text-[#8892b0]/50">:</span>}
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mb-4 text-xl font-bold text-balance text-foreground sm:text-2xl">
              Mientras otros tardan horas creando contenido...
              <br />
              <span className="ed-gradient-text">tu puedes crear sistemas que lo produzcan por ti.</span>
            </h2>

            <p className="mb-8 text-sm text-[#8892b0]">
              Aprende a crear tu esclavo digital en una sola sesion. Sin grabarte. Sin experiencia.
            </p>

            {/* Trust badges */}
            <div className="mb-6 flex flex-col gap-2">
              {[
                "Masterclass 100% en vivo",
                "Herramientas gratuitas de IA",
                "Implementacion paso a paso",
                "Sin grabarte frente a camara",
                "Bonos y creditos gratis en herramientas de IA",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 justify-center">
                  <Check className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                  <span className="text-xs text-foreground/70">{t}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleRegister}
              className="ed-cta-btn w-full max-w-xs gap-2 py-7 text-base font-bold text-white mx-auto"
            >
              <Calendar className="h-5 w-5" />
              AGENDAR EN MI CALENDARIO
            </Button>

            <p className="mt-4 text-[10px] text-[#8892b0]/60">
              Se agendara automaticamente en tu Google Calendar con recordatorios para que no te lo pierdas.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER
         ════════════════════════════════════════════════ */}
      <footer className="border-t border-cyan-500/10 px-5 py-8 text-center">
        <p className="text-[10px] text-[#8892b0]/40">
          Magic Funnel - Contenido con IA
        </p>
      </footer>
    </div>
  )
}
