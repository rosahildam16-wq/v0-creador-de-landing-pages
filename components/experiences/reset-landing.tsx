"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ArrowRight, Calendar, CheckCircle2, Lock, Shield, Zap, Cpu, BarChart3, Users, Layers, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiagnosticQuiz } from "./diagnostic-quiz"
import Image from "next/image"

// ─── Particle canvas background ───
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []
    const count = 60

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`
        ctx.fill()
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />
}

// ─── Typewriter effect ───
function Typewriter({ lines, onComplete }: { lines: string[]; onComplete?: () => void }) {
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (currentLine >= lines.length) {
      setDone(true)
      onComplete?.()
      return
    }
    if (currentChar < lines[currentLine].length) {
      const t = setTimeout(() => setCurrentChar((c) => c + 1), 35)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setCurrentLine((l) => l + 1)
      setCurrentChar(0)
    }, 600)
    return () => clearTimeout(t)
  }, [currentLine, currentChar, lines, onComplete])

  return (
    <div className="flex flex-col items-center gap-2 font-mono text-sm md:text-base">
      {lines.map((line, i) => {
        if (i > currentLine) return null
        const text = i === currentLine ? line.slice(0, currentChar) : line
        const isActive = i === currentLine && !done
        return (
          <div key={i} className="flex items-center gap-2">
            <span className={i < currentLine || done ? "reset-text-glow text-reset-cyan" : "text-reset-muted"}>
              {text}
            </span>
            {isActive && <span className="animate-blink text-reset-cyan">|</span>}
            {(i < currentLine || done) && (
              <CheckCircle2 className="h-4 w-4 text-reset-cyan reset-fade-in" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Animated counter ───
function AnimatedCode() {
  const [code, setCode] = useState("")

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const prefix = "XR-"
    const suffix = "-RESET"
    let iterations = 0
    const maxIterations = 20
    const interval = setInterval(() => {
      if (iterations >= maxIterations) {
        setCode(`${prefix}782${suffix}`)
        clearInterval(interval)
        return
      }
      const mid = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
      setCode(`${prefix}${mid}${suffix}`)
      iterations++
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="font-mono text-2xl md:text-3xl font-bold tracking-[0.15em] text-reset-cyan reset-text-glow">
      {code}
    </span>
  )
}

// ─── Section wrapper with scroll reveal ───
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─── Social proof bubble ───
const socialProofNames = [
  { name: "Carlos M.", city: "Bogotá" },
  { name: "María L.", city: "México D.F." },
  { name: "Andrés R.", city: "Lima" },
  { name: "Valentina G.", city: "Buenos Aires" },
  { name: "Diego P.", city: "Medellín" },
  { name: "Camila S.", city: "Santiago" },
  { name: "Juan D.", city: "Guadalajara" },
  { name: "Sofía T.", city: "Quito" },
  { name: "Roberto F.", city: "Monterrey" },
  { name: "Laura V.", city: "Cali" },
  { name: "Fernando A.", city: "Madrid" },
  { name: "Andrea B.", city: "Barranquilla" },
  { name: "Santiago H.", city: "Cancún" },
  { name: "Daniela C.", city: "Cartagena" },
  { name: "Miguel O.", city: "Miami" },
]

const timeAgoOptions = [
  "hace 2 min",
  "hace 5 min",
  "hace 8 min",
  "hace 12 min",
  "hace 15 min",
  "hace 20 min",
  "hace 25 min",
]

function SocialProofBubble() {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    // Show first notification after 4s
    const firstTimeout = setTimeout(() => {
      setVisible(true)
    }, 4000)

    // Cycle through notifications
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % socialProofNames.length)
        setVisible(true)
      }, 600)
    }, 7000)

    return () => {
      clearTimeout(firstTimeout)
      clearInterval(interval)
    }
  }, [])

  // Auto-hide after 5s each
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(t)
    }
  }, [visible, current])

  const person = socialProofNames[current]
  const timeAgo = timeAgoOptions[current % timeAgoOptions.length]

  return (
    <div
      className="fixed bottom-4 left-4 z-50 transition-all duration-500 ease-out"
      style={{
        transform: visible ? "translateX(0)" : "translateX(-120%)",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-3 rounded-xl border border-reset-cyan/15 bg-reset-surface/95 px-4 py-3 shadow-lg backdrop-blur-md"
        style={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.08), 0 4px 20px rgba(0,0,0,0.4)" }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-reset-cyan/10">
          <CheckCircle2 className="h-4 w-4 text-reset-cyan" />
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-white leading-tight">
            {person.name} <span className="font-normal text-reset-muted">de {person.city}</span>
          </span>
          <span className="text-[11px] text-reset-cyan">
            Accedió a Franquicia RESET -- {timeAgo}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main RESET landing ───
interface Props {
  leadId?: string | null
  onTrack?: () => void
}

export function ResetLanding({ leadId, onTrack }: Props) {
  const [bootComplete, setBootComplete] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [tracked, setTracked] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [bookingSubmitted, setBookingSubmitted] = useState(false)

  const bootLines = useMemo(() => [
    "Acceso detectado...",
    "Validando identidad...",
    "Candidato seleccionado...",
  ], [])

  useEffect(() => {
    if (!tracked && onTrack) {
      onTrack()
      setTracked(true)
    }
  }, [tracked, onTrack])

  const handleBootComplete = useCallback(() => {
    setTimeout(() => setBootComplete(true), 800)
    setTimeout(() => setShowContent(true), 1400)
  }, [])

  const handleQuizComplete = useCallback(async () => {
    setQuizOpen(false)
    if (leadId) {
      try {
        await fetch("/api/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadId, step: 8, step_name: "cta_clicked" }),
        })
      } catch { /* noop */ }
    }
    setBookingSubmitted(true)
  }, [leadId])

  const scrollToCTA = () => {
    document.getElementById("reset-booking")?.scrollIntoView({ behavior: "smooth" })
  }

  // ── Boot sequence ──
  if (!bootComplete) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-reset-black">
        <ParticleField />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="h-16 w-16 rounded-full border border-reset-cyan/30 bg-reset-cyan/5 flex items-center justify-center reset-pulse-glow">
            <Lock className="h-7 w-7 text-reset-cyan" />
          </div>
          <Typewriter lines={bootLines} onComplete={handleBootComplete} />
        </div>
      </div>
    )
  }

  // ── Booking success ──
  if (bookingSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-reset-black px-6">
        <ParticleField />
        <div className="relative z-10 flex flex-col items-center text-center reset-fade-in">
          <div className="mb-6 h-20 w-20 rounded-full border border-reset-cyan/30 bg-reset-cyan/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-reset-cyan" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white text-balance">
            Solicitud recibida
          </h1>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-reset-muted">
            Te contactaremos dentro de las próximas 24 horas para confirmar tu llamada de acceso al sistema.
          </p>
          <div className="rounded-lg border border-reset-cyan/10 bg-reset-surface p-5">
            <Typewriter
              lines={[
                "Sesión disponible",
                "Código listo",
                "Esperando activación..."
              ]}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Main content ──
  return (
    <div className={`min-h-dvh w-full bg-reset-black transition-opacity duration-700 ${showContent ? "opacity-100" : "opacity-0"}`}>
      <ParticleField />
      <SocialProofBubble />

      {/* ══════ SECTION 1 – Hero ══════ */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #6366f1 0%, #7c3aed 30%, transparent 70%)" }}
        />

        <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-reset-cyan/20 bg-reset-cyan/5 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-reset-cyan">
            <Shield className="h-3 w-3" />
            Acceso restringido
          </div>

          <h1 className="mb-6 text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight text-white text-balance reset-fade-in">
            Has llegado hasta aquí porque{" "}
            <span className="reset-gradient-text">no eres como los demás.</span>
          </h1>

          <p className="mb-10 max-w-md text-base md:text-lg leading-relaxed text-reset-muted reset-fade-in" style={{ animationDelay: "0.2s" }}>
            Mientras la mayoría sigue usando los mismos embudos, las mismas landing y las mismas estrategias...
            algunos están entrando a un sistema completamente distinto.
          </p>

          <Button
            onClick={() => setQuizOpen(true)}
            className="reset-cta-btn gap-2 px-8 py-6 text-base font-semibold text-white reset-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Zap className="h-5 w-5" />
            Activar llamada de acceso
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-reset-muted/50">
          <span className="text-[10px] uppercase tracking-[0.3em]">Desplazar</span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-reset-cyan/40 to-transparent reset-scroll-line" />
        </div>
      </section>

      {/* ══════ SECTION 2 – Revelacion ══════ */}
      <section className="relative border-t border-reset-border px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <RevealSection>
            <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.25em] text-reset-cyan">
              Revelación
            </span>
            <h2 className="mb-8 text-2xl md:text-4xl font-bold leading-tight text-white text-balance">
              RESET:{" "}
              <span className="reset-gradient-text">La franquicia digital que ya viene construida.</span>
            </h2>
          </RevealSection>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[
              { icon: Layers, label: "Embudos listos" },
              { icon: BarChart3, label: "Anuncios listos" },
              { icon: Cpu, label: "Educación en marketing" },
              { icon: Bot, label: "Educación en IA" },
              { icon: Zap, label: "Sistema replicable" },
              { icon: Users, label: "Estructura para monetizar" },
            ].map((item, i) => (
              <RevealSection key={item.label} delay={i * 100}>
                <div className="reset-feature-card flex flex-col items-center gap-3 rounded-xl border border-reset-border bg-reset-surface p-5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-reset-cyan/10">
                    <item.icon className="h-5 w-5 text-reset-cyan" />
                  </div>
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SECTION 3 – Mockups ══════ */}
      <section className="relative border-t border-reset-border px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <RevealSection>
            <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.25em] text-reset-cyan">
              El sistema
            </span>
            <h2 className="mb-10 text-2xl md:text-3xl font-bold text-white text-balance">
              Un vistazo al interior
            </h2>
          </RevealSection>

          <div className="flex flex-col gap-6">
            {[
              { src: "/images/reset-dashboard.jpg", label: "Dashboard del sistema" },
              { src: "/images/reset-funnels.jpg", label: "Embudos y automatizaciones" },
              { src: "/images/reset-ai.jpg", label: "Inteligencia artificial integrada" },
            ].map((mockup, i) => (
              <RevealSection key={mockup.label} delay={i * 150}>
                <div className="group relative overflow-hidden rounded-xl border border-reset-border">
                  <div className="reset-mockup-glow absolute inset-0 z-10 pointer-events-none" />
                  <Image
                    src={mockup.src}
                    alt={mockup.label}
                    width={640}
                    height={360}
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-reset-black/90 to-transparent p-4 pt-10">
                    <span className="text-sm font-medium text-white">{mockup.label}</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SECTION 4 – El código ══════ */}
      <section className="relative border-t border-reset-border px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <RevealSection>
            <div className="mb-8 flex flex-col items-center gap-6">
              <div className="h-16 w-16 rounded-full border border-reset-cyan/30 bg-reset-cyan/5 flex items-center justify-center reset-pulse-glow">
                <Lock className="h-7 w-7 text-reset-cyan" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-reset-muted">
                Código de acceso
              </span>
            </div>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="mb-8 rounded-xl border border-reset-cyan/20 bg-reset-surface px-8 py-6 md:px-12 md:py-8">
              <AnimatedCode />
            </div>
          </RevealSection>

          <RevealSection delay={400}>
            <p className="mb-3 text-base leading-relaxed text-white">
              Este código confirma que fuiste seleccionado para ver el sistema.
            </p>
            <p className="text-sm leading-relaxed text-reset-muted">
              Necesitarás este código en la llamada para desbloquear el acceso.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ══════ SECTION 5 – Diferenciador ══════ */}
      <section className="relative border-t border-reset-border px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <RevealSection>
            <p className="mb-6 text-xl md:text-2xl font-bold leading-relaxed text-white text-balance">
              No es otro curso.{" "}
              <span className="text-reset-muted">No es otra estrategia genérica.</span>{" "}
              Es una estructura{" "}
              <span className="reset-gradient-text">lista para operar.</span>
            </p>
          </RevealSection>

          <RevealSection delay={200}>
            <div className="mt-8 rounded-xl border border-reset-border bg-reset-surface p-6 md:p-8">
              <p className="text-base md:text-lg leading-relaxed text-reset-muted">
                Mientras otros empiezan desde cero...{" "}
                <span className="font-semibold text-white">tú entras con el sistema construido.</span>
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════ DIAGNOSTIC QUIZ POPUP ══════ */}
      <DiagnosticQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onComplete={handleQuizComplete}
      />

      {/* ══════ SECTION 6 – CTA ══════ */}
      <section id="reset-booking" className="relative border-t border-reset-border px-6 py-20">
        <div className="mx-auto max-w-md">
          <RevealSection>
            <div className="rounded-2xl border border-reset-cyan/20 bg-reset-surface p-6 md:p-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-reset-cyan/10 reset-pulse-glow">
                  <Calendar className="h-6 w-6 text-reset-cyan" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-white">Activar llamada de acceso</h2>
                <p className="text-sm text-reset-muted">
                  Responde 2 preguntas rápidas y agenda tu llamada de acceso al sistema RESET.
                </p>
              </div>

              <Button
                onClick={() => setQuizOpen(true)}
                className="reset-cta-btn w-full gap-2 py-6 text-base font-semibold text-white"
              >
                ACTIVAR ACCESO
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ══════ SECTION 7 – Cierre ══════ */}
      <section className="relative border-t border-reset-border px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <RevealSection>
            <p className="mb-4 text-xl md:text-2xl font-bold text-white text-balance">
              Esto no es para todos.
            </p>
            <p className="mb-10 text-base leading-relaxed text-reset-muted">
              Solo para quienes están listos para salir del modelo tradicional.
            </p>
          </RevealSection>

          <RevealSection delay={300}>
            <div className="inline-flex flex-col gap-2 rounded-xl border border-reset-border bg-reset-surface px-8 py-6 font-mono text-sm">
              <span className="text-reset-cyan reset-text-glow">Sesión disponible</span>
              <span className="text-reset-cyan reset-text-glow" style={{ animationDelay: "0.5s" }}>Código listo</span>
              <span className="text-reset-muted reset-blink-slow">Esperando activación...</span>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-reset-border px-6 py-8 text-center">
        <p className="text-xs text-reset-muted/50">
          RESET \u2014 Sistema privado \u2014 Todos los derechos reservados
        </p>
      </footer>
    </div>
  )
}
