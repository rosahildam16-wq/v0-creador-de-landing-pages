"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft, Eye, Play, CheckCircle, TrendingDown, Users, BarChart2, AlertCircle } from "lucide-react"
import type { Form, FormQuestion } from "@/lib/form-types"

interface SubmissionRow {
    id: string
    abandoned: boolean
    last_question_id: string | null
    last_question_index: number | null
    submitted_at: string
}

interface QuestionStats {
    question: FormQuestion
    reached: number
    abandoned: number
    abandonRate: number
}

export default function FormAnalyticsPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [form, setForm] = useState<Form | null>(null)
    const [questions, setQuestions] = useState<FormQuestion[]>([])
    const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch(`/api/member/forms/${id}`).then(r => r.json()),
            fetch(`/api/member/forms/${id}/submissions?page=1&limit=500`).then(r => r.json()),
        ]).then(([formData, subData]) => {
            if (formData.form) {
                setForm(formData.form)
                setQuestions(formData.form.questions || [])
            }
            setSubmissions(subData.submissions || [])
        }).finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
        )
    }

    if (!form) return null

    // ── Derived stats ──────────────────────────────────────────────
    const total = submissions.length
    const completed = submissions.filter(s => !s.abandoned).length
    const abandoned = submissions.filter(s => s.abandoned).length
    const convRate = form.starts ? ((form.completions / form.starts) * 100).toFixed(1) : "0"
    const viewToStart = form.views ? ((form.starts / form.views) * 100).toFixed(1) : "0"

    // Per-question abandon stats: count how many people left at each question
    const questionStats: QuestionStats[] = questions.map((q, idx) => {
        // "reached" = all submissions that got to at least this question
        // For completed: they reached all questions. For abandoned: they reached up to last_question_index
        const reached = submissions.filter(s => {
            if (!s.abandoned) return true  // completed = reached all
            return (s.last_question_index ?? -1) >= idx
        }).length

        const abandonedHere = submissions.filter(s => {
            return s.abandoned && s.last_question_id === q.id
        }).length

        const abandonRate = reached > 0 ? (abandonedHere / reached) * 100 : 0

        return { question: q, reached, abandoned: abandonedHere, abandonRate }
    })

    const maxReached = Math.max(...questionStats.map(s => s.reached), 1)

    // Submissions over time (last 14 days)
    const now = new Date()
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (13 - i))
        return d.toISOString().split("T")[0]
    })

    const submissionsByDay = days.map(day => ({
        day,
        label: new Date(day).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }),
        count: submissions.filter(s => !s.abandoned && s.submitted_at?.startsWith(day)).length,
    }))
    const maxDay = Math.max(...submissionsByDay.map(d => d.count), 1)

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/member/forms/${id}`)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black">{form.name}</h1>
                        <p className="text-xs text-white/30 mt-0.5 uppercase tracking-widest">Analytics</p>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Eye, label: "Vistas", value: form.views || 0, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { icon: Play, label: "Iniciaron", value: form.starts || 0, note: `${viewToStart}% de vistas`, color: "text-violet-400", bg: "bg-violet-500/10" },
                        { icon: CheckCircle, label: "Completados", value: completed, note: `${convRate}% conversión`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { icon: TrendingDown, label: "Abandonos", value: abandoned, note: `${form.starts ? ((abandoned / form.starts) * 100).toFixed(1) : 0}% abandono`, color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map((kpi, i) => (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-3"
                        >
                            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{kpi.value.toLocaleString()}</p>
                                <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold mt-0.5">{kpi.label}</p>
                                {kpi.note && <p className="text-[11px] text-white/20 mt-1">{kpi.note}</p>}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Conversion funnel */}
                <div className="rounded-[2rem] bg-white/[0.02] border border-white/[0.06] p-8">
                    <h2 className="font-black text-white text-lg mb-6">Embudo de conversión</h2>
                    <div className="space-y-3">
                        {[
                            { label: "Vistas", value: form.views || 0, prev: form.views || 1 },
                            { label: "Iniciaron", value: form.starts || 0, prev: form.views || 1 },
                            { label: "Completaron", value: form.completions || 0, prev: form.starts || 1 },
                        ].map((step, i) => {
                            const pct = i === 0 ? 100 : Math.round((step.value / step.prev) * 100)
                            return (
                                <div key={step.label} className="flex items-center gap-4">
                                    <div className="w-24 text-xs font-bold text-white/40 text-right shrink-0">{step.label}</div>
                                    <div className="flex-1 h-8 bg-white/5 rounded-xl overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 120, damping: 20 }}
                                            className="h-full rounded-xl"
                                            style={{ background: i === 0 ? "#3b82f6" : i === 1 ? "#7c3aed" : "#10b981" }}
                                        />
                                        <span className="absolute inset-0 flex items-center px-3 text-xs font-black text-white">
                                            {step.value.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-12 text-xs font-black text-right shrink-0"
                                        style={{ color: pct >= 50 ? "#10b981" : pct >= 25 ? "#f59e0b" : "#ef4444" }}>
                                        {pct}%
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Submissions over time */}
                <div className="rounded-[2rem] bg-white/[0.02] border border-white/[0.06] p-8">
                    <h2 className="font-black text-white text-lg mb-6">Respuestas (últimos 14 días)</h2>
                    <div className="flex items-end gap-1.5 h-40">
                        {submissionsByDay.map((day, i) => (
                            <div key={day.day} className="flex-1 flex flex-col items-center gap-1.5">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${maxDay > 0 ? (day.count / maxDay) * 100 : 0}%` }}
                                    transition={{ delay: i * 0.03, type: "spring", stiffness: 150, damping: 20 }}
                                    className="w-full rounded-t-lg min-h-0"
                                    style={{ background: day.count > 0 ? "#7c3aed" : "rgba(255,255,255,0.05)" }}
                                    title={`${day.count} respuestas`}
                                />
                                {i % 3 === 0 && (
                                    <span className="text-[9px] text-white/20 font-medium whitespace-nowrap">{day.label}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Per-question abandon analysis */}
                {questionStats.length > 0 && (
                    <div className="rounded-[2rem] bg-white/[0.02] border border-white/[0.06] p-8">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="font-black text-white text-lg">Abandono por pregunta</h2>
                        </div>
                        <p className="text-xs text-white/30 mb-6">
                            Muestra en qué pregunta las personas dejan de responder. Las barras representan cuántos llegaron a cada pregunta.
                        </p>
                        {total === 0 ? (
                            <div className="flex flex-col items-center py-12 gap-3 text-center">
                                <BarChart2 className="w-8 h-8 text-white/10" />
                                <p className="text-white/20 text-sm">Sin datos aún — comparte el formulario para ver analytics</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questionStats.map((qs, i) => (
                                    <div key={qs.question.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-white/60 truncate max-w-sm">
                                                <span className="text-white/25 mr-2">{i + 1}.</span>
                                                {qs.question.label}
                                            </p>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <span className="text-xs text-white/40 font-medium">{qs.reached} vieron</span>
                                                {qs.abandoned > 0 && (
                                                    <span className="text-xs font-black text-amber-400">
                                                        {qs.abandoned} salieron ({qs.abandonRate.toFixed(0)}%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full flex">
                                                {/* Completed portion */}
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${maxReached > 0 ? ((qs.reached - qs.abandoned) / maxReached) * 100 : 0}%` }}
                                                    transition={{ delay: i * 0.05, type: "spring", stiffness: 120, damping: 20 }}
                                                    className="h-full bg-emerald-500/60 rounded-l-full"
                                                />
                                                {/* Abandoned portion */}
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${maxReached > 0 ? (qs.abandoned / maxReached) * 100 : 0}%` }}
                                                    transition={{ delay: i * 0.05 + 0.1, type: "spring", stiffness: 120, damping: 20 }}
                                                    className="h-full bg-amber-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500/60" /><span className="text-[11px] text-white/30">Continuaron</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/50" /><span className="text-[11px] text-white/30">Abandonaron aquí</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tips */}
                {Number(convRate) < 30 && form.completions > 0 && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-black text-amber-300">Conversión baja ({convRate}%)</p>
                            <p className="text-xs text-amber-400/60 mt-1">
                                Considera reducir el número de preguntas, usar modo conversacional, o mejorar el texto de bienvenida.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
