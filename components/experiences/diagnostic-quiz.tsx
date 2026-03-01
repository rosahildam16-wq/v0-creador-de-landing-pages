"use client"

import { useState, useEffect, useCallback } from "react"
import { X, CheckCircle2, Zap, MessageCircle, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react"

type Step = "budget" | "rejected" | "commitment" | "ready"

interface DiagnosticQuizProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const budgetOptions = [
  {
    id: "high",
    label: "Inversión de Élite",
    sublabel: "Tengo $500 USD o más disponibles",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    id: "mid",
    label: "Presupuesto Estándar",
    sublabel: "Dispongo de $250 - $499 USD",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "low",
    label: "Presupuesto Inicial",
    sublabel: "Puedo comenzar con $100 - $249 USD",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    id: "none",
    label: "Sin Fondos Inmediatos",
    sublabel: "No cuento con capital ahora mismo",
    icon: <AlertCircle className="h-4 w-4" />,
  },
]

export function DiagnosticQuiz({ open, onClose, onComplete }: DiagnosticQuizProps) {
  const [step, setStep] = useState<Step>("budget")
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null)
  const [selectedCommitment, setSelectedCommitment] = useState<string | null>(null)
  const [animatingOut, setAnimatingOut] = useState(false)
  const [optionAnimated, setOptionAnimated] = useState(false)
  const [progressPulse, setProgressPulse] = useState(false)

  // Reset when opening
  useEffect(() => {
    if (open) {
      setStep("budget")
      setSelectedBudget(null)
      setSelectedCommitment(null)
      setAnimatingOut(false)
      setOptionAnimated(false)
      const t = setTimeout(() => setOptionAnimated(true), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleBudgetSelect = useCallback((id: string) => {
    setSelectedBudget(id)
    setProgressPulse(true)
    setTimeout(() => setProgressPulse(false), 600)

    setTimeout(() => {
      setOptionAnimated(false)
      setTimeout(() => {
        if (id === "none") {
          setStep("rejected")
        } else {
          setStep("commitment")
        }
        setTimeout(() => setOptionAnimated(true), 100)
      }, 300)
    }, 400)
  }, [])

  const handleCommitmentSelect = useCallback((id: string) => {
    setSelectedCommitment(id)
    setProgressPulse(true)
    setTimeout(() => setProgressPulse(false), 600)

    setTimeout(() => {
      setOptionAnimated(false)
      setTimeout(() => {
        if (id === "no") {
          setStep("rejected")
        } else {
          setStep("ready")
        }
        setTimeout(() => setOptionAnimated(true), 100)
      }, 300)
    }, 400)
  }, [])

  const handleClose = useCallback(() => {
    setAnimatingOut(true)
    setTimeout(() => {
      onClose()
      setAnimatingOut(false)
    }, 300)
  }, [onClose])

  const handleContinueToBooking = useCallback(() => {
    setAnimatingOut(true)
    setTimeout(() => {
      onComplete()
      setAnimatingOut(false)
    }, 300)
  }, [onComplete])

  if (!open) return null

  const progressWidth = step === "budget" ? "33%" : step === "commitment" ? "66%" : "100%"

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center px-4 transition-all duration-300 ${animatingOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />

      {/* Quiz card */}
      <div
        className={`relative z-10 w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] shadow-2xl transition-all duration-500 ${animatingOut ? "translate-y-8 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"}`}
        style={{ boxShadow: "0 0 60px rgba(0, 143, 17, 0.1), 0 25px 50px rgba(0, 0, 0, 0.8)" }}
      >

        {/* Progress bar */}
        <div className="relative h-1.5 w-full bg-white/5">
          <div
            className={`h-full transition-all duration-700 ease-out ${progressPulse ? "shadow-[0_0_15px_#008F11]" : ""}`}
            style={{
              width: progressWidth,
              background: "linear-gradient(90deg, #008F11, #003B00)",
            }}
          />
        </div>

        {/* Content */}
        <div className="p-8 pt-10">
          {/* ── STEP 1: Budget ── */}
          {step === "budget" && (
            <div className={`transition-all duration-500 ${optionAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="mb-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Diagnóstico 01/02
                </span>
              </div>
              <h3 className="mb-3 text-center text-2xl font-black italic leading-[1.1] text-white uppercase tracking-tighter">
                {"¿Cuál es tu alcance de inversión actual?"}
              </h3>
              <p className="mb-8 text-center text-sm font-medium text-neutral-500">
                {"El sistema requiere combustible. Necesitamos saber qué motor vamos a instalar en tu cuenta."}
              </p>

              <div className="flex flex-col gap-3">
                {budgetOptions.map((opt, i) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleBudgetSelect(opt.id)}
                    className={`group relative flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${selectedBudget === opt.id
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0, 143, 17, 0.1)]"
                      : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      }`}
                    style={{
                      transitionDelay: `${i * 50}ms`,
                    }}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${selectedBudget === opt.id ? "bg-primary text-black" : "bg-neutral-900 text-neutral-500"
                      }`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-black italic uppercase ${selectedBudget === opt.id ? "text-primary" : "text-white"}`}>{opt.label}</p>
                      <p className="text-[11px] font-medium text-neutral-500">{opt.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Commitment ── */}
          {step === "commitment" && (
            <div className={`transition-all duration-500 ${optionAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="mb-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Diagnóstico 02/02
                </span>
              </div>
              <h3 className="mb-3 text-center text-2xl font-black italic leading-[1.1] text-white uppercase tracking-tighter">
                {"¿Dispones de 30 minutos para la llamada?"}
              </h3>
              <p className="mb-8 text-center text-sm font-medium text-neutral-500">
                {"Evaluaremos tu perfil personalmente. Si agendas y no asistes, el sistema bloqueará tu acceso permanentemente."}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleCommitmentSelect("yes")}
                  className={`group relative flex items-center gap-4 rounded-2xl border px-5 py-5 text-left transition-all duration-300 ${selectedCommitment === "yes"
                    ? "border-primary bg-primary/10"
                    : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${selectedCommitment === "yes" ? "bg-primary text-black" : "bg-neutral-900 text-neutral-500"
                    }`}>
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className={`text-sm font-black italic uppercase ${selectedCommitment === "yes" ? "text-primary" : "text-white"}`}>{"SÍ, ME COMPROMETO"}</p>
                    <p className="text-[11px] font-medium text-neutral-500">{"Entiendo la importancia de la sesión"}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCommitmentSelect("no")}
                  className={`group relative flex items-center gap-4 rounded-2xl border px-5 py-5 text-left transition-all duration-300 ${selectedCommitment === "no"
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-white/5 bg-white/5 hover:bg-white/10"
                    }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-neutral-700">
                    <X className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black italic uppercase text-neutral-400">{"NO ESTOY SEGURO"}</p>
                    <p className="text-[11px] font-medium text-neutral-700">{"Prefiero dejar pasar esta oportunidad"}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── REJECTED ── */}
          {step === "rejected" && (
            <div className={`transition-all duration-500 ${optionAnimated ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-900 border border-white/5">
                  <AlertCircle className="h-10 w-10 text-neutral-700" />
                </div>
                <h3 className="mb-3 text-2xl font-black italic uppercase text-white tracking-tighter">
                  {"PERFIL NO COMPATIBLE"}
                </h3>
                <p className="mb-8 text-sm font-medium text-neutral-500 leading-relaxed">
                  {"RESET requiere un nivel de compromiso y recursos que no coinciden con tu perfil actual. Gracias por tu interés."}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full rounded-2xl bg-white/5 py-5 text-xs font-black uppercase tracking-widest text-neutral-500 transition-all hover:bg-white/10 hover:text-white"
                >
                  {"Cerrar Sesión"}
                </button>
              </div>
            </div>
          )}

          {/* ── READY ── */}
          {step === "ready" && (
            <div className={`transition-all duration-500 ${optionAnimated ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="flex flex-col items-center text-center">
                <div className="mb-8 relative">
                  <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl animate-pulse" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-black border border-primary/30">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                </div>

                <h3 className="mb-3 text-3xl font-black italic uppercase text-white tracking-tighter leading-none">
                  {"PERFIL <br/> <span className='text-primary'>APROBADO</span>"}
                </h3>
                <p className="mb-10 text-sm font-medium text-neutral-500 leading-relaxed">
                  {"Has demostrado interés real. El último paso es agendar tu llamada por WhatsApp para validar tu acceso al sistema."}
                </p>

                <a
                  href={`https://wa.me/15558865145?text=${encodeURIComponent("Hola, acabo de completar el diagnóstico RESET y he sido aprobado. Quiero agendar mi llamada de admisión.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-base font-black italic text-black shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] active:scale-[0.98]"
                  onClick={() => {
                    setTimeout(() => handleContinueToBooking(), 500)
                  }}
                >
                  <MessageCircle className="h-6 w-6 fill-black" strokeWidth={3} />
                  SOLICITAR WHATSAPP
                </a>

                <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.4em] text-neutral-700 italic">
                  LLAMADA 100% PERSONALIZADA
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
