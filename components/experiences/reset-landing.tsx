"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Lock,
  Shield,
  Zap,
  Cpu,
  BarChart3,
  Users,
  Layers,
  Bot,
  Clock,
  Sparkles,
  Smartphone,
  Trophy,
  Target,
  QrCode,
  MessageCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiagnosticQuiz } from "./diagnostic-quiz"
import { getMemberBySlug } from "@/lib/team-data"

// ─── Particle canvas background (Enhanced) ───
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []
    const count = 40

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
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
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
        ctx.fillStyle = `rgba(0, 143, 17, ${p.alpha})`
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0, 143, 17, ${0.04 * (1 - dist / 150)})`
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

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 opacity-40" />
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
      const t = setTimeout(() => setCurrentChar((c) => c + 1), 25)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setCurrentLine((l) => l + 1)
      currentChar === 0 ? null : setCurrentChar(0)
    }, 400)
    return () => clearTimeout(t)
  }, [currentLine, currentChar, lines, onComplete])

  return (
    <div className="flex flex-col items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em]">
      {lines.map((line, i) => {
        if (i > currentLine) return null
        const text = i === currentLine ? line.slice(0, currentChar) : line
        return (
          <div key={i} className="flex items-center gap-2">
            <span className={i < currentLine || done ? "text-primary shadow-primary" : "text-neutral-500"}>
              {text}
            </span>
            {i === currentLine && !done && <span className="animate-pulse text-primary">_</span>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Luxury Metallic Card with Reveal ───
function MetallicCodeCard() {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="luxury-metallic-container relative h-[220px] w-full max-w-[360px] perspective-[1000px]">
      <div className="luxury-metallic-card relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-7 shadow-2xl transition-transform duration-700 hover:rotate-y-12 group"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #171717 45%, #020202 55%, #111111 100%)",
        }}
      >
        {/* Shimmer Effect */}
        <div className="luxury-shimmer absolute inset-0 pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">RESET PRIVILEGE</span>
            <span className="text-[8px] font-bold text-neutral-600">AUTHORIZED HOLDER ONLY</span>
          </div>
          <div className="h-8 w-12 rounded-md bg-gradient-to-br from-[#ffd700]/30 to-[#b8860b]/10 border border-[#ffd700]/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-[#ffd700] fill-[#ffd700]/20" />
          </div>
        </div>

        {/* Reveal Area */}
        <div className="relative">
          <div className="mb-1 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Código de Activación:</div>
          <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-black border border-white/5 p-4">
            {/* Scan Line */}
            <div className={`absolute top-0 left-0 h-full w-[2px] bg-primary shadow-[0_0_15px_#008F11] z-10 transition-all duration-1500 ease-in-out ${revealed ? "translate-x-[360px]" : "translate-x-[-10px]"}`} />

            <div className={`flex gap-3 transition-all duration-1000 ${revealed ? "opacity-100 blur-0 scale-100" : "opacity-20 blur-md scale-95"}`}>
              <span className="text-2xl font-black italic tracking-wider text-white">XR-782-RESET</span>
            </div>

            {/* Locked/Unlocked Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {revealed ? <Zap className="h-3 w-3 text-primary animate-pulse" /> : <Lock className="h-3 w-3 text-neutral-700" />}
            </div>
          </div>
        </div>

        {/* Holder and QR */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-neutral-600 uppercase">Status</span>
            <span className="text-xs font-black uppercase text-white italic tracking-widest leading-none">VERIFIED CANDIDATE</span>
          </div>
          <div className="relative h-10 w-10 opacity-20 group-hover:opacity-40 transition-opacity">
            <QrCode className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Floating Social Proof (Luxury) ───
const notifications = [
  { name: "Andrés G.", action: "acaba de agendar su llamada", time: "hace 2 min" },
  { name: "Marta R.", action: "completó el diagnóstico con éxito", time: "hace 5 min" },
  { name: "Carlos L.", action: "fue aceptado en el programa", time: "hace 12 min" },
  { name: "Lucía M.", action: "acaba de recibir su llave de acceso", time: "hace 8 min" },
]

function SocialProof() {
  const [current, setCurrent] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const cycle = () => {
      setShow(true)
      setTimeout(() => setShow(false), 5000)
    }
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % notifications.length)
      cycle()
    }, 15000)
    cycle()
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`fixed bottom-6 left-6 z-[100] transition-all duration-700 transform ${show ? "translate-x-0 opacity-100 scale-100" : "-translate-x-full opacity-0 scale-90"}`}>
      <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-black/60 p-2 pr-8 shadow-2xl backdrop-blur-xl">
        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-lg">
          <Users className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <p className="text-[11px] text-white leading-tight">
            <span className="font-black text-primary">{notifications[current].name}</span> <br />
            <span className="opacity-80">{notifications[current].action}</span>
          </p>
          <p className="text-[9px] text-neutral-500 mt-0.5 font-bold uppercase">{notifications[current].time}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Reset Landing Component ───
interface Props {
  leadId?: string | null
  onTrack?: () => void
  referrer?: string
}

export function ResetLanding({ leadId, onTrack, referrer }: Props) {
  const [isSticky, setIsSticky] = useState(false)
  const [tracked, setTracked] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  const [booting, setBooting] = useState(true)

  // 30 minute countdown
  const [timeLeft, setTimeLeft] = useState(1800)

  useEffect(() => {
    const saved = sessionStorage.getItem("reset-timer-v4")
    if (saved) {
      const remaining = Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000))
      setTimeLeft(remaining)
    } else {
      const end = Date.now() + 1800 * 1000
      sessionStorage.setItem("reset-timer-v4", end.toString())
      setTimeLeft(1800)
    }

    // Auto-finish booting
    const t = setTimeout(() => setBooting(false), 2800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return
    const interval = setInterval(() => setTimeLeft((p) => p - 1), 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  useEffect(() => {
    if (!tracked && onTrack) {
      onTrack()
      setTracked(true)
    }
  }, [tracked, onTrack])

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const waConfig = useMemo(() => {
    let num = "15558865145" // Default
    let msg = "Hola, acabo de completar el diagnóstico y quiero solicitar mi acceso prioritario a la Franquicia RESET."

    if (referrer) {
      // Try to get from static member list first
      const member = getMemberBySlug(referrer)
      if (member) {
        // In a real app, we'd fetch these from a database.
        // For this prototype, we'll check localStorage as if it were a shared store
        // or use hardcoded defaults for specific known members
        const savedNum = typeof window !== "undefined" ? localStorage.getItem(`mf_wa_num_${member.id}`) : null
        const savedMsg = typeof window !== "undefined" ? localStorage.getItem(`mf_wa_msg_${member.id}`) : null

        if (savedNum) num = savedNum
        if (savedMsg) msg = savedMsg
      }
    }

    return {
      url: `https://wa.me/${num}?text=${encodeURIComponent(msg)}`,
      number: num,
      message: msg
    }
  }, [referrer])

  const whatsappUrl = waConfig.url

  if (booting) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black">
        <ParticleField />
        <div className="relative z-10 flex flex-col items-center gap-10">
          <div className="relative h-20 w-20 flex items-center justify-center rounded-3xl border border-primary/20 bg-primary/5">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-[20px] animate-pulse" />
          </div>
          <Typewriter lines={["SISTEMA RESET v2.5", "AUTENTICACIÓN RECONOCIDA", "ACCESO GLOBAL CONCEDIDO"]} />
        </div>
      </div>
    )
  }

  if (bookingSubmitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#050505] px-6 text-center text-white">
        <ParticleField />
        <div className="relative mb-12">
          <div className="absolute -inset-10 rounded-full bg-primary/30 blur-[60px] animate-pulse" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_0_40px_rgba(0, 143, 17, 0.3)]">
            <CheckCircle2 className="h-14 w-14 text-primary" />
          </div>
        </div>
        <h1 className="mb-4 text-[42px] font-black tracking-tighter text-white uppercase italic leading-none">
          ACCESO <br /> <span className="text-primary">CONCEDIDO</span>
        </h1>
        <p className="mb-10 max-w-sm text-lg font-medium text-neutral-400">
          Ya estás en el sistema. El último paso es agendar tu llamada por WhatsApp con el equipo de admisiones. No pierdas tu lugar.
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex w-full max-w-xs flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-primary px-6 py-6 text-xl font-black text-black shadow-[0_20px_40px_rgba(0, 143, 17, 0.4)] transition-all hover:scale-[1.05] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6" strokeWidth={3} />
            AGENDAR LLAMADA
          </div>
        </a>

        <div className="mt-12 flex items-center gap-3 opacity-60">
          <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
            SOLICITUD EN PROCESO
          </p>
        </div>
      </div>
    )
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="min-h-dvh w-full bg-[#030303] text-white selection:bg-primary selection:text-black font-sans">
      <ParticleField />
      <SocialProof />

      {/* ── STICKY URGENCY BAR ── */}
      <div className="sticky top-0 z-[110] w-full bg-black/80 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#008F11]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-neutral-300">Reseteando sistema...</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm font-black text-primary italic">
            <Clock className="h-3.5 w-3.5" />
            <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative px-6 pb-24 pt-20">
        <div className="relative z-10 mx-auto max-w-2xl flex flex-col items-center text-center">
          <div className="mb-10 flex flex-col items-center">
            <div className="mb-6 h-1 w-12 bg-primary rounded-full" />
            <h1 className="text-[42px] md:text-[72px] font-black leading-[0.85] tracking-[-0.05em] uppercase italic text-white flex flex-col">
              FRANQUICIA <br /> <span className="text-primary italic-none">REPLICABLE</span>
            </h1>
            <p className="mt-8 max-w-md text-lg md:text-xl font-medium text-neutral-400 text-balance">
              Acceso total al motor que genera ventas en automático. Sistema **90% automatizado** e infraestructura lista para usar.
            </p>
          </div>

          <MetallicCodeCard />

          <div className="mt-16 w-full max-w-md space-y-6">
            <Button
              onClick={() => setQuizOpen(true)}
              className="luxury-cta-btn group relative h-24 w-full overflow-hidden rounded-[2rem] bg-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_20px_50px_rgba(0,255,65,0.15)]"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex w-full items-center justify-between px-4">
                <div className="text-left pl-4 font-black italic text-black">
                  <span className="block text-[10px] uppercase tracking-[0.2em] opacity-40 mb-1">Admisión Prioritaria</span>
                  <span className="text-[24px] leading-none">RESERVAR MI ACCESO</span>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black shadow-lg">
                  <ArrowRight className="h-7 w-7 text-white" />
                </div>
              </div>
            </Button>

            <div className="flex items-center justify-center gap-10 py-2 opacity-40">
              {[
                { icon: Smartphone, text: 'Mobile' },
                { icon: Zap, text: 'Instant' },
                { icon: Trophy, text: 'Top' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MOCKUPS SECTION ── */}
      <section className="bg-white py-28 px-6 text-black relative">
        <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-black to-transparent pointer-events-none" />

        <div className="mx-auto max-w-2xl">
          <div className="mb-20 text-center">
            <span className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase italic mb-4">RESET TECHNOLOGY</span>
            <h2 className="text-[32px] md:text-[64px] font-black uppercase italic leading-[0.9] tracking-tighter">
              INFRAESTRUCTURA <br /> <span className="text-primary italic-none">LLAVE EN MANO</span>
            </h2>
            <p className="mt-6 text-neutral-500 font-medium text-lg">Mientras otros intentan venderte cursos, nosotros te entregamos el motor completo.</p>
          </div>

          <div className="grid gap-24">
            {[
              {
                title: "Embudos & Ads Pro",
                desc: "Te entregamos los embudos exactos y los anuncios que ya están validados. Sin configuración compleja. Listos para replicar y captar prospectos de inmediato.",
                visual: "dashboard"
              },
              {
                title: "IA & TikTok Factory",
                desc: "Recibes nuestra estructura de videos virales y acceso a clases de IA aplicadas a ventas. Tu contenido se crea bajo psicología de consumo masivo.",
                visual: "phone"
              },
              {
                title: "Escala & Comunidad",
                desc: "Clases magistrales de cómo escalar de 0 a 10k y acceso directo al círculo privado de líderes. Networking real con los que ya tienen resultados.",
                visual: "phone"
              }
            ].map((block, i) => (
              <div key={i} className="group">
                <div className="relative mb-10 h-[260px] md:h-[320px] w-full rounded-[2.5rem] bg-[#0c0c0c] p-6 shadow-2xl overflow-hidden border border-black group-hover:border-primary/20 transition-colors">
                  {/* Mockup visual representation */}
                  <div className="relative h-full w-full bg-neutral-900/50 rounded-2xl border border-white/5 p-4 flex flex-col gap-4 overflow-hidden">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <div className="h-4 w-32 bg-primary/20 rounded-full animate-pulse" />
                      <div className="flex gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-20 bg-white/5 rounded-xl flex items-center justify-center">
                        <BarChart3 className="h-8 w-8 text-neutral-700" />
                      </div>
                      <div className="h-20 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <Zap className="h-8 w-8 text-primary" />
                      </div>
                      <div className="h-32 col-span-2 bg-gradient-to-br from-neutral-800 to-black rounded-xl p-4 flex flex-col gap-2">
                        <div className="h-2 w-full bg-white/10 rounded" />
                        <div className="h-2 w-[80%] bg-white/5 rounded" />
                        <div className="h-2 w-[90%] bg-white/10 rounded" />
                        <div className="h-2 w-[60%] bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  </div>
                  {/* Scan beam */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500" />
                </div>
                <h3 className="text-[28px] md:text-[34px] font-black uppercase italic mb-4 leading-none">{block.title}</h3>
                <p className="text-neutral-500 font-medium leading-relaxed text-lg max-w-xl">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSUASION SECTION ── */}
      <section className="bg-black py-32 px-6 border-t border-white/5">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-20">
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] block mb-4">Filtro de Admisión</span>
            <h2 className="text-[36px] md:text-[52px] font-black uppercase italic leading-none mb-8">No es un curso. <br /> Es una nueva realidad.</h2>
            <div className="mx-auto h-1 w-16 bg-primary" />
          </div>

          <div className="grid gap-16 text-left">
            {[
              { title: "EL FILTRO MÁS DIFÍCIL", icon: Shield, desc: "No necesitas experiencia previa en marketing para tener éxito. Lo único que pedimos es tu compromiso total para seguir nuestro paso a paso probado." },
              { title: "ESTRUCTURA DE ÉLITE", icon: Cpu, desc: "Recibes la misma tecnología que usamos nosotros para vender en automático. Sin excepciones, sin secretos." },
              { title: "RECHAZAMOS AL 80%", icon: Users, desc: "No buscamos clientes masivos. Buscamos 2 casos de éxito por semana que podamos documentar." }
            ].map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 md:items-center group">
                <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 flex items-center justify-center rounded-[2rem] bg-neutral-900 border border-white/5 group-hover:border-primary/30 transition-colors">
                  <item.icon className="h-8 w-8 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic mb-2 text-white">{item.title}</h3>
                  <p className="text-neutral-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTAS ── */}
      <section id="reset-booking" className="py-32 px-6 bg-gradient-to-b from-[#030303] to-[#0a1a1a]">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-[32px] md:text-[44px] font-black uppercase italic mb-10 leading-[0.9]">
            Tu transformación <br /> no es <span className="text-primary">negociable</span>
          </h2>
          <Button
            onClick={() => setQuizOpen(true)}
            className="group relative h-24 w-full overflow-hidden rounded-[2.5rem] bg-primary transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_30px_60px_rgba(0, 143, 17, 0.3)]"
          >
            <div className="relative flex w-full items-center justify-between px-6 font-black italic text-black">
              <span className="text-[26px]">RESERVAR MI ACCESO</span>
              <Zap className="h-7 w-7 fill-black" strokeWidth={3} />
            </div>
          </Button>
          <p className="mt-10 text-neutral-600 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
            Protocolo privado v2.5 — Reserva tu lugar
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-[9px] font-bold text-neutral-800 uppercase tracking-[0.6em]">
          RESET SYSTEM © — EXPERIENCIA PRIVADA RESTRINGIDA
        </p>
      </footer>

      {/* ── QUIZ POPUP ── */}
      <DiagnosticQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        onComplete={async () => {
          setQuizOpen(false)
          if (leadId) {
            try {
              await fetch("/api/tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lead_id: leadId, step: 9, step_name: "sales_page_cta" }),
              })
            } catch { }
          }
          setBookingSubmitted(true)
        }}
      />

      {/* ── STICKY FOOTER ── */}
      {isSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-[110] border-t border-white/10 bg-black/90 px-6 py-4 pb-8 backdrop-blur-xl animate-in slide-in-from-bottom duration-500">
          <Button
            onClick={() => setQuizOpen(true)}
            className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-2xl shadow-[0_10px_30px_rgba(0, 143, 17, 0.3)] transition-transform active:scale-95"
          >
            RESERVAR MI ACCESO
          </Button>
        </div>
      )}

      <style jsx global>{`
        :root {
           --primary-rgb: 0, 143, 17;
        }
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-30deg); }
          100% { transform: translateX(350%) skewX(-30deg); }
        }
        .luxury-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: shine 7s infinite ease-in-out;
        }
        .luxury-metallic-card {
           box-shadow: 0 40px 80px -20px rgba(0,0,0,1), 0 0 40px rgba(var(--primary-rgb),0.05);
        }
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-12 { transform: rotateX(4deg) rotateY(12deg); }
      `}</style>
    </div>
  )
}
