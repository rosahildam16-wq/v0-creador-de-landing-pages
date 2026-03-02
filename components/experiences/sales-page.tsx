"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  Sparkles,
  Smartphone,
  Trophy,
  QrCode,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiagnosticQuiz } from "./diagnostic-quiz"
import { getMemberBySlug } from "@/lib/team-data"

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
    const count = 30

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
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.2 + 0.05,
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
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`
        ctx.fill()
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
      const t = setTimeout(() => setCurrentChar((c) => c + 1), 20)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setCurrentLine((l) => l + 1)
      setCurrentChar(0)
    }, 400)
    return () => clearTimeout(t)
  }, [currentLine, currentChar, lines, onComplete])

  return (
    <div className="flex flex-col items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em]">
      {lines.map((line, i) => {
        if (i > currentLine) return null
        const text = i === currentLine ? line.slice(0, currentChar) : line
        return (
          <div key={i} className="flex items-center gap-2">
            <span className={i < currentLine || done ? "text-primary" : "text-neutral-600"}>
              {text}
            </span>
            {i === currentLine && !done && <span className="animate-pulse text-primary">_</span>}
          </div>
        )
      })}
    </div>
  )
}

interface SalesPageProps {
  leadId?: string | null
  onTrack?: () => void
  referrer?: string
}

export function SalesPage({ leadId, onTrack, referrer }: SalesPageProps) {
  const [isSticky, setIsSticky] = useState(false)
  const [tracked, setTracked] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  const [booting, setBooting] = useState(true)
  const [codeRevealed, setCodeRevealed] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationIndex, setNotificationIndex] = useState(0)

  // 30 minute countdown
  const [timeLeft, setTimeLeft] = useState(1800)

  const notifications = useMemo(() => [
    { name: "Andrés G.", action: "acaba de agendar su llamada", time: "hace 2 min" },
    { name: "Marta R.", action: "completó el diagnóstico con éxito", time: "hace 5 min" },
    { name: "Carlos L.", action: "fue aceptado en el programa", time: "hace 12 min" },
    { name: "Lucía M.", action: "acaba de recibir su llave de acceso", time: "hace 8 min" },
  ], [])

  useEffect(() => {
    const saved = sessionStorage.getItem("sales-timer-v5")
    if (saved) {
      const remaining = Math.max(0, Math.floor((parseInt(saved) - Date.now()) / 1000))
      setTimeLeft(remaining)
    } else {
      const end = Date.now() + 1800 * 1000
      sessionStorage.setItem("sales-timer-v5", end.toString())
      setTimeLeft(1800)
    }

    // Auto-finish booting
    const t = setTimeout(() => setBooting(false), 2600)
    // Reveal code shortly after booting
    const t2 = setTimeout(() => setCodeRevealed(true), 3800)

    // Social proof cycle
    const s = setInterval(() => {
      setShowNotification(true)
      setNotificationIndex((prev) => (prev + 1) % notifications.length)
      setTimeout(() => setShowNotification(false), 5000)
    }, 15000)

    return () => {
      clearTimeout(t)
      clearTimeout(t2)
      clearInterval(s)
    }
  }, [notifications.length])

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
    let msg = "Hola, acabo de completar el diagnóstico RESET y he sido aprobado. Quiero agendar mi llamada de admisión."

    if (referrer) {
      const member = getMemberBySlug(referrer)
      if (member) {
        if (member.whatsapp_number) num = member.whatsapp_number
        if (member.whatsapp_message) msg = member.whatsapp_message
      }
    }

    return {
      url: `https://wa.me/${num}?text=${encodeURIComponent(msg)}`,
    }
  }, [referrer])

  const whatsappUrl = waConfig.url

  if (booting) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black">
        <ParticleField />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative h-16 w-16 flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <Typewriter lines={["SISTEMA MAGIC v2.5", "VALIDANDO CREDENCIALES", "ACCESO PRIORITARIO CONCEDIDO"]} />
        </div>
      </div>
    )
  }

  if (bookingSubmitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#050505] px-6 text-center text-white overflow-hidden">
        <ParticleField />
        <div className="relative mb-12">
          <div className="absolute -inset-10 rounded-full bg-primary/30 blur-[60px] animate-pulse" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.3)]">
            <CheckCircle2 className="h-14 w-14 text-primary" />
          </div>
        </div>
        <h1 className="mb-4 text-[42px] font-black tracking-tighter text-white uppercase italic leading-[0.9]">
          ACCESO <br /> <span className="text-primary italic-none">CONCEDIDO</span>
        </h1>
        <p className="mb-10 max-w-sm text-lg font-medium text-neutral-400">
          Has sido verificado. No hagas esperar al equipo. Sistema RESET activado para tu cuenta.
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex w-full max-w-xs flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-primary px-6 py-6 text-xl font-black italic text-black shadow-[0_20px_40px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.05] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6" strokeWidth={3} />
            AGENDAR AHORA
          </div>
        </a>

        <div className="mt-12 flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">
            ENLACE SEGURO ACTIVADO
          </p>
        </div>
      </div>
    )
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="min-h-dvh w-full bg-[#030303] text-white selection:bg-primary selection:text-black font-sans overflow-x-hidden">
      <ParticleField />

      {/* ── STICKY URGENCY BAR ── */}
      <div className="sticky top-0 z-[100] w-full bg-black/80 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_#8b5cf6]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-neutral-400">MAGIC v2.5 Active</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm font-black text-primary italic">
            <Clock className="h-3.5 w-3.5" />
            <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>
        </div>
        <div className="h-[1px] w-full bg-neutral-900 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(timeLeft / 1800) * 100}%` }} />
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative px-6 pb-24 pt-16">
        <div className="relative z-10 mx-auto max-w-md">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="mb-6 h-1 w-10 bg-primary" />
            <h1 className="text-[48px] font-black leading-[0.85] tracking-[-0.05em] uppercase italic text-white">
              TU NEGOCIO <br /> <span className="text-primary italic-none">90% AUTOMATIZADO</span>
            </h1>
            <p className="mt-8 text-lg font-medium text-neutral-400 text-balance">
              Acceso concedido al sistema de **Franquicia Replicable**. Todo lo que necesitas para escalar está aquí dentro.
            </p>
          </div>

          {/* ── LUXURY METALLIC CODE CARD ── */}
          <div className="luxury-metallic-container relative mb-16 h-[230px] w-full perspective-[1000px]">
            <div className="luxury-metallic-card relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/10 p-8 shadow-2xl transition-transform duration-700 hover:rotate-y-12 group"
              style={{
                background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 45%, #050505 55%, #151515 100%)",
              }}
            >
              <div className="luxury-shimmer absolute inset-0 pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">MAGIC PRIVILEGE</span>
                  <span className="text-[8px] font-bold text-neutral-600">EDICIÓN 2026</span>
                </div>
                <div className="h-8 w-12 rounded-xl bg-gradient-to-br from-[#ffd700]/30 to-[#b8860b]/10 border border-[#ffd700]/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-[#ffd700] fill-[#ffd700]/20" />
                </div>
              </div>

              <div className="relative">
                <p className="mb-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Token de Invitación:</p>
                <div className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-black border border-white/5 p-4 backdrop-blur-sm">
                  <div className={`absolute top-0 left-0 h-full w-[2px] bg-primary shadow-[0_0_15px_#8b5cf6] z-10 transition-all duration-1500 ease-in-out ${codeRevealed ? "translate-x-[400px]" : "translate-x-[-10px]"}`} />

                  <div className={`flex gap-3 transition-all duration-1000 ${codeRevealed ? "opacity-100 blur-0" : "opacity-30 blur-md grayscale"}`}>
                    <span className="text-xl font-black italic tracking-widest text-white">VIP-MAGIC-2026</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {codeRevealed ? <ShieldCheck className="h-4 w-4 text-primary animate-pulse" /> : <Lock className="h-4 w-4 text-neutral-700" />}
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-neutral-600 uppercase">Candidato</span>
                  <span className="text-xs font-black uppercase text-white tracking-widest leading-none italic">STATUS: VERIFIED</span>
                </div>
                <QrCode className="h-8 w-8 text-neutral-600 opacity-20 group-hover:opacity-40 transition-opacity" strokeWidth={1} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Button
              onClick={() => setQuizOpen(true)}
              className="group relative h-24 w-full overflow-hidden rounded-[2rem] bg-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex w-full items-center justify-between px-2">
                <div className="text-left pl-4 font-black italic text-black">
                  <span className="block text-[10px] uppercase tracking-[0.2em] opacity-40">Admisión Final</span>
                  <span className="text-[22px] leading-none">COBRAR MI ACCESO</span>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black">
                  <ArrowRight className="h-7 w-7 text-white" />
                </div>
              </div>
            </Button>

            <div className="flex items-center justify-center gap-8 py-2 opacity-50 grayscale hover:grayscale-0 transition-all">
              {[
                { icon: Smartphone, text: 'Mobile' },
                { icon: Zap, text: 'Fast' },
                { icon: Trophy, text: 'Elite' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 text-neutral-500">
                  <item.icon className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MOCKUPS SECTION ── */}
      <section className="bg-white py-28 px-6 text-black relative">
        <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-black to-transparent pointer-events-none" />
        <div className="mx-auto max-w-md">
          <div className="mb-20 text-center">
            <span className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase italic mb-4">Lo que recibes</span>
            <h2 className="text-[42px] font-black uppercase italic leading-[0.95] tracking-tighter">
              TECNOLOGÍA <br /> <span className="text-primary italic-none">LLAVE EN MANO</span>
            </h2>
          </div>

          <div className="grid gap-12">
            {[
              {
                title: "Franquicia de Embudos",
                desc: "Recibes el sistema exacto de embudos de alta conversión que nosotros usamos. 100% replicable y listo para captar clientes desde el minuto uno.",
                icon: <Zap className="h-6 w-6 text-primary" />,
              },
              {
                title: "Ads & TikTok Factory",
                desc: "Te entregamos los anuncios y la estructura de videos TikTok que están dominando el mercado. No tienes que adivinar qué funciona.",
                icon: <Smartphone className="h-6 w-6 text-primary" />,
              },
              {
                title: "Masterclass IA & Escala",
                desc: "Entrenamiento de élite en Inteligencia Artificial y estrategias de escalado para transformar tu negocio en una máquina de libertad.",
                icon: <TrendingUp className="h-6 w-6 text-primary" />,
              },
              {
                title: "Comunidad de Élite",
                desc: "Acceso exclusivo a nuestro círculo privado de líderes. Networking real y soporte constante para asegurar tu éxito.",
                icon: <ShieldCheck className="h-6 w-6 text-primary" />,
              }
            ].map((block, i) => (
              <div key={i} className="group">
                <div className="relative mb-8 h-[180px] w-full rounded-[2rem] bg-[#0c0c0c] p-6 shadow-2xl overflow-hidden border border-black/5 group-hover:border-primary/20 transition-colors">
                  <div className="h-full w-full bg-neutral-900/50 rounded-xl border border-white/5 p-4 flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        {block.icon}
                      </div>
                      <div className="h-3 w-24 bg-primary/40 rounded-full" />
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/20 w-3/4" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                <h3 className="text-2xl font-black uppercase italic mb-3">{block.title}</h3>
                <p className="text-neutral-500 font-medium leading-relaxed">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSUASION SECTION ── */}
      <section className="bg-black py-28 px-6 border-t border-white/5">
        <div className="mx-auto max-w-md">
          <div className="mb-16">
            <h2 className="text-[34px] font-black uppercase italic leading-none mb-4">Reglas del Sistema</h2>
            <p className="text-neutral-400 font-medium leading-relaxed">No buscamos clientes masivos. Buscamos resultados sostenibles impulsados por herramientas inteligentes.</p>
          </div>

          <div className="grid gap-4">
            {[
              { label: "FILTRO", text: "Solo aceptamos perfiles con mentalidad de escala.", color: "primary" },
              { label: "VELOCIDAD", text: "Implementación total en menos de 72 horas.", color: "white" },
              { label: "SOPORTE", text: "Llamada 1 a 1 de diagnóstico incluida.", color: "primary" }
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-4 bg-[#0c0c0c] border border-white/5 p-6 rounded-[2rem] hover:border-primary/30 transition-all group">
                <div className={`h-11 w-11 shrink-0 flex items-center justify-center rounded-2xl border ${rule.color === 'primary' ? 'border-primary/40 text-primary bg-primary/5' : 'border-white/20 text-white bg-white/5'} font-black italic`}>
                  {i + 1}
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${rule.color === 'primary' ? 'text-primary' : 'text-neutral-500'}`}>{rule.label}</span>
                  <p className="text-white text-sm font-medium mt-1 leading-snug">{rule.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTAS ── */}
      <section className="py-28 px-6 bg-gradient-to-b from-[#030303] to-[#0a1a1a]">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-[44px] font-black uppercase italic mb-10 leading-[0.9]">
            TU SISTEMA <br /> <span className="text-primary italic-none">100% REPLICABLE</span>
          </h2>
          <Button
            onClick={() => setQuizOpen(true)}
            className="group relative h-24 w-full overflow-hidden rounded-[2rem] bg-primary transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_20px_60px_rgba(168,85,247,0.3)]"
          >
            <div className="relative flex w-full items-center justify-between px-6 font-black italic text-black">
              <span className="text-[24px]">VALIDAR MI ACCESO</span>
              <Zap className="h-7 w-7 fill-black" strokeWidth={3} />
            </div>
          </Button>
          <p className="mt-10 text-neutral-600 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse italic">
            protocolo privado — v2.5
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-[9px] font-bold text-neutral-800 uppercase tracking-[0.5em]">
          MAGIC SYSTEM © — PROHIBIDA SU REPRODUCCIÓN
        </p>
      </footer>

      {/* ── FLOATING SOCIAL PROOF bubble ── */}
      <div className={`fixed bottom-6 left-6 z-[200] transition-all duration-700 transform ${showNotification ? "translate-x-0 opacity-100 scale-100" : "-translate-x-full opacity-0 scale-90"}`}>
        <div className="flex items-center gap-4 rounded-[2rem] border border-white/5 bg-black/60 p-2 pr-8 shadow-2xl backdrop-blur-xl">
          <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-primary text-black font-black italic shadow-lg">
            {notifications[notificationIndex].name[0]}
          </div>
          <div>
            <p className="text-xs text-white leading-tight">
              <span className="font-black text-primary italic">{notifications[notificationIndex].name}</span> <br />
              <span className="opacity-70 text-[11px]">{notifications[notificationIndex].action}</span>
            </p>
            <p className="text-[9px] text-neutral-600 mt-1 font-bold uppercase">{notifications[notificationIndex].time}</p>
          </div>
        </div>
      </div>

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
                body: JSON.stringify({ lead_id: leadId, step: 8, step_name: "cta_clicked" }),
              })
            } catch { }
          }
          setBookingSubmitted(true)
        }}
      />

      {/* ── STICKY FOOTER CTA ── */}
      {isSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-[110] border-t border-white/10 bg-black/90 px-6 py-4 pb-8 backdrop-blur-xl animate-in slide-in-from-bottom duration-500">
          <Button
            onClick={() => setQuizOpen(true)}
            className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-2xl shadow-[0_10px_30px_rgba(168,85,247,0.3)] transition-transform active:scale-95"
          >
            SOLICITAR MI ADMISIÓN
          </Button>
        </div>
      )}

      <style jsx global>{`
        :root {
           --primary-rgb: 139, 92, 246;
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
