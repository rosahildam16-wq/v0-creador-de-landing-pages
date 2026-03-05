"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, Phone, Shield, ChevronDown, X, Calendar, MapPin, Award } from "lucide-react"

interface Props {
  leadId?: string | null
  onTrack?: () => void
}

/* ─────────────────────────────────────────────
   PALETA & ESTILOS GLOBALES
───────────────────────────────────────────── */
const C = {
  sand:    "#D4C4A8",
  sandLight: "#F5F0E8",
  terra:   "#C17F5A",
  jungle:  "#1B3A2E",
  jungleLight: "#2A5240",
  carbon:  "#1A1A1A",
  gold:    "#B8A46E",
  goldLight: "#D4C090",
  white:   "#FAFAF7",
}

/* ─────────────────────────────────────────────
   SOCIAL PROOF POPUPS
───────────────────────────────────────────── */
const SOCIAL_PROOFS = [
  { name: "María", city: "CDMX", action: "agendó una llamada privada", time: "hace 12 min" },
  { name: "Daniel", city: "USA", action: "descargó el dossier", time: "hace 8 min" },
  { name: "Andrea", city: "Monterrey", action: "completó el diagnóstico", time: "hace 21 min" },
  { name: "Carlos", city: "Canadá", action: "solicitó disponibilidad", time: "hace 35 min" },
  { name: "Valentina", city: "Guadalajara", action: "agendó una llamada privada", time: "hace 5 min" },
  { name: "Roberto", city: "Miami", action: "completó el diagnóstico", time: "hace 18 min" },
]

/* ─────────────────────────────────────────────
   DIAGNÓSTICO — PREGUNTAS
───────────────────────────────────────────── */
const DIAGNOSTICO_STEPS = [
  {
    question: "¿Qué rango de inversión estás considerando?",
    options: ["30–50k USD", "50–80k USD", "80–120k USD", "120k+ USD"],
  },
  {
    question: "¿Cuál es tu objetivo principal?",
    options: ["Inversión patrimonial", "Construir residencia", "Desarrollar proyecto arquitectónico", "Explorar oportunidades"],
  },
  {
    question: "¿En qué plazo te gustaría tomar decisión?",
    options: ["0–30 días", "1–3 meses", "3–6 meses", "Solo explorando"],
  },
]

/* ─────────────────────────────────────────────
   HOOK: Scroll reveal
───────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTES
───────────────────────────────────────────── */

/** Divisor de línea dorada animada */
function GoldLine({ delay = 0 }: { delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} className="flex items-center justify-center py-2">
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
          transition: `width 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.5s ${delay}ms`,
          width: visible ? 220 : 0,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  )
}

/** Bloque de texto con reveal editorial */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export function UhMayLanding({ onTrack }: Props) {
  const [scrollY, setScrollY] = useState(0)
  const [diagOpen, setDiagOpen] = useState(false)
  const [diagStep, setDiagStep] = useState(0)   // 0-2 = preguntas, 3 = resultado
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [popup, setPopup] = useState<typeof SOCIAL_PROOFS[0] | null>(null)
  const [hideNotifs, setHideNotifs] = useState(false)
  const popupIdx = useRef(0)

  /* Parallax */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* Social proof rotativo */
  useEffect(() => {
    if (hideNotifs) return
    const show = () => {
      if (hideNotifs) return
      setPopup(SOCIAL_PROOFS[popupIdx.current % SOCIAL_PROOFS.length])
      popupIdx.current++
      setTimeout(() => setPopup(null), 7000)
    }
    const scheduleNext = () => {
      const delay = 35000 + Math.random() * 40000
      return setTimeout(() => { show(); setTimeout(scheduleNext, delay) }, delay)
    }
    const first = setTimeout(show, 6000)
    const loop = scheduleNext()
    return () => { clearTimeout(first); clearTimeout(loop) }
  }, [hideNotifs])

  /* Track cuando se abre diagnóstico */
  const openDiag = useCallback(() => {
    setDiagOpen(true)
    setDiagStep(0)
    setAnswers([])
    setSelected(null)
    onTrack?.()
  }, [onTrack])

  const nextDiagStep = useCallback(() => {
    if (!selected) return
    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)
    setSelected(null)
    if (diagStep < 2) {
      setDiagStep(diagStep + 1)
    } else {
      setDiagStep(3)
    }
  }, [selected, answers, diagStep])

  return (
    <>
      {/* ═══════════════════════════════════════
          CSS GLOBAL: keyframes + fuentes
      ═══════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');

        .uhmay-serif  { font-family: 'Playfair Display', Georgia, serif; }
        .uhmay-sans   { font-family: 'Inter', system-ui, sans-serif; }

        @keyframes uhmay-sheen {
          0%   { background-position: -200% center; }
          100% { background-position: 300% center; }
        }
        @keyframes uhmay-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes uhmay-grain {
          0%, 100% { transform: translate(0,0); }
          10%       { transform: translate(-1px, 1px); }
          20%       { transform: translate(1px, -1px); }
          30%       { transform: translate(-1px, 0); }
          40%       { transform: translate(0, 1px); }
          50%       { transform: translate(1px, 1px); }
          60%       { transform: translate(0, -1px); }
          70%       { transform: translate(-1px, 1px); }
          80%       { transform: translate(1px, 0); }
          90%       { transform: translate(-1px, -1px); }
        }
        @keyframes uhmay-slideInLeft {
          from { opacity:0; transform: translateX(-24px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes uhmay-scrollLine {
          0%   { scaleY: 0; transform-origin: top; }
          50%  { scaleY: 1; transform-origin: top; }
          100% { scaleY: 0; transform-origin: bottom; }
        }
        @keyframes uhmay-pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(184,164,110,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(184,164,110,0); }
        }
        @keyframes uhmay-progress {
          from { width: 0; }
          to   { width: 100%; }
        }

        .uhmay-btn-primary {
          background: linear-gradient(135deg, ${C.terra}, #A06840);
          color: ${C.white};
          border: none;
          padding: 16px 32px;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.08em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .uhmay-btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 20%,
            rgba(255,255,255,0.18) 50%,
            transparent 80%
          );
          background-size: 200% 100%;
          background-position: -200% center;
          transition: none;
        }
        .uhmay-btn-primary:hover::after {
          animation: uhmay-sheen 0.7s ease forwards;
        }
        .uhmay-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(193,127,90,0.4);
        }

        .uhmay-btn-ghost {
          background: transparent;
          color: ${C.sandLight};
          border: 1px solid rgba(212,192,144,0.4);
          padding: 12px 28px;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: all 0.35s ease;
        }
        .uhmay-btn-ghost:hover {
          border-color: ${C.gold};
          color: ${C.goldLight};
          background: rgba(184,164,110,0.07);
        }

        .uhmay-card {
          border: 1px solid rgba(212,192,144,0.2);
          background: rgba(245,240,232,0.04);
          backdrop-filter: blur(8px);
          transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
        }
        .uhmay-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          border-color: rgba(184,164,110,0.4);
        }

        .uhmay-option-card {
          border: 1px solid rgba(212,192,144,0.25);
          background: rgba(245,240,232,0.05);
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
        }
        .uhmay-option-card:hover {
          border-color: rgba(184,164,110,0.6);
          background: rgba(245,240,232,0.1);
        }
        .uhmay-option-card.selected {
          border-color: ${C.gold};
          background: rgba(184,164,110,0.12);
        }

        .grain-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 160px;
          animation: uhmay-grain 0.8s steps(1) infinite;
        }
      `}</style>

      <div className="uhmay-sans" style={{ background: C.carbon, color: C.sandLight, minHeight: "100vh" }}>

        {/* ══════════════════════════════════════
            BLOQUE A — HERO
        ══════════════════════════════════════ */}
        <section
          style={{
            position: "relative",
            height: "100vh",
            minHeight: 640,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Fondo con parallax */}
          <div
            style={{
              position: "absolute",
              inset: "-10%",
              background: `
                linear-gradient(160deg, ${C.jungle} 0%, #0D2218 60%, #1A1208 100%)
              `,
              transform: `translateY(${scrollY * 0.28}px)`,
              willChange: "transform",
            }}
          >
            {/* Textura orgánica SVG */}
            <svg
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }}
              viewBox="0 0 800 600"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="g1" cx="30%" cy="70%">
                  <stop offset="0%" stopColor="#4A8C6F" stopOpacity="1" />
                  <stop offset="100%" stopColor="#1B3A2E" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="g2" cx="80%" cy="20%">
                  <stop offset="0%" stopColor="#6BAA80" stopOpacity="1" />
                  <stop offset="100%" stopColor="#1B3A2E" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="240" cy="420" rx="320" ry="280" fill="url(#g1)" />
              <ellipse cx="640" cy="120" rx="260" ry="200" fill="url(#g2)" />
              {/* Líneas topográficas abstractas */}
              {[0,1,2,3,4].map((i) => (
                <ellipse
                  key={i}
                  cx={400} cy={300}
                  rx={180 + i * 80} ry={120 + i * 55}
                  fill="none"
                  stroke="#4A8C6F"
                  strokeWidth="0.5"
                  opacity={0.3 - i * 0.05}
                />
              ))}
            </svg>
            {/* Puntos de luz tipo selva */}
            {[
              { x: "15%", y: "25%", r: 180, c: "rgba(106,170,128,0.12)" },
              { x: "75%", y: "65%", r: 220, c: "rgba(75,140,111,0.09)" },
              { x: "50%", y: "10%", r: 140, c: "rgba(184,164,110,0.06)" },
            ].map((spot, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: spot.x,
                  top: spot.y,
                  width: spot.r,
                  height: spot.r,
                  background: `radial-gradient(circle, ${spot.c} 0%, transparent 70%)`,
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                }}
              />
            ))}
          </div>

          {/* Grain overlay */}
          <div className="grain-overlay" />

          {/* Overlay oscuro para legibilidad */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(15,20,15,0.55) 0%, rgba(10,16,12,0.72) 100%)",
            }}
          />

          {/* Contenido hero */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              textAlign: "center",
              padding: "0 24px",
              maxWidth: 780,
              margin: "0 auto",
            }}
          >
            {/* Placa de exclusividad */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid rgba(184,164,110,0.5)`,
                padding: "6px 18px",
                marginBottom: 36,
                letterSpacing: "0.22em",
                fontSize: 11,
                color: C.gold,
                animation: "uhmay-float 4s ease-in-out infinite",
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
              PRIVATE COLLECTION · 18 PARCELS
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
            </div>

            {/* Titular */}
            <h1
              className="uhmay-serif"
              style={{
                fontSize: "clamp(36px, 6vw, 72px)",
                fontWeight: 600,
                lineHeight: 1.08,
                color: C.sandLight,
                letterSpacing: "-0.01em",
                marginBottom: 24,
                animation: "uhmay-slideInLeft 1s cubic-bezier(0.16,1,0.3,1) 0.2s both",
              }}
            >
              Tu propio territorio<br />
              <em style={{ color: C.sand, fontWeight: 400, fontStyle: "italic" }}>en la selva maya.</em>
            </h1>

            {/* Subtitular */}
            <p
              style={{
                fontSize: "clamp(14px, 1.8vw, 18px)",
                lineHeight: 1.7,
                color: "rgba(212,196,168,0.85)",
                maxWidth: 580,
                margin: "0 auto 44px",
                fontWeight: 300,
                letterSpacing: "0.02em",
                animation: "uhmay-slideInLeft 1s cubic-bezier(0.16,1,0.3,1) 0.45s both",
              }}
            >
              Colección privada de 18 lotes en el corredor cultural<br />
              de Camino Blanco, Uh May, Tulum.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "center",
                animation: "uhmay-slideInLeft 1s cubic-bezier(0.16,1,0.3,1) 0.65s both",
              }}
            >
              <button className="uhmay-btn-primary" onClick={openDiag} style={{ borderRadius: 2 }}>
                Descubre si esta inversión es para ti
              </button>
              <button
                className="uhmay-btn-ghost"
                style={{ borderRadius: 2 }}
                onClick={() => document.getElementById("inversion")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver estructura de precios por fases
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 36,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity: 0.5,
              fontSize: 10,
              letterSpacing: "0.2em",
              color: C.sand,
            }}
          >
            <span>SCROLL</span>
            <div
              style={{
                width: 1,
                height: 40,
                background: `linear-gradient(180deg, ${C.gold}, transparent)`,
                animation: "uhmay-grain 2s linear infinite",
              }}
            />
            <ChevronDown size={14} style={{ color: C.gold }} />
          </div>
        </section>


        {/* ══════════════════════════════════════
            BLOQUE B — EL CONCEPTO
        ══════════════════════════════════════ */}
        <section style={{ background: C.sandLight, color: C.carbon, padding: "100px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Reveal>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", color: C.terra, marginBottom: 20, textAlign: "center" }}>
                EL CONCEPTO
              </p>
            </Reveal>
            <GoldLine />
            <Reveal delay={80}>
              <h2
                className="uhmay-serif"
                style={{
                  fontSize: "clamp(28px, 4.5vw, 52px)",
                  textAlign: "center",
                  fontWeight: 600,
                  lineHeight: 1.15,
                  color: C.jungle,
                  margin: "32px 0 20px",
                }}
              >
                Más que un terreno:<br />
                <em style={{ fontStyle: "italic", fontWeight: 400 }}>un lienzo para tu legado.</em>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p
                style={{
                  textAlign: "center",
                  maxWidth: 560,
                  margin: "0 auto 64px",
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "rgba(26,26,26,0.65)",
                  fontWeight: 300,
                }}
              >
                Una selección íntima de lotes donde la arquitectura orgánica, la naturaleza y la visión de quienes invierten convergen.
              </p>
            </Reveal>

            {/* 3 Cards concepto */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
              {[
                {
                  icon: <MapPin size={22} color={C.jungle} />,
                  title: "Baja densidad & privacidad",
                  desc: "Solo 18 parcelas en toda la colección. La escasez no es un discurso de ventas; es el diseño del proyecto.",
                  delay: 0,
                },
                {
                  icon: <Award size={22} color={C.jungle} />,
                  title: "Corredor cultural",
                  desc: "Ubicado en el corredor de Camino Blanco, Uh May — una zona de expansión orgánica alejada del ruido turístico masificado.",
                  delay: 100,
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.jungle} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
                  title: "Libertad creativa",
                  desc: "Sin reglamentos de uso rígidos que limiten tu visión. El lote es tuyo: construye una residencia, un retiro, un proyecto.",
                  delay: 200,
                },
              ].map((card, i) => (
                <Reveal key={i} delay={card.delay}>
                  <div
                    style={{
                      border: `1px solid rgba(27,58,46,0.15)`,
                      background: "rgba(255,255,255,0.7)",
                      padding: "36px 28px",
                      borderRadius: 2,
                      transition: "transform 0.4s ease, box-shadow 0.4s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(27,58,46,0.12)"
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                      ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        border: `1px solid rgba(27,58,46,0.2)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                        borderRadius: 2,
                        background: "rgba(27,58,46,0.05)",
                      }}
                    >
                      {card.icon}
                    </div>
                    <h3
                      className="uhmay-serif"
                      style={{ fontSize: 18, fontWeight: 600, color: C.jungle, marginBottom: 12, lineHeight: 1.3 }}
                    >
                      {card.title}
                    </h3>
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(26,26,26,0.6)", fontWeight: 300 }}>
                      {card.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════
            BLOQUE C — INVERSIÓN
        ══════════════════════════════════════ */}
        <section id="inversion" style={{ background: C.jungle, padding: "100px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <Reveal>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", color: C.gold, textAlign: "center", marginBottom: 20 }}>
                ESTRUCTURA DE INVERSIÓN
              </p>
            </Reveal>
            <GoldLine />
            <Reveal delay={80}>
              <h2
                className="uhmay-serif"
                style={{
                  fontSize: "clamp(26px, 4vw, 46px)",
                  textAlign: "center",
                  color: C.sandLight,
                  fontWeight: 600,
                  margin: "32px 0 12px",
                  lineHeight: 1.2,
                }}
              >
                Precio por fases
              </h2>
            </Reveal>
            <Reveal delay={130}>
              <p style={{ textAlign: "center", color: "rgba(212,196,168,0.65)", fontSize: 15, marginBottom: 56, fontWeight: 300 }}>
                Cada fase cierra cuando los lotes de esa ventana se asignan.
              </p>
            </Reveal>

            {/* Timeline de fases */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { fase: "FASE 1", precio: "2,000", label: "Lanzamiento", active: true },
                { fase: "FASE 2", precio: "2,500", label: "Avance de obra", active: false },
                { fase: "FASE 3", precio: "3,000", label: "Infraestructura completa", active: false },
                { fase: "FASE 4", precio: "3,250", label: "Entrega final", active: false },
              ].map((fase, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      position: "relative",
                    }}
                  >
                    {/* Línea vertical conectora */}
                    {i < 3 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 20,
                          top: "50%",
                          width: 1,
                          height: "calc(100% + 0px)",
                          background: `linear-gradient(180deg, ${fase.active ? C.gold : "rgba(184,164,110,0.25)"}, rgba(184,164,110,0.15))`,
                          zIndex: 0,
                        }}
                      />
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        width: "100%",
                        padding: "20px 28px",
                        background: fase.active
                          ? "rgba(184,164,110,0.1)"
                          : "rgba(245,240,232,0.03)",
                        border: `1px solid ${fase.active ? "rgba(184,164,110,0.5)" : "rgba(184,164,110,0.1)"}`,
                        marginBottom: 2,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {/* Dot */}
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: fase.active ? C.gold : "rgba(184,164,110,0.3)",
                          border: `2px solid ${fase.active ? C.goldLight : "rgba(184,164,110,0.2)"}`,
                          flexShrink: 0,
                          animation: fase.active ? "uhmay-pulse-gold 2s ease-in-out infinite" : "none",
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 10,
                              letterSpacing: "0.2em",
                              color: fase.active ? C.gold : "rgba(184,164,110,0.5)",
                              fontWeight: 500,
                            }}
                          >
                            {fase.fase}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              color: fase.active ? C.sandLight : "rgba(212,196,168,0.45)",
                              fontWeight: 300,
                            }}
                          >
                            — {fase.label}
                          </span>
                          {fase.active && (
                            <span
                              style={{
                                fontSize: 9,
                                letterSpacing: "0.15em",
                                color: C.jungle,
                                background: C.gold,
                                padding: "2px 8px",
                                fontWeight: 600,
                              }}
                            >
                              DISPONIBLE
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          className="uhmay-serif"
                          style={{
                            fontSize: "clamp(20px, 3vw, 28px)",
                            fontWeight: 600,
                            color: fase.active ? C.sandLight : "rgba(212,196,168,0.4)",
                          }}
                        >
                          ${fase.precio}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: fase.active ? "rgba(212,196,168,0.6)" : "rgba(212,196,168,0.3)",
                            marginLeft: 6,
                          }}
                        >
                          MXN/m²
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Entry window */}
            <Reveal delay={420}>
              <div
                style={{
                  marginTop: 32,
                  border: `1px solid rgba(184,164,110,0.35)`,
                  padding: "20px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "rgba(184,164,110,0.05)",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: C.gold,
                    flexShrink: 0,
                    animation: "uhmay-pulse-gold 2s infinite",
                  }}
                />
                <p style={{ fontSize: 14, color: "rgba(212,196,168,0.8)", fontWeight: 300, lineHeight: 1.6 }}>
                  <strong style={{ color: C.gold, fontWeight: 500 }}>Precio de lanzamiento</strong> disponible por tiempo limitado.{" "}
                  Enganche desde 30%.
                </p>
              </div>
            </Reveal>
          </div>
        </section>


        {/* ══════════════════════════════════════
            BLOQUE D — CONTEXTO
        ══════════════════════════════════════ */}
        <section style={{ background: "#0F1A0F", padding: "100px 24px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <Reveal>
              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.25em", color: C.terra, marginBottom: 20 }}>
                  CONTEXTO
                </p>
                <h2
                  className="uhmay-serif"
                  style={{ fontSize: "clamp(26px, 3.5vw, 40px)", color: C.sandLight, fontWeight: 600, lineHeight: 1.2, marginBottom: 24 }}
                >
                  Una región<br />en expansión.
                </h2>
                <div style={{ width: 1, height: 48, background: `linear-gradient(180deg, ${C.gold}, transparent)`, marginBottom: 24 }} />
                <p style={{ fontSize: 15, lineHeight: 1.85, color: "rgba(212,196,168,0.7)", fontWeight: 300 }}>
                  La Riviera Maya es una de las zonas de mayor crecimiento patrimonial del continente. Tulum, en particular, ha consolidado un mercado donde la demanda internacional supera consistentemente la oferta de proyectos con diseño y privacidad reales.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: "rgba(212,196,168,0.55)", marginTop: 16, fontWeight: 300 }}>
                  Detalles de conectividad e infraestructura verificables en llamada.
                </p>
              </div>
            </Reveal>

            {/* Mapa topográfico abstracto */}
            <Reveal delay={200}>
              <div style={{ position: "relative" }}>
                <svg viewBox="0 0 300 300" style={{ width: "100%", opacity: 0.55 }}>
                  <defs>
                    <radialGradient id="mapGrad" cx="50%" cy="50%">
                      <stop offset="0%" stopColor={C.jungleLight} stopOpacity="0.3" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="150" cy="150" r="140" fill="none" stroke={C.gold} strokeWidth="0.4" opacity="0.3" />
                  {[30, 55, 80, 105, 130].map((r, i) => (
                    <ellipse
                      key={i}
                      cx={150 + Math.sin(i) * 8}
                      cy={150 + Math.cos(i) * 6}
                      rx={r + Math.sin(i * 2) * 10}
                      ry={r * 0.75 + Math.cos(i) * 8}
                      fill="none"
                      stroke={C.gold}
                      strokeWidth="0.6"
                      opacity={0.18 + i * 0.04}
                    />
                  ))}
                  <circle cx="150" cy="150" r="5" fill={C.terra} opacity="0.9" />
                  <circle cx="150" cy="150" r="12" fill="none" stroke={C.terra} strokeWidth="1" opacity="0.4" />
                  <text x="158" y="138" fill={C.gold} fontSize="10" opacity="0.7" fontFamily="Inter,sans-serif">Uh May</text>
                  <text x="158" y="150" fill="rgba(212,196,168,0.4)" fontSize="8" fontFamily="Inter,sans-serif">Tulum</text>
                </svg>
              </div>
            </Reveal>
          </div>

          {/* Responsive: stack en mobile */}
          <style>{`
            @media (max-width: 640px) {
              #ctx-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>


        {/* ══════════════════════════════════════
            BLOQUE E — AUTORIDAD
        ══════════════════════════════════════ */}
        <section style={{ background: C.sandLight, color: C.carbon, padding: "100px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <Reveal>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", color: C.terra, marginBottom: 20, textAlign: "center" }}>
                RESPALDO
              </p>
            </Reveal>
            <GoldLine />
            <Reveal delay={80}>
              <h2
                className="uhmay-serif"
                style={{
                  fontSize: "clamp(24px, 3.5vw, 40px)",
                  textAlign: "center",
                  color: C.jungle,
                  fontWeight: 600,
                  margin: "32px 0 56px",
                }}
              >
                Con quién estás invirtiendo
              </h2>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 48, alignItems: "start" }}>
              {/* Avatar placeholder */}
              <Reveal>
                <div
                  style={{
                    width: 120,
                    height: 160,
                    background: `linear-gradient(160deg, ${C.jungle} 0%, #0D2218 100%)`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    border: `1px solid rgba(27,58,46,0.2)`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Silhouette editorial */}
                  <svg viewBox="0 0 80 100" style={{ width: 64, opacity: 0.35 }}>
                    <circle cx="40" cy="28" r="18" fill={C.sand} />
                    <path d="M10 100 Q10 62 40 60 Q70 62 70 100Z" fill={C.sand} />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: `linear-gradient(90deg, ${C.terra}, ${C.gold})`,
                    }}
                  />
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div>
                  <p className="uhmay-serif" style={{ fontSize: 22, fontWeight: 600, color: C.jungle, marginBottom: 4 }}>
                    Alejandro Medina López
                  </p>
                  <p style={{ fontSize: 13, color: C.terra, letterSpacing: "0.1em", marginBottom: 28, fontWeight: 400 }}>
                    Estructurador de inversión inmobiliaria
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
                    {[
                      "+15 años en inversión inmobiliaria (tierra y macrolotes)",
                      "+1,500 hectáreas estructuradas y comercializadas",
                      "Experiencia con inversionistas internacionales",
                      "Participación en procesos vinculados a Royal Caribbean y Swarovski",
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `1px solid ${C.jungle}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <Check size={10} color={C.jungle} />
                        </div>
                        <span style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(26,26,26,0.75)", fontWeight: 300 }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Cita */}
                  <blockquote
                    style={{
                      borderLeft: `2px solid ${C.gold}`,
                      paddingLeft: 20,
                      margin: 0,
                    }}
                  >
                    <p
                      className="uhmay-serif"
                      style={{
                        fontSize: "clamp(15px, 2vw, 19px)",
                        fontStyle: "italic",
                        color: C.jungle,
                        lineHeight: 1.6,
                        marginBottom: 10,
                        fontWeight: 400,
                      }}
                    >
                      "La tierra no solo se vende, se estructura con visión, legalidad y propósito."
                    </p>
                    <cite style={{ fontSize: 12, color: C.terra, letterSpacing: "0.08em", fontStyle: "normal" }}>
                      — Alejandro Medina López
                    </cite>
                  </blockquote>
                </div>
              </Reveal>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════
            BLOQUE F — CERTEZA JURÍDICA
        ══════════════════════════════════════ */}
        <section style={{ background: C.carbon, padding: "100px 24px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <Reveal>
              <p style={{ fontSize: 11, letterSpacing: "0.25em", color: C.gold, marginBottom: 20 }}>
                CERTEZA JURÍDICA
              </p>
            </Reveal>
            <GoldLine />
            <Reveal delay={80}>
              <h2
                className="uhmay-serif"
                style={{
                  fontSize: "clamp(24px, 3.5vw, 40px)",
                  color: C.sandLight,
                  fontWeight: 600,
                  margin: "32px 0 48px",
                  lineHeight: 1.2,
                }}
              >
                La tranquilidad de <em style={{ color: C.sand }}>saber que todo está en orden.</em>
              </h2>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2, textAlign: "left" }}>
              {[
                { label: "Propiedad privada", desc: "Escrituración disponible sobre terreno privado." },
                { label: "Escrituración disponible", desc: "El proceso de escritura puede iniciarse desde el momento de la compra." },
                { label: "Extranjeros: fideicomiso", desc: "Compradores de otras nacionalidades pueden adquirir mediante fideicomiso bancario." },
                { label: "Infraestructura proyectada", desc: "CFE, tubería y accesos proyectados. Detalles de avance verificables en llamada." },
              ].map((item, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "24px 20px",
                      border: `1px solid rgba(184,164,110,0.15)`,
                      background: "rgba(245,240,232,0.02)",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        border: `1px solid rgba(184,164,110,0.4)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        borderRadius: 2,
                      }}
                    >
                      <Shield size={14} color={C.gold} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.sandLight, marginBottom: 6, letterSpacing: "0.02em" }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: 12, lineHeight: 1.65, color: "rgba(212,196,168,0.5)", fontWeight: 300 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Trust micro-seal */}
            <Reveal delay={360}>
              <div
                style={{
                  marginTop: 40,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1px solid rgba(184,164,110,0.25)`,
                  padding: "10px 20px",
                  fontSize: 11,
                  color: "rgba(212,196,168,0.5)",
                  letterSpacing: "0.1em",
                }}
              >
                <Shield size={12} color={C.gold} />
                Compra nacional y extranjera (fideicomiso) — verificado en llamada
              </div>
            </Reveal>
          </div>
        </section>


        {/* ══════════════════════════════════════
            SECCIÓN PRIVATE ACCESS + CTA FINAL
        ══════════════════════════════════════ */}
        <section style={{ background: C.jungle, padding: "100px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <Reveal>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: `1px solid rgba(184,164,110,0.35)`,
                  padding: "8px 20px",
                  fontSize: 11,
                  color: "rgba(184,164,110,0.7)",
                  letterSpacing: "0.18em",
                  marginBottom: 32,
                }}
              >
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, opacity: 0.7 }} />
                ACCESO PRIVADO
              </div>
            </Reveal>
            <GoldLine />
            <Reveal delay={80}>
              <h2
                className="uhmay-serif"
                style={{
                  fontSize: "clamp(26px, 4vw, 48px)",
                  color: C.sandLight,
                  fontWeight: 600,
                  lineHeight: 1.15,
                  margin: "28px 0 16px",
                }}
              >
                Disponibilidad y dossier<br />
                <em style={{ color: C.sand, fontStyle: "italic", fontWeight: 400 }}>solo por solicitud.</em>
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p style={{ fontSize: 15, color: "rgba(212,196,168,0.65)", lineHeight: 1.75, marginBottom: 12, fontWeight: 300 }}>
                Colección limitada: <strong style={{ color: C.gold, fontWeight: 500 }}>18 lotes.</strong>
              </p>
              <p style={{ fontSize: 13, color: "rgba(212,196,168,0.45)", lineHeight: 1.7, marginBottom: 44, fontWeight: 300 }}>
                Asignamos asesoría prioritaria a perfiles compatibles mediante un diagnóstico rápido de 3 preguntas.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <button
                className="uhmay-btn-primary"
                onClick={openDiag}
                style={{ borderRadius: 2, fontSize: 14, padding: "18px 40px" }}
              >
                Comenzar diagnóstico de inversión
              </button>
            </Reveal>
          </div>
        </section>


        {/* ══════════════════════════════════════
            MODAL: DIAGNÓSTICO DE INVERSIÓN
        ══════════════════════════════════════ */}
        {diagOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(10,16,12,0.88)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              animation: "uhmay-slideInLeft 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setDiagOpen(false) }}
          >
            <div
              style={{
                background: `linear-gradient(160deg, ${C.jungle} 0%, #0D2218 100%)`,
                border: `1px solid rgba(184,164,110,0.3)`,
                borderRadius: 2,
                width: "100%",
                maxWidth: 560,
                padding: "48px 40px",
                position: "relative",
              }}
            >
              {/* Cerrar */}
              <button
                onClick={() => setDiagOpen(false)}
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(212,196,168,0.4)",
                  padding: 4,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.color = C.sandLight)}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.color = "rgba(212,196,168,0.4)")}
              >
                <X size={18} />
              </button>

              {/* Grain */}
              <div className="grain-overlay" />

              {diagStep < 3 ? (
                <>
                  {/* Progress */}
                  <div style={{ marginBottom: 36 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 10, letterSpacing: "0.2em", color: C.gold }}>
                        DIAGNÓSTICO DE INVERSIÓN
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(212,196,168,0.5)" }}>
                        Paso {diagStep + 1} de 3
                      </span>
                    </div>
                    <div style={{ height: 1, background: "rgba(184,164,110,0.15)", position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${((diagStep + 1) / 3) * 100}%`,
                          background: C.gold,
                          transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      />
                    </div>
                  </div>

                  <h3
                    className="uhmay-serif"
                    style={{
                      fontSize: "clamp(18px, 3vw, 24px)",
                      color: C.sandLight,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      marginBottom: 28,
                    }}
                  >
                    {DIAGNOSTICO_STEPS[diagStep].question}
                  </h3>

                  {/* Opciones */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                    {DIAGNOSTICO_STEPS[diagStep].options.map((opt) => (
                      <button
                        key={opt}
                        className="uhmay-option-card"
                        onClick={() => setSelected(opt)}
                        style={{
                          border: `1px solid ${selected === opt ? C.gold : "rgba(184,164,110,0.25)"}`,
                          background: selected === opt ? "rgba(184,164,110,0.12)" : "rgba(245,240,232,0.03)",
                          padding: "14px 18px",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          borderRadius: 2,
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `1px solid ${selected === opt ? C.gold : "rgba(184,164,110,0.4)"}`,
                            background: selected === opt ? "rgba(184,164,110,0.2)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.2s",
                          }}
                        >
                          {selected === opt && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold }} />}
                        </div>
                        <span style={{ fontSize: 14, color: selected === opt ? C.sandLight : "rgba(212,196,168,0.7)", fontWeight: 300 }}>
                          {opt}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    className="uhmay-btn-primary"
                    onClick={nextDiagStep}
                    disabled={!selected}
                    style={{
                      width: "100%",
                      borderRadius: 2,
                      opacity: selected ? 1 : 0.4,
                      cursor: selected ? "pointer" : "not-allowed",
                    }}
                  >
                    {diagStep < 2 ? "Siguiente pregunta" : "Ver mi resultado"}
                  </button>
                </>
              ) : (
                /* RESULTADO */
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      border: `1px solid rgba(184,164,110,0.5)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 24px",
                      animation: "uhmay-pulse-gold 2s ease-in-out infinite",
                    }}
                  >
                    <Check size={24} color={C.gold} />
                  </div>
                  <p style={{ fontSize: 11, letterSpacing: "0.2em", color: C.gold, marginBottom: 16 }}>
                    PERFIL COMPATIBLE
                  </p>
                  <h3
                    className="uhmay-serif"
                    style={{ fontSize: 26, color: C.sandLight, fontWeight: 600, lineHeight: 1.3, marginBottom: 16 }}
                  >
                    Tu perfil es compatible.
                  </h3>
                  <p style={{ fontSize: 15, color: "rgba(212,196,168,0.7)", lineHeight: 1.75, marginBottom: 32, fontWeight: 300 }}>
                    Agenda una llamada privada para revisar disponibilidad y recibir el dossier de la colección.
                  </p>
                  <button
                    className="uhmay-btn-primary"
                    style={{ width: "100%", borderRadius: 2, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                    onClick={() => {
                      window.open("https://wa.me/message/XXXXXXXXXXX", "_blank")
                    }}
                  >
                    <Calendar size={16} />
                    Agendar llamada privada
                  </button>
                  <button
                    className="uhmay-btn-ghost"
                    style={{ width: "100%", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                    onClick={() => {
                      window.open("https://wa.me/message/XXXXXXXXXXX", "_blank")
                    }}
                  >
                    <Phone size={14} />
                    Contactar vía WhatsApp
                  </button>
                  <p style={{ fontSize: 11, color: "rgba(212,196,168,0.35)", marginTop: 20, lineHeight: 1.65 }}>
                    Debido a que la colección es limitada (18 lotes), asignamos asesoría prioritaria a perfiles compatibles.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ══════════════════════════════════════
            SOCIAL PROOF POPUP
        ══════════════════════════════════════ */}
        {!hideNotifs && popup && (
          <div
            style={{
              position: "fixed",
              bottom: 90,
              left: 20,
              zIndex: 900,
              maxWidth: 320,
              animation: "uhmay-slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div
              style={{
                background: "rgba(27,58,46,0.92)",
                backdropFilter: "blur(12px)",
                border: `1px solid rgba(184,164,110,0.3)`,
                borderRadius: 2,
                padding: "14px 16px 14px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(184,164,110,0.15)",
                  border: `1px solid rgba(184,164,110,0.35)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Calendar size={13} color={C.gold} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: C.sandLight, lineHeight: 1.45, marginBottom: 2 }}>
                  <strong style={{ fontWeight: 500 }}>{popup.name}</strong>{" "}
                  <span style={{ color: "rgba(212,196,168,0.6)", fontWeight: 300 }}>({popup.city})</span>
                  {" "}{popup.action}
                </p>
                <p style={{ fontSize: 11, color: "rgba(212,196,168,0.4)" }}>{popup.time}</p>
              </div>
              <button
                onClick={() => setHideNotifs(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(212,196,168,0.3)",
                  padding: 0,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
                title="Ocultar notificaciones"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}


        {/* ══════════════════════════════════════
            STICKY CTA — MOBILE
        ══════════════════════════════════════ */}
        {!diagOpen && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 800,
              display: "flex",
              background: "rgba(15,26,15,0.95)",
              backdropFilter: "blur(12px)",
              borderTop: `1px solid rgba(184,164,110,0.2)`,
              padding: "12px 16px",
            }}
            className="lg:hidden"
          >
            <button
              className="uhmay-btn-primary"
              onClick={openDiag}
              style={{
                flex: 1,
                borderRadius: 2,
                fontSize: 13,
                padding: "13px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginRight: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Diagnóstico
            </button>
            <button
              className="uhmay-btn-ghost"
              style={{
                flex: 1,
                borderRadius: 2,
                fontSize: 13,
                padding: "13px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={() => window.open("https://wa.me/message/XXXXXXXXXXX", "_blank")}
            >
              <Phone size={13} />
              Agendar
            </button>
          </div>
        )}

        {/* Footer editorial */}
        <footer
          style={{
            background: "#080E08",
            borderTop: `1px solid rgba(184,164,110,0.1)`,
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <p className="uhmay-serif" style={{ fontSize: 15, color: C.gold, letterSpacing: "0.12em", marginBottom: 8 }}>
            Boutique Living Uh May
          </p>
          <p style={{ fontSize: 11, color: "rgba(212,196,168,0.3)", letterSpacing: "0.15em" }}>
            BY CAMINO BLANCO · TULUM, QUINTANA ROO
          </p>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(184,164,110,0.15), transparent)`, margin: "24px auto", maxWidth: 200 }} />
          <p style={{ fontSize: 10, color: "rgba(212,196,168,0.25)", lineHeight: 1.7 }}>
            Esta presentación es de carácter informativo. La disponibilidad, precios e infraestructura<br />
            se verifican en sesión privada. No representa garantía de rendimiento.
          </p>
        </footer>

      </div>
    </>
  )
}
