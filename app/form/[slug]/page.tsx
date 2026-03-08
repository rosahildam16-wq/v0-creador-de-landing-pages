"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronRight, ChevronLeft, Check, Loader2, Star,
    ChevronDown, Calendar, ArrowRight, Sparkles,
} from "lucide-react"
import type { Form, FormQuestion, FormLogicRule } from "@/lib/form-types"

type Answers = Record<string, string | string[]>

// ─── Logic resolution ─────────────────────────────────────────────────────────

function getNextQuestionId(
    currentId: string,
    questions: FormQuestion[],
    answers: Answers,
    rules: FormLogicRule[]
): string | null {
    const currentIdx = questions.findIndex(q => q.id === currentId)
    const matchingRule = rules.find(r => {
        if (r.question_id !== currentId) return false
        const answer = answers[currentId]
        const answerStr = Array.isArray(answer) ? answer.join(", ") : String(answer || "")
        return answerStr.toLowerCase() === r.condition_value.toLowerCase() ||
            answerStr.toLowerCase().includes(r.condition_value.toLowerCase())
    })
    if (matchingRule) {
        if (matchingRule.action_type === "end_form") return null
        return matchingRule.target_question_id || null
    }
    return questions[currentIdx + 1]?.id || null
}

// ─── Single question view ─────────────────────────────────────────────────────

function QuestionView({
    question,
    value,
    onChange,
    onNext,
    onPrev,
    isFirst,
    isLast,
    primaryColor,
    progress,
    total,
    currentNum,
    hasError,
}: {
    question: FormQuestion
    value: string | string[]
    onChange: (v: string | string[]) => void
    onNext: () => void
    onPrev: () => void
    isFirst: boolean
    isLast: boolean
    primaryColor: string
    progress: number
    total: number
    currentNum: number
    hasError: boolean
}) {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
    const strValue = Array.isArray(value) ? "" : (value || "")
    const arrValue = Array.isArray(value) ? value : []

    useEffect(() => {
        const t = setTimeout(() => (inputRef.current as HTMLInputElement | null)?.focus?.(), 150)
        return () => clearTimeout(t)
    }, [question.id])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey && question.type !== "long_text") {
                e.preventDefault()
                onNext()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [question.type, onNext])

    const toggleMulti = (opt: string) => {
        onChange(arrValue.includes(opt) ? arrValue.filter(v => v !== opt) : [...arrValue, opt])
    }

    const pc = primaryColor

    return (
        <div className="w-full max-w-xl mx-auto flex flex-col gap-8 px-4">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: pc }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    />
                </div>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: pc, opacity: 0.7 }}>
                    {currentNum}/{total}
                </span>
            </div>

            {/* Question label */}
            <div className="flex gap-3">
                <span className="text-sm font-black mt-1.5 shrink-0 tabular-nums" style={{ color: pc, opacity: 0.6 }}>
                    {currentNum}→
                </span>
                <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                        {question.label}
                        {question.required && <span style={{ color: pc }} className="ml-1">*</span>}
                    </h2>
                    {question.description && (
                        <p className="text-sm text-white/40 mt-2 font-medium leading-relaxed">{question.description}</p>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="pl-7">

                {/* Text inputs */}
                {(question.type === "short_text" || question.type === "email" || question.type === "phone" || question.type === "number") && (
                    <div className="relative">
                        <input
                            ref={inputRef as any}
                            type={question.type === "email" ? "email" : question.type === "phone" ? "tel" : question.type === "number" ? "number" : "text"}
                            value={strValue}
                            onChange={e => onChange(e.target.value)}
                            placeholder={question.placeholder || "Escribe tu respuesta aquí..."}
                            className="w-full bg-transparent border-b-2 pb-3 pt-1 text-xl text-white font-medium placeholder:text-white/15 focus:outline-none transition-colors"
                            style={{ borderColor: hasError ? "#ef4444" : strValue ? pc : "rgba(255,255,255,0.15)" }}
                        />
                        {hasError && <p className="mt-2 text-xs font-bold text-red-400">Este campo es requerido</p>}
                    </div>
                )}

                {/* Long text */}
                {question.type === "long_text" && (
                    <div>
                        <textarea
                            ref={inputRef as any}
                            value={strValue}
                            onChange={e => onChange(e.target.value)}
                            placeholder={question.placeholder || "Escribe tu respuesta..."}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-medium placeholder:text-white/15 focus:outline-none transition-colors resize-none"
                            style={{ borderColor: hasError ? "#ef4444" : strValue ? `${pc}60` : undefined }}
                        />
                        {hasError && <p className="mt-2 text-xs font-bold text-red-400">Este campo es requerido</p>}
                    </div>
                )}

                {/* Date */}
                {question.type === "date" && (
                    <input
                        ref={inputRef as any}
                        type="date"
                        value={strValue}
                        onChange={e => onChange(e.target.value)}
                        className="bg-transparent border-b-2 pb-3 pt-1 text-xl text-white font-medium focus:outline-none transition-colors"
                        style={{ borderColor: strValue ? pc : "rgba(255,255,255,0.15)" }}
                    />
                )}

                {/* Single choice */}
                {question.type === "single_choice" && (
                    <div className="space-y-2.5">
                        {(question.options || []).map((opt, i) => {
                            const selected = strValue === opt.value
                            return (
                                <motion.button
                                    key={opt.value}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                                    onClick={() => onChange(opt.value)}
                                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 group"
                                    style={{
                                        borderColor: selected ? pc : "rgba(255,255,255,0.08)",
                                        backgroundColor: selected ? `${pc}15` : "rgba(255,255,255,0.02)",
                                    }}
                                >
                                    <span
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all"
                                        style={{
                                            backgroundColor: selected ? pc : "transparent",
                                            borderWidth: 2,
                                            borderStyle: "solid",
                                            borderColor: selected ? pc : "rgba(255,255,255,0.2)",
                                            color: selected ? "#fff" : "rgba(255,255,255,0.4)",
                                        }}
                                    >
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="font-semibold text-sm md:text-base" style={{ color: selected ? "#fff" : "rgba(255,255,255,0.65)" }}>
                                        {opt.label}
                                    </span>
                                    {selected && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto"
                                        >
                                            <Check className="w-4 h-4" style={{ color: pc }} />
                                        </motion.span>
                                    )}
                                </motion.button>
                            )
                        })}
                        {hasError && <p className="text-xs font-bold text-red-400">Selecciona una opción</p>}
                    </div>
                )}

                {/* Multiple choice */}
                {question.type === "multiple_choice" && (
                    <div className="space-y-2.5">
                        {(question.options || []).map((opt, i) => {
                            const checked = arrValue.includes(opt.value)
                            return (
                                <motion.button
                                    key={opt.value}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                                    onClick={() => toggleMulti(opt.value)}
                                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150"
                                    style={{
                                        borderColor: checked ? pc : "rgba(255,255,255,0.08)",
                                        backgroundColor: checked ? `${pc}15` : "rgba(255,255,255,0.02)",
                                    }}
                                >
                                    <span
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                                        style={{
                                            backgroundColor: checked ? pc : "transparent",
                                            borderWidth: 2,
                                            borderStyle: "solid",
                                            borderColor: checked ? pc : "rgba(255,255,255,0.2)",
                                        }}
                                    >
                                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                                    </span>
                                    <span className="font-semibold text-sm md:text-base" style={{ color: checked ? "#fff" : "rgba(255,255,255,0.65)" }}>
                                        {opt.label}
                                    </span>
                                </motion.button>
                            )
                        })}
                        {hasError && <p className="text-xs font-bold text-red-400">Selecciona al menos una opción</p>}
                    </div>
                )}

                {/* Visual buttons */}
                {question.type === "visual_buttons" && (
                    <div className="grid grid-cols-2 gap-3">
                        {(question.options || []).map((opt, i) => {
                            const selected = strValue === opt.value
                            return (
                                <motion.button
                                    key={opt.value}
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.06 }}
                                    onClick={() => onChange(opt.value)}
                                    className="p-5 rounded-2xl border-2 text-center transition-all duration-150 font-bold text-sm"
                                    style={{
                                        borderColor: selected ? pc : "rgba(255,255,255,0.08)",
                                        backgroundColor: selected ? `${pc}20` : "rgba(255,255,255,0.02)",
                                        color: selected ? "#fff" : "rgba(255,255,255,0.5)",
                                    }}
                                >
                                    {opt.image_url && <img src={opt.image_url} alt={opt.label} className="w-12 h-12 object-cover rounded-xl mx-auto mb-3" />}
                                    {opt.label}
                                </motion.button>
                            )
                        })}
                    </div>
                )}

                {/* Dropdown */}
                {question.type === "dropdown" && (
                    <div className="relative">
                        <select
                            value={strValue}
                            onChange={e => onChange(e.target.value)}
                            className="w-full bg-transparent border-b-2 pb-3 pt-1 text-xl text-white font-medium focus:outline-none transition-colors appearance-none cursor-pointer pr-8"
                            style={{ borderColor: strValue ? pc : "rgba(255,255,255,0.15)" }}
                        >
                            <option value="" style={{ background: "#0f0a1a" }}>Selecciona...</option>
                            {(question.options || []).map(opt => (
                                <option key={opt.value} value={opt.value} style={{ background: "#0f0a1a" }}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-2 w-5 h-5 text-white/30 pointer-events-none" />
                    </div>
                )}

                {/* Rating — Stars (≤5) or Number scale (>5) */}
                {question.type === "rating" && (
                    <div className="space-y-3">
                        {(question.settings?.max || 5) <= 5 ? (
                            <div className="flex gap-2">
                                {Array.from({ length: question.settings?.max || 5 }, (_, i) => i + 1).map(n => (
                                    <motion.button
                                        key={n}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onChange(String(n))}
                                    >
                                        <Star
                                            className="w-10 h-10 transition-all"
                                            style={{
                                                color: Number(strValue) >= n ? "#fbbf24" : "rgba(255,255,255,0.15)",
                                                fill: Number(strValue) >= n ? "#fbbf24" : "none",
                                            }}
                                        />
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {Array.from(
                                    { length: (question.settings?.max || 10) - (question.settings?.min || 1) + 1 },
                                    (_, i) => i + (question.settings?.min || 1)
                                ).map(n => {
                                    const selected = strValue === String(n)
                                    return (
                                        <motion.button
                                            key={n}
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => onChange(String(n))}
                                            className="w-12 h-12 rounded-2xl border-2 font-black text-sm transition-all"
                                            style={{
                                                borderColor: selected ? pc : "rgba(255,255,255,0.1)",
                                                backgroundColor: selected ? pc : "rgba(255,255,255,0.03)",
                                                color: selected ? "#fff" : "rgba(255,255,255,0.4)",
                                            }}
                                        >
                                            {n}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        )}
                        {strValue && (
                            <p className="text-xs font-medium" style={{ color: pc }}>
                                Seleccionaste: {strValue}
                            </p>
                        )}
                        {hasError && <p className="text-xs font-bold text-red-400">Selecciona una opción</p>}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="pl-7 flex items-center gap-3 pt-2">
                {!isFirst && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPrev}
                        className="flex items-center justify-center w-11 h-11 rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-white/40" />
                    </motion.button>
                )}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onNext}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white transition-all shadow-lg"
                    style={{ backgroundColor: pc, boxShadow: `0 8px 24px ${pc}40` }}
                >
                    {isLast ? (
                        <><Check className="w-4 h-4" /> Enviar</>
                    ) : (
                        <>Siguiente <ChevronRight className="w-4 h-4" /></>
                    )}
                </motion.button>
                {!question.required && (
                    <button
                        onClick={onNext}
                        className="text-xs text-white/20 hover:text-white/40 font-medium transition-colors"
                    >
                        Omitir →
                    </button>
                )}
                <span className="ml-auto text-[10px] text-white/15 font-medium hidden md:block">
                    Presiona <kbd className="text-white/20">Enter ↵</kbd>
                </span>
            </div>
        </div>
    )
}

// ─── Main public form page ─────────────────────────────────────────────────────

export default function PublicFormPage() {
    const { slug } = useParams<{ slug: string }>()

    const [form, setForm] = useState<Form | null>(null)
    const [questions, setQuestions] = useState<FormQuestion[]>([])
    const [rules, setRules] = useState<FormLogicRule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [step, setStep] = useState<"welcome" | "questions" | "submitting" | "done">("welcome")
    const [currentQId, setCurrentQId] = useState<string | null>(null)
    const [history, setHistory] = useState<string[]>([])
    const [answers, setAnswers] = useState<Answers>({})
    const [errors, setErrors] = useState<Record<string, boolean>>({})

    // Result from submit
    const [bookingSlug, setBookingSlug] = useState<string | null>(null)
    const [prefill, setPrefill] = useState<{ name: string; email: string; phone: string } | null>(null)

    // Classic mode
    const [classicErrors, setClassicErrors] = useState<Record<string, boolean>>({})

    // Abandon tracking ref
    const hasStartedRef = useRef(false)
    const currentQIdRef = useRef<string | null>(null)
    const currentQIndexRef = useRef(0)
    const answersCountRef = useRef(0)

    useEffect(() => {
        currentQIdRef.current = currentQId
    }, [currentQId])

    useEffect(() => {
        answersCountRef.current = Object.keys(answers).length
    }, [answers])

    useEffect(() => {
        fetch(`/api/forms/${slug}/submit?event=view`)
            .then(r => r.json())
            .then(d => {
                if (d.form) {
                    setForm(d.form)
                    setQuestions(d.form.questions || [])
                    setRules(d.form.logic_rules || [])
                    if ((d.form.questions || []).length > 0) {
                        setCurrentQId(d.form.questions[0].id)
                    }
                } else {
                    setError("Formulario no disponible.")
                }
            })
            .catch(() => setError("Error al cargar el formulario."))
            .finally(() => setLoading(false))
    }, [slug])

    // Abandon beacon on page leave (after starting)
    useEffect(() => {
        const onUnload = () => {
            if (!hasStartedRef.current || !currentQIdRef.current) return
            const data = JSON.stringify({
                last_question_id: currentQIdRef.current,
                last_question_index: currentQIndexRef.current,
                answers_count: answersCountRef.current,
            })
            navigator.sendBeacon?.(`/api/forms/${slug}/abandon`, data)
        }
        window.addEventListener("beforeunload", onUnload)
        return () => window.removeEventListener("beforeunload", onUnload)
    }, [slug])

    const currentQuestion = questions.find(q => q.id === currentQId)
    const currentIdx = questions.findIndex(q => q.id === currentQId)
    const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0
    const isLast = currentQId ? getNextQuestionId(currentQId, questions, answers, rules) === null : true

    useEffect(() => {
        currentQIndexRef.current = currentIdx
    }, [currentIdx])

    const handleStart = () => {
        hasStartedRef.current = true
        fetch(`/api/forms/${slug}/submit?event=start`).catch(() => { })
        setStep("questions")
    }

    const handleNext = useCallback(() => {
        if (!currentQuestion || !currentQId) return
        const val = answers[currentQId]
        if (currentQuestion.required) {
            const empty = Array.isArray(val) ? val.length === 0 : !val
            if (empty) {
                setErrors(prev => ({ ...prev, [currentQId]: true }))
                // Shake the button — clear error after animation
                setTimeout(() => setErrors(prev => ({ ...prev, [currentQId]: false })), 1500)
                return
            }
        }
        setErrors(prev => ({ ...prev, [currentQId]: false }))
        const nextId = getNextQuestionId(currentQId, questions, answers, rules)
        setHistory(prev => [...prev, currentQId])
        if (nextId === null) {
            handleSubmit()
        } else {
            setCurrentQId(nextId)
        }
    }, [currentQuestion, currentQId, answers, questions, rules])

    const handlePrev = () => {
        const prev = history[history.length - 1]
        if (prev) {
            setCurrentQId(prev)
            setHistory(h => h.slice(0, -1))
        }
    }

    const handleSubmit = useCallback(async () => {
        setStep("submitting")
        hasStartedRef.current = false  // prevent abandon beacon on redirect
        try {
            const res = await fetch(`/api/forms/${slug}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers,
                    last_question_id: currentQIdRef.current,
                    last_question_index: currentQIndexRef.current,
                }),
            })
            const data = await res.json()
            if (data.booking_slug) {
                setBookingSlug(data.booking_slug)
                setPrefill(data.prefill)
            }
            setStep("done")
            if (form?.end_screen?.redirect_url && !data.booking_slug) {
                setTimeout(() => { window.location.href = (form.end_screen as any).redirect_url }, 2500)
            }
        } catch {
            setStep("done")
        }
    }, [answers, slug, form])

    const handleClassicSubmit = async () => {
        const errs: Record<string, boolean> = {}
        for (const q of questions) {
            if (q.required) {
                const val = answers[q.id]
                if (Array.isArray(val) ? val.length === 0 : !val) errs[q.id] = true
            }
        }
        if (Object.keys(errs).length > 0) { setClassicErrors(errs); return }
        await handleSubmit()
    }

    const design = form?.design
    const bgColor = design?.bg_color || "#0f0a1a"
    const pc = design?.primary_color || "#7c3aed"

    // ─── Loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: bgColor }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: pc }} />
            </div>
        )
    }

    if (error || !form) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: bgColor }}>
                <div className="text-center space-y-3 px-6">
                    <div className="text-4xl">🔗</div>
                    <p className="text-white/40 font-medium">{error || "Formulario no disponible"}</p>
                </div>
            </div>
        )
    }

    // ─── Done screen
    if (step === "done") {
        const endScreen = form.end_screen as any
        return (
            <div className="min-h-screen flex flex-col" style={{ background: bgColor }}>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl"
                        style={{ backgroundColor: pc, boxShadow: `0 20px 60px ${pc}50` }}
                    >
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-3xl md:text-5xl font-black text-white max-w-md leading-tight"
                    >
                        {endScreen?.title || "¡Gracias!"}
                    </motion.h1>
                    {endScreen?.subtitle && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-white/40 mt-4 text-lg font-medium max-w-sm"
                        >
                            {endScreen.subtitle}
                        </motion.p>
                    )}

                    {/* Booking CTA — show calendar button if configured */}
                    {bookingSlug && prefill && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="mt-10 flex flex-col items-center gap-3"
                        >
                            <p className="text-sm font-black text-white/40 uppercase tracking-widest">
                                Siguiente paso
                            </p>
                            <a
                                href={`/book/${bookingSlug}?name=${encodeURIComponent(prefill.name)}&email=${encodeURIComponent(prefill.email)}&phone=${encodeURIComponent(prefill.phone)}`}
                                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 shadow-2xl"
                                style={{ backgroundColor: pc, boxShadow: `0 12px 40px ${pc}50` }}
                            >
                                <Calendar className="w-5 h-5" />
                                Agenda tu cita ahora
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <p className="text-xs text-white/15 font-medium">Elige el horario que más te convenga</p>
                        </motion.div>
                    )}

                    {endScreen?.redirect_url && !bookingSlug && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-xs text-white/15 mt-8 font-medium"
                        >
                            Redirigiendo en un momento...
                        </motion.p>
                    )}
                </div>
                <div className="py-4 text-center">
                    <p className="text-[11px] text-white/10 font-medium">Powered by <span style={{ color: pc, opacity: 0.4 }}>Magic Funnel</span></p>
                </div>
            </div>
        )
    }

    // ─── Submitting overlay
    if (step === "submitting") {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: bgColor }}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: pc }} />
                    <p className="text-white/30 text-sm font-medium">Enviando respuestas...</p>
                </div>
            </div>
        )
    }

    // ─── Welcome screen
    if (step === "welcome") {
        const ws = form.welcome_screen as any
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: bgColor }}>
                {design?.logo_url && (
                    <motion.img
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        src={design.logo_url}
                        alt="Logo"
                        className="h-12 object-contain mb-10"
                    />
                )}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-14 h-14 rounded-[1.2rem] flex items-center justify-center mb-8"
                    style={{ backgroundColor: `${pc}20`, border: `2px solid ${pc}30` }}
                >
                    <Sparkles className="w-7 h-7" style={{ color: pc }} />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-black text-white max-w-2xl leading-tight"
                >
                    {ws?.title || form.name}
                </motion.h1>
                {ws?.subtitle && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 mt-5 text-lg font-medium max-w-lg leading-relaxed"
                    >
                        {ws.subtitle}
                    </motion.p>
                )}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    className="mt-10 flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-white transition-all"
                    style={{ backgroundColor: pc, boxShadow: `0 12px 40px ${pc}50` }}
                >
                    {ws?.button_label || "Comenzar"}
                    <ChevronRight className="w-5 h-5" />
                </motion.button>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-white/15 mt-6 font-medium"
                >
                    {questions.length} pregunta{questions.length !== 1 ? "s" : ""} · ~{Math.max(1, Math.round(questions.length * 0.4))} min
                </motion.p>
            </div>
        )
    }

    // ─── Classic mode
    if (form.mode === "classic") {
        return (
            <div className="min-h-screen py-16 px-4" style={{ background: bgColor }}>
                <div className="max-w-xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black text-white">{form.name}</h1>
                        {form.description && <p className="text-white/40 font-medium">{form.description}</p>}
                    </div>
                    {questions.map(q => (
                        <div key={q.id} className="space-y-3">
                            <label className="block text-white font-black">
                                {q.label}
                                {q.required && <span style={{ color: pc }} className="ml-1">*</span>}
                            </label>
                            {q.description && <p className="text-sm text-white/30">{q.description}</p>}
                            {["short_text", "email", "phone", "number"].includes(q.type) && (
                                <input
                                    type={q.type === "email" ? "email" : q.type === "phone" ? "tel" : q.type === "number" ? "number" : "text"}
                                    value={(answers[q.id] as string) || ""}
                                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder={q.placeholder || ""}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none transition-colors placeholder:text-white/15"
                                    style={{ borderColor: classicErrors[q.id] ? "#ef4444" : undefined }}
                                />
                            )}
                            {q.type === "long_text" && (
                                <textarea
                                    value={(answers[q.id] as string) || ""}
                                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    rows={3}
                                    placeholder={q.placeholder || ""}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none transition-colors placeholder:text-white/15 resize-none"
                                />
                            )}
                            {q.type === "date" && (
                                <input type="date" value={(answers[q.id] as string) || ""} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none" />
                            )}
                            {["single_choice", "dropdown"].includes(q.type) && (
                                <div className="space-y-2">
                                    {(q.options || []).map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                                            className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm"
                                            style={{ borderColor: (answers[q.id] as string) === opt.value ? pc : "rgba(255,255,255,0.08)", backgroundColor: (answers[q.id] as string) === opt.value ? `${pc}15` : "rgba(255,255,255,0.02)", color: (answers[q.id] as string) === opt.value ? "#fff" : "rgba(255,255,255,0.5)" }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {q.type === "multiple_choice" && (
                                <div className="space-y-2">
                                    {(q.options || []).map(opt => {
                                        const arr = (answers[q.id] as string[]) || []
                                        const checked = arr.includes(opt.value)
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: checked ? arr.filter(v => v !== opt.value) : [...arr, opt.value] }))}
                                                className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm"
                                                style={{ borderColor: checked ? pc : "rgba(255,255,255,0.08)", backgroundColor: checked ? `${pc}15` : "rgba(255,255,255,0.02)", color: checked ? "#fff" : "rgba(255,255,255,0.5)" }}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                            {q.type === "rating" && (
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from({ length: (q.settings?.max || 5) - (q.settings?.min || 1) + 1 }, (_, i) => i + (q.settings?.min || 1)).map(n => {
                                        const sel = (answers[q.id] as string) === String(n)
                                        return (
                                            <button key={n} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: String(n) }))}
                                                className="w-10 h-10 rounded-xl border-2 font-black text-sm transition-all"
                                                style={{ borderColor: sel ? pc : "rgba(255,255,255,0.1)", backgroundColor: sel ? pc : "transparent", color: sel ? "#fff" : "rgba(255,255,255,0.4)" }}
                                            >
                                                {n}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                            {classicErrors[q.id] && <p className="text-xs font-bold text-red-400">Este campo es requerido</p>}
                        </div>
                    ))}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClassicSubmit}
                        disabled={step === "submitting"}
                        className="w-full py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2 shadow-lg"
                        style={{ backgroundColor: pc, boxShadow: `0 8px 32px ${pc}40` }}
                    >
                        {step === "submitting" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Enviar respuestas
                    </motion.button>
                    <p className="text-center text-[11px] text-white/10 font-medium">Powered by Magic Funnel</p>
                </div>
            </div>
        )
    }

    // ─── Conversational mode (questions step)
    return (
        <div className="min-h-screen flex flex-col" style={{ background: bgColor }}>
            <div className="flex-1 flex items-center justify-center py-12 px-2">
                <AnimatePresence mode="wait">
                    {currentQuestion && (
                        <motion.div
                            key={currentQId}
                            initial={{ opacity: 0, x: 40, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -40, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            className="w-full"
                        >
                            <QuestionView
                                question={currentQuestion}
                                value={answers[currentQId!] ?? (currentQuestion.type === "multiple_choice" ? [] : "")}
                                onChange={v => setAnswers(prev => ({ ...prev, [currentQId!]: v }))}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                isFirst={history.length === 0}
                                isLast={isLast}
                                primaryColor={pc}
                                progress={progress}
                                total={questions.length}
                                currentNum={currentIdx + 1}
                                hasError={!!errors[currentQId!]}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="py-4 text-center shrink-0">
                <p className="text-[11px] text-white/10 font-medium">Powered by <span style={{ color: pc, opacity: 0.35 }}>Magic Funnel</span></p>
            </div>
        </div>
    )
}
