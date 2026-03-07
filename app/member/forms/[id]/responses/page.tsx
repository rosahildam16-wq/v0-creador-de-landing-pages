"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronDown, ChevronUp, Download, Users, Clock } from "lucide-react"
import type { FormSubmission } from "@/lib/form-types"

export default function FormResponsesPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [formName, setFormName] = useState("")
    const [submissions, setSubmissions] = useState<FormSubmission[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        Promise.all([
            fetch(`/api/member/forms/${id}`).then(r => r.json()),
            fetch(`/api/member/forms/${id}/submissions`).then(r => r.json()),
        ]).then(([formData, subData]) => {
            if (formData.form) setFormName(formData.form.name)
            setSubmissions(subData.submissions || [])
            setTotal(subData.total || 0)
        }).finally(() => setLoading(false))
    }, [id])

    const exportCSV = () => {
        if (!submissions.length) return
        const allQuestions = new Set<string>()
        submissions.forEach(s => s.answers?.forEach(a => allQuestions.add(a.question_label || a.question_id)))
        const headers = ["Fecha", "Lead ID", ...Array.from(allQuestions)]
        const rows = submissions.map(s => {
            const answerMap = new Map(s.answers?.map(a => [a.question_label || a.question_id, a.value]))
            return [
                new Date(s.submitted_at).toLocaleString("es-MX"),
                s.lead_id || "",
                ...Array.from(allQuestions).map(q => `"${(answerMap.get(q) || "").replace(/"/g, '""')}"`),
            ]
        })
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `respuestas-${id}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push(`/member/forms/${id}`)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black">{formName}</h1>
                            <p className="text-xs text-white/30 mt-0.5">Respuestas del formulario</p>
                        </div>
                    </div>
                    <button
                        onClick={exportCSV}
                        disabled={!submissions.length}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-sm font-black transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{total}</p>
                            <p className="text-xs text-white/30 uppercase tracking-widest">Respuestas totales</p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">
                                {submissions.length > 0
                                    ? new Date(submissions[0].submitted_at).toLocaleDateString("es-MX")
                                    : "—"
                                }
                            </p>
                            <p className="text-xs text-white/30 uppercase tracking-widest">Última respuesta</p>
                        </div>
                    </div>
                </div>

                {/* Submissions list */}
                {submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <Users className="w-12 h-12 text-white/10" />
                        <p className="text-white/30 font-medium">Aún no hay respuestas</p>
                        <p className="text-xs text-white/15">Comparte el enlace del formulario para empezar a recibir respuestas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {submissions.map((sub, i) => (
                            <div key={sub.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                                <button
                                    onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-sm font-black text-violet-400">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">
                                                {sub.answers?.find(a => a.question_label?.toLowerCase().includes("email") || a.question_label?.toLowerCase().includes("nombre"))?.value || `Respuesta #${i + 1}`}
                                            </p>
                                            <p className="text-xs text-white/30 mt-0.5">
                                                {new Date(sub.submitted_at).toLocaleString("es-MX")}
                                                {sub.lead_id && <span className="ml-2 text-violet-400/60">· Lead creado</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/20">{sub.answers?.length || 0} respuestas</span>
                                        {expandedId === sub.id ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                                    </div>
                                </button>

                                {expandedId === sub.id && (
                                    <div className="border-t border-white/[0.06] px-5 pb-5 space-y-3 pt-4">
                                        {(sub.answers || []).map(answer => (
                                            <div key={answer.id} className="flex gap-4">
                                                <p className="text-xs font-black text-white/30 uppercase tracking-wide w-40 shrink-0 pt-0.5">{answer.question_label}</p>
                                                <p className="text-sm text-white font-medium">
                                                    {(() => {
                                                        try {
                                                            const parsed = JSON.parse(answer.value)
                                                            if (Array.isArray(parsed)) return parsed.join(", ")
                                                        } catch { }
                                                        return answer.value
                                                    })()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
