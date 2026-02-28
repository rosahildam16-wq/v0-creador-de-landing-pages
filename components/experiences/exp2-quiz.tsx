"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { playQuizClick, playQuizResult } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  onLeadCreated?: (id: string) => void
  embudoId?: string
}

const questions = [
  {
    text: "\u00bfC\u00f3mo te sientes con las estrategias de venta que actualmente usas?",
    options: [
      "Saturado.",
      "Confundido.",
      "Cansado de empezar de 0",
      "Feliz porque vendo todos los d\u00edas",
    ],
  },
  {
    text: "\u00bfQu\u00e9 est\u00e1s buscando realmente?",
    options: [
      "Un sistema de ventas claro.",
      "Automatizar procesos.",
      "Ingresos estables y escalables.",
      "Algo ya probado que funcione bien.",
    ],
  },
  {
    text: "Si existiera una estructura de venta lista y predecible, \u00bfqu\u00e9 valoras m\u00e1s?",
    options: [
      "No empezar desde cero.",
      "Menos improvisaci\u00f3n.",
      "Retenci\u00f3n y escalar m\u00e1s r\u00e1pido.",
      "Acompa\u00f1amiento y comunidad.",
    ],
  },
]

// Total steps = questions + 1 registration form
const TOTAL_STEPS = questions.length + 1

export function PsychQuiz({ onContinue, onLeadCreated, embudoId = "nomada-vip" }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showRegistration, setShowRegistration] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [formData, setFormData] = useState({ nombre: "", correo: "", whatsapp: "", countryCode: "+52" })
  const [formErrors, setFormErrors] = useState({ nombre: false, correo: false, whatsapp: false })
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const currentStep = showRegistration ? TOTAL_STEPS : questionIndex + 1
  const progressValue = (currentStep / TOTAL_STEPS) * 100

  const handleTransition = (callback: () => void) => {
    setAnimating(true)
    setTimeout(() => {
      callback()
      setAnimating(false)
    }, 300)
  }

  const handleAnswer = (selectedOption: string) => {
    playQuizClick()
    setAnswers((prev) => ({
      ...prev,
      [`pregunta_${questionIndex + 1}`]: selectedOption,
    }))
    handleTransition(() => {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex((prev) => prev + 1)
      } else {
        setShowRegistration(true)
        playQuizResult()
      }
    })
  }

  const validateForm = () => {
    const errors = {
      nombre: formData.nombre.trim().length < 2,
      correo: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo.trim()),
      whatsapp: formData.whatsapp.trim().length < 7,
    }
    setFormErrors(errors)
    return !errors.nombre && !errors.correo && !errors.whatsapp
  }

  const handleSubmitRegistration = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    playQuizResult()

    // Extract UTM params from URL if available
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
    let referrer = urlParams?.get("ref") || ""

    // Fallback to sessionStorage (set by /r/[member]/[funnel] routes)
    if (!referrer && typeof window !== "undefined") {
      referrer = sessionStorage.getItem("mf_referrer") || ""
    }

    try {
      const fullWhatsApp = `${formData.countryCode}${formData.whatsapp.trim()}`
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          correo: formData.correo.trim().toLowerCase(),
          whatsapp: fullWhatsApp,
          embudo_id: embudoId,
          fuente: "Organico",
          quiz_respuestas: answers,
          ref: referrer,
          utm_source: urlParams?.get("utm_source") || "",
          utm_medium: urlParams?.get("utm_medium") || "",
          utm_campaign: urlParams?.get("utm_campaign") || "",
        }),
      })
      const data = await res.json()
      if (data.lead_id && onLeadCreated) {
        onLeadCreated(data.lead_id)
      }
    } catch {
      // Silently fail - don't block the funnel experience
    }

    onContinue()
  }

  const labels = ["A", "B", "C", "D"]

  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 py-8">
      <div className="mb-8">
        <Progress value={progressValue} className="h-1 bg-secondary [&>div]:bg-primary" />
      </div>

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${animating ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100"
          }`}
      >
        {!showRegistration ? (
          /* Questions */
          <div className="flex flex-1 flex-col justify-center">
            <span className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Pregunta {questionIndex + 1} de {questions.length}
            </span>
            <h2 className="mb-10 text-xl font-semibold leading-relaxed text-foreground text-pretty break-words">
              {questions[questionIndex].text}
            </h2>
            <div className="flex flex-col gap-3">
              {questions[questionIndex].options.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAnswer(option)}
                  className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 px-5 py-4 text-left text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-secondary active:scale-[0.98]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold text-muted-foreground">
                    {labels[i]}
                  </span>
                  <span className="text-sm font-medium leading-relaxed break-words">{option}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="flex flex-1 flex-col justify-center">
            {/* Lock icon */}
            <div className="mb-5 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h9.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3-3 3 3" /></svg>
              </div>
            </div>

            <span className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-primary">
              {'Último paso'}
            </span>
            <h2 className="mb-3 text-center text-xl font-bold leading-relaxed text-foreground text-pretty">
              {'Antes de entregarte el código...'}
            </h2>
            <p className="mb-8 text-center text-sm leading-relaxed text-muted-foreground text-pretty">
              {'Necesitamos verificar que eres la persona correcta para recibir este acceso. Completa tus datos reales.'}
            </p>

            <div className="flex flex-col gap-4">
              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-nombre" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tu nombre completo
                </label>
                <input
                  id="reg-nombre"
                  type="text"
                  placeholder="Ej: Carlos Martinez"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                    if (formErrors.nombre) setFormErrors((prev) => ({ ...prev, nombre: false }))
                  }}
                  className={`rounded-lg border bg-secondary/50 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:bg-secondary ${formErrors.nombre ? "border-destructive" : "border-border"
                    }`}
                />
                {formErrors.nombre && (
                  <span className="text-xs text-destructive">Ingresa tu nombre completo</span>
                )}
              </div>

              {/* Correo */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-correo" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tu correo electronico
                </label>
                <input
                  id="reg-correo"
                  type="email"
                  placeholder="tu@correo.com"
                  value={formData.correo}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, correo: e.target.value }))
                    if (formErrors.correo) setFormErrors((prev) => ({ ...prev, correo: false }))
                  }}
                  className={`rounded-lg border bg-secondary/50 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:bg-secondary ${formErrors.correo ? "border-destructive" : "border-border"
                    }`}
                />
                {formErrors.correo && (
                  <span className="text-xs text-destructive">Ingresa un correo valido</span>
                )}
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-whatsapp" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tu WhatsApp
                </label>
                <div className="flex gap-2">
                  <div className="relative w-24 shrink-0">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                      className="h-full w-full appearance-none rounded-lg border border-border bg-secondary/50 px-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                    >
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+593">🇪🇨 +593</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+58">🇻🇪 +58</option>
                      <option value="+502">🇬🇹 +502</option>
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-muted-foreground"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>
                  <input
                    id="reg-whatsapp"
                    type="tel"
                    placeholder="Ej: 55 1234 5678"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      setFormData((prev) => ({ ...prev, whatsapp: val }))
                      if (formErrors.whatsapp) setFormErrors((prev) => ({ ...prev, whatsapp: false }))
                    }}
                    className={`flex-1 rounded-lg border bg-secondary/50 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:bg-secondary ${formErrors.whatsapp ? "border-destructive" : "border-border"
                      }`}
                  />
                </div>
                {formErrors.whatsapp && (
                  <span className="text-xs text-destructive">Ingresa tu numero de WhatsApp</span>
                )}
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={submitting}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Verificando...
                  </>
                ) : (
                  "Verificar y recibir mi llave"
                )}
              </button>

              <p className="text-center text-[10px] leading-relaxed text-muted-foreground/60">
                {'Tus datos estan protegidos. Solo los usamos para darte acceso exclusivo.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
