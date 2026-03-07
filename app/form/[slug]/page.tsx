"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft, Check, Loader2, Star, Calendar, Phone, Mail, AlignLeft, ChevronDown } from "lucide-react"
import type { Form, FormQuestion, FormLogicRule } from "@/lib/form-types"

type Answers = Record<string, string | string[]>

function getNextQuestionId(
    currentId: string,
    questions: FormQuestion[],
    answers: Answers,
    rules: FormLogicRule[]
): string | null {
    const currentIdx = questions.findIndex(q => q.id === currentId)

    // Check logic rules for the current question
    const matchingRule = rules.find(r => {
        if (r.question_id !== currentId) return false
        const answer = answers[currentId]
        const answerStr = Array.isArray(answer) ? answer.join(", ") : String(answer || "")
        return answerStr.toLowerCase().includes(r.condition_value.toLowerCase()) ||
            answerStr === r.condition_value
    })

    if (matchingRule) {
        if (matchingRule.action_type === "end_form") return null
        return matchingRule.target_question_id || null
    }

    // Default: next question
    const next = questions[currentIdx + 1]
    return next ? next.id : null
}

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
}) {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
    const strValue = Array.isArray(value) ? "" : (value || "")
    const arrValue = Array.isArray(value) ? value : []

    useEffect(() => {
        setTimeout(() => (inputRef.current as any)?.focus?.(), 200)
    }, [question.id])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && question.type !== "long_text") {
            e.preventDefault()
            onNext()
        }
    }

    const toggleMulti = (opt: string) => {
        if (arrValue.includes(opt)) {
            onChange(arrValue.filter(v => v !== opt))
        } else {
            onChange([...arrValue, opt])
        }
    }

    const inputCls = `w-full bg-white/5 border-b-2 border-white/20 focus:border-[${primaryColor}] px-0 py-3 text-white text-xl font-medium placeholder:text-white/20 focus:outline-none transition-colors bg-transparent`

    return (
        <div className="flex flex-col gap-8 w-full max-w-xl mx-auto">
            {/* Progress */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: primaryColor }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>
                <span className="text-xs font-bold text-white/30">{currentNum}/{total}</span>
            </div>

            {/* Question */}
            <div className="space-y-2">
                <div className="flex items-start gap-3">
                    <span className="text-sm font-black text-white/20 mt-1 shrink-0">{currentNum} →</span>
                    <div>
                        <h2 className="text-2xl font-black text-white leading-tight">{question.label}</h2>
                        {question.description && (
                            <p className="text-sm text-white/40 mt-2 font-medium">{question.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Input area */}
            <div className="space-y-4">
                {/* Short text */}
                {question.type === "short_text" && (
                    <input
                        ref={inputRef as any}
                        type="text"
                        value={strValue}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={question.placeholder || "Escribe tu respuesta..."}
                        className={inputCls}
                    />
                )}

                {/* Long text */}
                {question.type === "long_text" && (
                    <textarea
                        ref={inputRef as any}
                        value={strValue}
                        onChange={e => onChange(e.target.value)}
                        placeholder={question.placeholder || "Escribe tu respuesta..."}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-lg font-medium placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    />
                )}

                {/* Email */}
                {question.type === "email" && (
                    <input
                        ref={inputRef as any}
                        type="email"
                        value={strValue}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={question.placeholder || "tu@email.com"}
                        className={inputCls}
                    />
                )}

                {/* Phone */}
                {question.type === "phone" && (
                    <input
                        ref={inputRef as any}
                        type="tel"
                        value={strValue}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={question.placeholder || "+52 55 1234 5678"}
                        className={inputCls}
                    />
                )}

                {/* Number */}
                {question.type === "number" && (
                    <input
                        ref={inputRef as any}
                        type="number"
                        value={strValue}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={question.placeholder || "0"}
                        className={inputCls}
                    />
                )}

                {/* Date */}
                {question.type === "date" && (
                    <input
                        ref={inputRef as any}
                        type="date"
                        value={strValue}
                        onChange={e => onChange(e.target.value)}
                        className={inputCls}
                    />
                )}

                {/* Single choice */}
                {question.type === "single_choice" && (
                    <div className="space-y-2">
                        {(question.options || []).map((opt, i) => (
                            <motion.button
                                key={opt.value}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => { onChange(opt.value); }}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all font-medium ${strValue === opt.value
                                    ? "border-violet-500 bg-violet-500/10 text-white"
                                    : "border-white/10 hover:border-white/30 text-white/70 hover:text-white"
                                    }`}
                                style={strValue === opt.value ? { borderColor: primaryColor, backgroundColor: `${primaryColor}18` } : {}}
                            >
                                <span className="w-7 h-7 rounded-xl border-2 flex items-center justify-center text-xs font-black shrink-0 transition-all"
                                    style={strValue === opt.value ? { borderColor: primaryColor, backgroundColor: primaryColor, color: "white" } : { borderColor: "rgba(255,255,255,0.2)" }}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                {opt.label}
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Multiple choice */}
                {question.type === "multiple_choice" && (
                    <div className="space-y-2">
                        {(question.options || []).map((opt, i) => {
                            const checked = arrValue.includes(opt.value)
                            return (
                                <motion.button
                                    key={opt.value}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => toggleMulti(opt.value)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all font-medium ${checked
                                        ? "border-violet-500 bg-violet-500/10 text-white"
                                        : "border-white/10 hover:border-white/30 text-white/70 hover:text-white"
                                        }`}
                                    style={checked ? { borderColor: primaryColor, backgroundColor: `${primaryColor}18` } : {}}
                                >
                                    <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-violet-500" : ""}`}
                                        style={checked ? { borderColor: primaryColor, backgroundColor: primaryColor } : { borderColor: "rgba(255,255,255,0.2)" }}>
                                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                                    </span>
                                    {opt.label}
                                </motion.button>
                            )
                        })}
                    </div>
                )}

                {/* Visual buttons */}
                {question.type === "visual_buttons" && (
                    <div className="grid grid-cols-2 gap-3">
                        {(question.options || []).map((opt, i) => (
                            <motion.button
                                key={opt.value}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => onChange(opt.value)}
                                className={`p-5 rounded-2xl border-2 text-center transition-all font-bold text-sm ${strValue === opt.value
                                    ? "border-violet-500 bg-violet-500/10 text-white"
                                    : "border-white/10 hover:border-white/30 text-white/70 hover:text-white"
                                    }`}
                                style={strValue === opt.value ? { borderColor: primaryColor, backgroundColor: `${primaryColor}18` } : {}}
                            >
                                {opt.image_url && <img src={opt.image_url} alt={opt.label} className="w-12 h-12 object-cover rounded-xl mx-auto mb-2" />}
                                {opt.label}
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Dropdown */}
                {question.type === "dropdown" && (
                    <div className="relative">
                        <select
                            value={strValue}
                            onChange={e => onChange(e.target.value)}
                            className="w-full bg-white/5 border-b-2 border-white/20 focus:border-violet-500 px-0 py-3 text-white text-xl font-medium focus:outline-none transition-colors appearance-none cursor-pointer bg-transparent"
                        >
                            <option value="">Selecciona una opción...</option>
                            {(question.options || []).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                    </div>
                )}

                {/* Rating */}
                {question.type === "rating" && (
                    <div className="space-y-3">
                        {(question.settings?.max || 5) <= 5 ? (
                            // Star rating
                            <div className="flex gap-3">
                                {Array.from({ length: question.settings?.max || 5 }, (_, i) => i + 1).map(n => (
                                    <button
                                        key={n}
                                        onClick={() => onChange(String(n))}
                                        className="transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${Number(strValue) >= n ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            // Numeric scale
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: (question.settings?.max || 10) - (question.settings?.min || 1) + 1 }, (_, i) => i + (question.settings?.min || 1)).map(n => (
                                    <button
                                        key={n}
                                        onClick={() => onChange(String(n))}
                                        className={`w-12 h-12 rounded-2xl border-2 font-black text-sm transition-all ${strValue === String(n)
                                            ? "border-violet-500 bg-violet-500 text-white"
                                            : "border-white/10 hover:border-white/30 text-white/50 hover:text-white"
                                            }`}
                                        style={strValue === String(n) ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        )}
                        {strValue && <p className="text-sm text-white/40 font-medium">Seleccionaste: {strValue}</p>}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3 pt-2">
                {!isFirst && (
                    <button
                        onClick={onPrev}
                        className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-sm transition-all text-white/60 hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all text-white"
                    style={{ backgroundColor: primaryColor }}
                >
                    {isLast ? "Enviar" : "Siguiente"}
                    {!isLast && <ChevronRight className="w-4 h-4" />}
                    {isLast && <Check className="w-4 h-4" />}
                </button>
                {!question.required && (
                    <button onClick={onNext} className="text-xs text-white/20 hover:text-white/40 font-medium transition-colors">
                        Saltar
                    </button>
                )}
            </div>
        </div>
    )
}

export default function PublicFormPage() {
    const { slug } = useParams<{ slug: string }>()

    const [form, setForm] = useState<Form | null>(null)
    const [questions, setQuestions] = useState<FormQuestion[]>([])
    const [rules, setRules] = useState<FormLogicRule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Conversation state
    const [step, setStep] = useState<"welcome" | "questions" | "done">("welcome")
    const [currentQId, setCurrentQId] = useState<string | null>(null)
    const [history, setHistory] = useState<string[]>([]) // question id history for back
    const [answers, setAnswers] = useState<Answers>({})
    const [submitting, setSubmitting] = useState(false)

    // Classic mode: all questions at once
    const [classicErrors, setClassicErrors] = useState<Record<string, string>>({})

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
                    setError("Formulario no encontrado o no publicado.")
                }
            })
            .catch(() => setError("Error al cargar el formulario."))
            .finally(() => setLoading(false))
    }, [slug])

    const currentQuestion = questions.find(q => q.id === currentQId)
    const currentIdx = questions.findIndex(q => q.id === currentQId)
    const isLast = currentQId ? getNextQuestionId(currentQId, questions, answers, rules) === null : true
    const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0

    const handleStart = () => {
        fetch(`/api/forms/${slug}/submit?event=start`).catch(() => { })
        setStep("questions")
    }

    const handleNext = () => {
        if (!currentQuestion || !currentQId) return
        const val = answers[currentQId]

        // Validate required
        if (currentQuestion.required) {
            const empty = Array.isArray(val) ? val.length === 0 : !val
            if (empty) {
                // Shake animation hint — just show an inline note
                return
            }
        }

        const nextId = getNextQuestionId(currentQId, questions, answers, rules)
        setHistory(prev => [...prev, currentQId])

        if (nextId === null) {
            handleSubmit()
        } else {
            setCurrentQId(nextId)
        }
    }

    const handlePrev = () => {
        const prev = history[history.length - 1]
        if (prev) {
            setCurrentQId(prev)
            setHistory(h => h.slice(0, -1))
        }
    }

    const handleSubmit = useCallback(async () => {
        setSubmitting(true)
        try {
            // Normalize answers for submission
            const normalized: Record<string, string | string[]> = {}
            for (const [k, v] of Object.entries(answers)) {
                normalized[k] = v
            }
            await fetch(`/api/forms/${slug}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: normalized }),
            })
            setStep("done")
            // Redirect if configured
            if (form?.end_screen?.redirect_url) {
                setTimeout(() => { window.location.href = form.end_screen!.redirect_url! }, 2500)
            }
        } finally {
            setSubmitting(false)
        }
    }, [answers, slug, form])

    const handleClassicSubmit = async () => {
        const errors: Record<string, string> = {}
        for (const q of questions) {
            if (q.required) {
                const val = answers[q.id]
                const empty = Array.isArray(val) ? val.length === 0 : !val
                if (empty) errors[q.id] = "Este campo es requerido"
            }
        }
        if (Object.keys(errors).length > 0) { setClassicErrors(errors); return }
        await handleSubmit()
    }

    const design = form?.design
    const bgColor = design?.bg_color || "#0f0a1a"
    const primaryColor = design?.primary_color || "#7c3aed"

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            </div>
        )
    }

    if (error || !form) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                <div className="text-center space-y-4">
                    <p className="text-white/60 text-lg font-medium">{error || "Formulario no disponible"}</p>
                </div>
            </div>
        )
    }

    // ─── DONE SCREEN ─────────────────────────────────────────────────
    if (step === "done") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: bgColor }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Check className="w-10 h-10 text-white" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-5xl font-black text-white"
                >
                    {form.end_screen?.title || "¡Gracias!"}
                </motion.h1>
                {form.end_screen?.subtitle && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/40 mt-4 text-lg font-medium max-w-md"
                    >
                        {form.end_screen.subtitle}
                    </motion.p>
                )}
                {form.end_screen?.redirect_url && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-xs text-white/20 mt-6 font-medium"
                    >
                        Redirigiendo...
                    </motion.p>
                )}
            </div>
        )
    }

    // ─── WELCOME SCREEN ──────────────────────────────────────────────
    if (step === "welcome") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: bgColor }}>
                {design?.logo_url && (
                    <motion.img
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        src={design.logo_url}
                        alt="Logo"
                        className="h-12 object-contain mb-8"
                    />
                )}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl font-black text-white max-w-2xl leading-tight"
                >
                    {form.welcome_screen?.title || form.name}
                </motion.h1>
                {form.welcome_screen?.subtitle && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/40 mt-4 text-lg font-medium max-w-xl"
                    >
                        {form.welcome_screen.subtitle}
                    </motion.p>
                )}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleStart}
                    className="mt-10 flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                >
                    {form.welcome_screen?.button_label || "Comenzar"}
                    <ChevronRight className="w-5 h-5" />
                </motion.button>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-white/15 mt-6"
                >
                    {questions.length} pregunta{questions.length !== 1 ? "s" : ""} · aproximadamente 2 minutos
                </motion.p>
            </div>
        )
    }

    // ─── CLASSIC MODE ────────────────────────────────────────────────
    if (form.mode === "classic") {
        return (
            <div className="min-h-screen py-16 px-4" style={{ backgroundColor: bgColor }}>
                <div className="max-w-xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black text-white">{form.name}</h1>
                        {form.description && <p className="text-white/40 font-medium">{form.description}</p>}
                    </div>
                    {questions.map(q => (
                        <div key={q.id} className="space-y-3">
                            <label className="block text-white font-black">
                                {q.label}
                                {q.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            {q.description && <p className="text-sm text-white/30">{q.description}</p>}

                            {["short_text", "email", "phone", "number"].includes(q.type) && (
                                <input
                                    type={q.type === "email" ? "email" : q.type === "phone" ? "tel" : q.type === "number" ? "number" : "text"}
                                    value={(answers[q.id] as string) || ""}
                                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    placeholder={q.placeholder || ""}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
                                />
                            )}
                            {q.type === "long_text" && (
                                <textarea
                                    value={(answers[q.id] as string) || ""}
                                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    rows={3}
                                    placeholder={q.placeholder || ""}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20 resize-none"
                                />
                            )}
                            {q.type === "date" && (
                                <input
                                    type="date"
                                    value={(answers[q.id] as string) || ""}
                                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-violet-500 transition-colors"
                                />
                            )}
                            {["single_choice", "dropdown"].includes(q.type) && (
                                <div className="space-y-2">
                                    {(q.options || []).map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all font-medium text-sm ${(answers[q.id] as string) === opt.value ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"}`}
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
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    const cur = (answers[q.id] as string[]) || []
                                                    const next = cur.includes(opt.value) ? cur.filter(v => v !== opt.value) : [...cur, opt.value]
                                                    setAnswers(prev => ({ ...prev, [q.id]: next }))
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all font-medium text-sm ${arr.includes(opt.value) ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"}`}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                            {q.type === "rating" && (
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from({ length: (q.settings?.max || 5) - (q.settings?.min || 1) + 1 }, (_, i) => i + (q.settings?.min || 1)).map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: String(n) }))}
                                            className={`w-10 h-10 rounded-xl border font-black text-sm transition-all ${(answers[q.id] as string) === String(n) ? "border-violet-500 bg-violet-500 text-white" : "border-white/10 text-white/50 hover:border-white/30"}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {classicErrors[q.id] && (
                                <p className="text-xs text-red-400 font-bold">{classicErrors[q.id]}</p>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={handleClassicSubmit}
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl font-black text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        Enviar respuestas
                    </button>
                </div>
            </div>
        )
    }

    // ─── CONVERSATIONAL MODE ─────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor }}>
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <AnimatePresence mode="wait">
                    {submitting ? (
                        <motion.div
                            key="submitting"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
                            <p className="text-white/40 font-medium">Enviando respuestas...</p>
                        </motion.div>
                    ) : currentQuestion ? (
                        <motion.div
                            key={currentQId}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            className="w-full"
                        >
                            <QuestionView
                                question={currentQuestion}
                                value={answers[currentQId!] || (["multiple_choice"].includes(currentQuestion.type) ? [] : "")}
                                onChange={v => setAnswers(prev => ({ ...prev, [currentQId!]: v }))}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                isFirst={history.length === 0}
                                isLast={isLast}
                                primaryColor={primaryColor}
                                progress={progress}
                                total={questions.length}
                                currentNum={currentIdx + 1}
                            />
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Bottom powered by */}
            <div className="py-4 text-center">
                <p className="text-[11px] text-white/10 font-medium">Powered by Magic Funnel</p>
            </div>
        </div>
    )
}
