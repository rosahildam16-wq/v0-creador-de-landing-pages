"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Code2,
  Cpu,
  Globe,
  Lightbulb,
  MessageSquare,
  Monitor,
  Rocket,
  Sparkles,
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

/* ── Animated counter ── */
function useCountdown() {
  const [time, setTime] = useState({ hrs: 23, min: 59, sec: 59 })
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { hrs, min, sec } = prev
        sec--
        if (sec < 0) { sec = 59; min-- }
        if (min < 0) { min = 59; hrs-- }
        if (hrs < 0) { hrs = 0; min = 0; sec = 0 }
        return { hrs, min, sec }
      })
    }, 1000)
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
    window.open("https://wa.link/masterclass-esclavo-digital", "_blank")
  }, [leadId])

  return (
    <div className="ed-landing min-h-dvh w-full bg-[#030812] text-foreground">

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
          <span className="ed-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400" style={{ animationDelay: "0.2s" }}>
            <Cpu className="h-3 w-3" />
            Masterclass en vivo
          </span>

          {/* Typing headline */}
          <h1 className="ed-fade-in mb-2 min-h-[100px] text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[36px]" style={{ animationDelay: "0.4s" }}>
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

          {/* Event info pills */}
          <div className="ed-fade-in mb-8 flex flex-wrap items-center justify-center gap-2" style={{ animationDelay: "1.8s" }}>
            {[
              { icon: Calendar, label: "Este lunes" },
              { icon: Clock, label: "8:00 PM COL" },
              { icon: Globe, label: "Online" },
            ].map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/15 bg-cyan-500/5 px-3 py-1 text-[11px] font-medium text-cyan-400">
                <p.icon className="h-3 w-3" />
                {p.label}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="ed-fade-in flex w-full max-w-xs flex-col gap-3" style={{ animationDelay: "2s" }}>
            <Button
              onClick={handleRegister}
              className="ed-cta-btn w-full gap-2 py-6 text-base font-semibold text-white"
            >
              QUIERO CREAR MI ESCLAVO DIGITAL
              <ArrowRight className="h-4 w-4" />
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
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
              El problema
            </span>
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
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              El concepto
            </span>
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
          DEMOSTRACION
         ═════════════════════════���══════════════════════ */}
      <section className="border-t border-cyan-500/10 bg-[#060d1a] px-5 py-16">
        <AnimatedSection>
          <div className="mx-auto max-w-lg text-center">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Demostracion
            </span>
            <h2 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">
              No necesitas camara. No necesitas estudio. No necesitas experiencia.
            </h2>
            <p className="mb-8 text-sm text-[#8892b0]">
              Veras en vivo como se crean videos, anuncios y avatares digitales con IA.
            </p>

            {/* Mockup */}
            <div className="relative mx-auto max-w-[400px] overflow-hidden rounded-2xl border border-cyan-500/15 bg-[#0a1628]">
              {/* Top bar */}
              <div className="flex items-center gap-2 border-b border-cyan-500/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] text-[#8892b0]/50 font-mono">esclavo-digital.ai</span>
              </div>

              {/* Dashboard mockup */}
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-400">Contenido IA</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400">En vivo</span>
                </div>

                {/* Mock stats */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Videos IA", val: "2,847" },
                    { label: "Anuncios", val: "1,204" },
                    { label: "Avatares", val: "482" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-2 text-center">
                      <p className="text-[9px] text-[#8892b0]/60">{s.label}</p>
                      <p className="text-sm font-bold text-cyan-400">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Activity bars */}
                <div className="flex flex-col gap-2">
                  {[85, 70, 55, 90, 65].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-cyan-500/10">
                        <div
                          className="ed-bar-animate h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${w}%`, animationDelay: `${i * 200}ms` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#8892b0]/40 font-mono">{w}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
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
          AUTORIDAD
         ════════════════════════════════════════════════ */}
      <section className="border-t border-cyan-500/10 bg-[#060d1a] px-5 py-16">
        <AnimatedSection>
          <div className="mx-auto max-w-lg text-center">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Autoridad
            </span>
            <h2 className="mb-4 text-xl font-bold text-foreground sm:text-2xl">
              Masterclass creada para quienes quieren dominar la creacion de contenido con IA
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-[#8892b0]">
              Desarrollada por expertos en inteligencia artificial aplicada a la creacion de contenido, anuncios y avatares digitales.
            </p>

            {/* Social proof stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: "+5,000", label: "Estudiantes" },
                { val: "+200", label: "Creadores usando IA" },
                { val: "24/7", label: "Contenido generado" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
                  <p className="text-lg font-bold text-cyan-400">{s.val}</p>
                  <p className="mt-1 text-[10px] text-[#8892b0]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
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
            <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Cupos limitados - Inicia en:</p>
              <div className="flex items-center justify-center gap-3">
                {[
                  { val: countdown.hrs, label: "hrs" },
                  { val: countdown.min, label: "min" },
                  { val: countdown.sec, label: "seg" },
                ].map((t, i) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-3xl font-bold text-foreground">{String(t.val).padStart(2, "0")}</span>
                      <span className="text-[9px] text-[#8892b0]">{t.label}</span>
                    </div>
                    {i < 2 && <span className="text-xl font-bold text-[#8892b0]/50">:</span>}
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
              QUIERO CREAR MI ESCLAVO DIGITAL
              <ArrowRight className="h-5 w-5" />
            </Button>

            <p className="mt-4 text-[10px] text-[#8892b0]/60">
              Al registrarte recibiras el enlace de acceso directo a tu WhatsApp.
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
