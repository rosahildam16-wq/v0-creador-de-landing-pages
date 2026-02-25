"use client"

import { useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"

type Step = "budget" | "rejected" | "commitment" | "ready"

interface DiagnosticQuizProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const budgetOptions = [
  {
    id: "high",
    label: "$500 USD o más",
    sublabel: "Estoy listo para invertir en serio",
    icon: "fire",
  },
  {
    id: "mid",
    label: "$250 - $499 USD",
    sublabel: "Tengo presupuesto disponible",
    icon: "bolt",
  },
  {
    id: "low",
    label: "$100 - $249 USD",
    sublabel: "Puedo empezar con poco",
    icon: "seed",
  },
  {
    id: "none",
    label: "No cuento con dinero ahora",
    sublabel: "Necesito esperar",
    icon: "pause",
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
      // Trigger option animation
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
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${animatingOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Quiz card */}
      <div
        className={`relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-500 ${animatingOut ? "translate-y-8 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100"}`}
        style={{ boxShadow: "0 0 60px rgba(99, 102, 241, 0.08), 0 25px 50px rgba(0, 0, 0, 0.5)" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Cerrar"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress bar */}
        <div className="relative h-1 w-full bg-secondary">
          <div
            className={`h-full transition-all duration-700 ease-out ${progressPulse ? "quiz-progress-pulse" : ""}`}
            style={{
              width: progressWidth,
              background: "linear-gradient(90deg, #6366f1, #a78bfa, #c084fc)",
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* ── STEP 1: Budget ── */}
          {step === "budget" && (
            <div className={`quiz-step-enter ${optionAnimated ? "quiz-step-visible" : ""}`}>
              <div className="mb-1 text-center">
                <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Paso 1 de 2
                </span>
              </div>
              <h3 className="mb-2 text-center text-lg font-bold leading-tight text-foreground text-balance">
                {"¿Si la franquicia Reset se convierte en tu segunda fuente de ingresos, cuánto estarías dispuesto a invertir?"}
              </h3>
              <p className="mb-5 text-center text-xs leading-relaxed text-muted-foreground">
                {"Necesitamos saber esto para personalizar tu plan de acción."}
              </p>

              <div className="flex flex-col gap-2.5">
                {budgetOptions.map((opt, i) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleBudgetSelect(opt.id)}
                    className={`group relative flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all duration-300 ${
                      selectedBudget === opt.id
                        ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/60"
                    }`}
                    style={{
                      transitionDelay: `${i * 60}ms`,
                      opacity: optionAnimated ? 1 : 0,
                      transform: optionAnimated ? "translateY(0)" : "translateY(12px)",
                    }}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg transition-all duration-300 ${
                      selectedBudget === opt.id ? "bg-primary/20 scale-110" : "bg-secondary/80 group-hover:bg-secondary"
                    }`}>
                      {opt.icon === "fire" && <span className="quiz-icon-float" style={{ animationDelay: "0s" }}>{"$$$"}</span>}
                      {opt.icon === "bolt" && <span className="quiz-icon-float" style={{ animationDelay: "0.2s" }}>{"$$"}</span>}
                      {opt.icon === "seed" && <span className="quiz-icon-float" style={{ animationDelay: "0.4s" }}>{"$"}</span>}
                      {opt.icon === "pause" && <span className="text-muted-foreground text-sm">{"--"}</span>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.sublabel}</p>
                    </div>
                    {/* Selection indicator */}
                    {selectedBudget === opt.id && (
                      <div className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Commitment ── */}
          {step === "commitment" && (
            <div className={`quiz-step-enter ${optionAnimated ? "quiz-step-visible" : ""}`}>
              <div className="mb-1 text-center">
                <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Paso 2 de 2
                </span>
              </div>
              <h3 className="mb-2 text-center text-lg font-bold leading-tight text-foreground text-balance">
                {"¿Te comprometes a asistir puntualmente a una sesión de 30 minutos por Zoom?"}
              </h3>
              <p className="mb-5 text-center text-xs leading-relaxed text-muted-foreground">
                {"Evaluaremos si este modelo es para ti."}
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCommitmentSelect("yes")}
                  className={`group relative flex items-center gap-3.5 rounded-xl border px-4 py-4 text-left transition-all duration-300 ${
                    selectedCommitment === "yes"
                      ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"
                      : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/60"
                  }`}
                  style={{
                    opacity: optionAnimated ? 1 : 0,
                    transform: optionAnimated ? "translateY(0)" : "translateY(12px)",
                    transitionDelay: "0ms",
                  }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                    selectedCommitment === "yes" ? "bg-primary/20 scale-110" : "bg-secondary/80"
                  }`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{"Sí, estoy listo"}</p>
                    <p className="text-[11px] text-muted-foreground">{"Quiero mi llamada de diagnóstico personalizada"}</p>
                  </div>
                  {selectedCommitment === "yes" && (
                    <div className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCommitmentSelect("no")}
                  className={`group relative flex items-center gap-3.5 rounded-xl border px-4 py-4 text-left transition-all duration-300 ${
                    selectedCommitment === "no"
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border bg-secondary/30 hover:border-border hover:bg-secondary/60"
                  }`}
                  style={{
                    opacity: optionAnimated ? 1 : 0,
                    transform: optionAnimated ? "translateY(0)" : "translateY(12px)",
                    transitionDelay: "60ms",
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/80">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{"No, ahora no puedo"}</p>
                    <p className="text-[11px] text-muted-foreground">{"Prefiero esperar"}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── REJECTED ── */}
          {step === "rejected" && (
            <div className={`quiz-step-enter ${optionAnimated ? "quiz-step-visible" : ""}`}>
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground">
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M2.73 21h18.53a1 1 0 0 0 .87-1.5L12.87 3.5a1 1 0 0 0-1.74 0L1.87 19.5a1 1 0 0 0 .86 1.5z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground text-balance">
                  {"Entendemos tu situación"}
                </h3>
                <p className="mb-4 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                  {"Este programa requiere un compromiso real. Cuando estés listo para dar el paso, esta oportunidad seguirá aquí para ti."}
                </p>
                <div className="mb-4 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {"Mientras tanto, revisa el contenido gratuito que compartimos en nuestras redes para ir preparándote."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full rounded-xl bg-secondary py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80"
                >
                  {"Cerrar"}
                </button>
              </div>
            </div>
          )}

          {/* ── READY ── */}
          {step === "ready" && (
            <div className={`quiz-step-enter ${optionAnimated ? "quiz-step-visible" : ""}`}>
              <div className="flex flex-col items-center py-2 text-center">
                {/* Animated success ring */}
                <div className="quiz-success-ring mb-5 flex h-20 w-20 items-center justify-center rounded-full">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/15">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="quiz-check-animate text-[#25D366]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>

                <h3 className="mb-2 text-xl font-bold text-foreground text-balance">
                  {"Excelente, calificas!"}
                </h3>
                <p className="mb-6 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                  {"Has demostrado que tienes el compromiso y los recursos para transformar tu negocio. Escríbenos por WhatsApp para agendar tu llamada de admisión."}
                </p>

                <a
                  href={`https://wa.me/15558865145?text=${encodeURIComponent("Hola, acabo de completar el diagnóstico y quiero solicitar mi llamada de admisión.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 text-base font-bold text-white shadow-lg shadow-[#25D366]/25 transition-all hover:bg-[#20BD5A] active:scale-[0.98]"
                  onClick={() => {
                    // Also trigger the onComplete flow
                    setTimeout(() => handleContinueToBooking(), 500)
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.257-.154-2.879.855.855-2.879-.154-.257A8 8 0 1112 20z"/>
                  </svg>
                  {"SOLICITAR POR WHATSAPP"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>

                <p className="mt-3 text-[10px] text-muted-foreground/60">
                  {"Gratuita. Sin compromiso. 100% personalizada."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
