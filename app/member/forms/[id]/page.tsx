"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, Plus, Trash2, ChevronUp, ChevronDown, Save,
    Globe, Eye, Loader2, Copy, CheckCircle,
    AlignLeft, Mail, Phone, List, CheckSquare,
    ChevronDownSquare, Hash, Calendar, Star, LayoutGrid,
    Layers, Palette, GitBranch, Share2, Type, BarChart2, FileText, Tag, CalendarCheck
} from "lucide-react"
import type { Form, FormQuestion, FormLogicRule, QuestionType } from "@/lib/form-types"
import {
    QUESTION_TYPE_LABELS, generateQuestionId, generateRuleId,
    DEFAULT_DESIGN, DEFAULT_WELCOME, DEFAULT_END
} from "@/lib/form-types"

type Tab = "questions" | "design" | "logic" | "publish"

const QUESTION_ICONS: Record<QuestionType, React.ElementType> = {
    short_text: AlignLeft,
    long_text: Type,
    email: Mail,
    phone: Phone,
    single_choice: List,
    multiple_choice: CheckSquare,
    dropdown: ChevronDownSquare,
    number: Hash,
    date: Calendar,
    rating: Star,
    visual_buttons: LayoutGrid,
}

const PIPELINE_STAGES = [
    { value: "lead_nuevo", label: "Lead nuevo" },
    { value: "contactado", label: "Contactado" },
    { value: "interesado", label: "Interesado" },
    { value: "llamada_agendada", label: "Llamada agendada" },
    { value: "propuesta", label: "Propuesta enviada" },
]

const QUESTION_TYPES_GROUPED: { group: string; types: QuestionType[] }[] = [
    { group: "Texto", types: ["short_text", "long_text", "email", "phone"] },
    { group: "Opciones", types: ["single_choice", "multiple_choice", "dropdown", "visual_buttons"] },
    { group: "Datos", types: ["number", "date", "rating"] },
]

export default function FormBuilderPage() {
    const router = useRouter()
    const params = useParams()
    const formId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>("questions")
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
    const [showAddPanel, setShowAddPanel] = useState(false)
    const [copied, setCopied] = useState(false)

    const [form, setForm] = useState<Form | null>(null)
    const [questions, setQuestions] = useState<FormQuestion[]>([])
    const [rules, setRules] = useState<FormLogicRule[]>([])

    useEffect(() => {
        fetch(`/api/member/forms/${formId}`)
            .then(r => r.json())
            .then(d => {
                if (d.form) {
                    setForm(d.form)
                    setQuestions(d.form.questions || [])
                    setRules(d.form.logic_rules || [])
                    if (d.form.questions?.length > 0) {
                        setSelectedQuestionId(d.form.questions[0].id)
                    }
                }
            })
            .finally(() => setLoading(false))
    }, [formId])

    const handleSave = useCallback(async () => {
        if (!form) return
        setSaving(true)
        try {
            const payload: any = {
                name: form.name,
                description: form.description,
                mode: form.mode,
                welcome_screen: form.welcome_screen,
                end_screen: form.end_screen,
                design: form.design,
                settings: form.settings,
                questions: questions.map((q, i) => ({ ...q, order_index: i })),
                logic_rules: rules,
            }
            await fetch(`/api/member/forms/${formId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } finally {
            setSaving(false)
        }
    }, [form, formId, questions, rules])

    const handlePublish = async () => {
        if (!form) return
        setPublishing(true)
        await fetch(`/api/member/forms/${formId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: form.status === "published" ? "draft" : "published",
                questions: questions.map((q, i) => ({ ...q, order_index: i })),
                logic_rules: rules,
                name: form.name,
                mode: form.mode,
                welcome_screen: form.welcome_screen,
                end_screen: form.end_screen,
                design: form.design,
                settings: form.settings,
            }),
        })
        setForm(prev => prev ? { ...prev, status: prev.status === "published" ? "draft" : "published" } : prev)
        setPublishing(false)
    }

    const addQuestion = (type: QuestionType) => {
        const newQ: FormQuestion = {
            id: generateQuestionId(),
            form_id: formId,
            type,
            label: `${QUESTION_TYPE_LABELS[type]}`,
            required: type === "email",
            order_index: questions.length,
            options: ["single_choice", "multiple_choice", "dropdown", "visual_buttons"].includes(type)
                ? [{ value: "opcion_1", label: "Opción 1" }, { value: "opcion_2", label: "Opción 2" }]
                : undefined,
            settings: type === "rating" ? { min: 1, max: 5, stars: 5 } : undefined,
        }
        setQuestions(prev => [...prev, newQ])
        setSelectedQuestionId(newQ.id)
        setShowAddPanel(false)
    }

    const removeQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id))
        setRules(prev => prev.filter(r => r.question_id !== id && r.target_question_id !== id))
        if (selectedQuestionId === id) setSelectedQuestionId(questions.find(q => q.id !== id)?.id || null)
    }

    const moveQuestion = (id: string, dir: -1 | 1) => {
        setQuestions(prev => {
            const idx = prev.findIndex(q => q.id === id)
            const newIdx = idx + dir
            if (newIdx < 0 || newIdx >= prev.length) return prev
            const updated = [...prev]
            ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
            return updated
        })
    }

    const updateQuestion = (id: string, patch: Partial<FormQuestion>) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q))
    }

    const updateForm = (patch: Partial<Form>) => setForm(prev => prev ? { ...prev, ...patch } : prev)

    const addOption = (qId: string) => {
        const q = questions.find(q => q.id === qId)
        if (!q) return
        const opts = q.options || []
        const newOpt = { value: `opcion_${opts.length + 1}`, label: `Opción ${opts.length + 1}` }
        updateQuestion(qId, { options: [...opts, newOpt] })
    }

    const updateOption = (qId: string, idx: number, label: string) => {
        const q = questions.find(q => q.id === qId)
        if (!q?.options) return
        const opts = [...q.options]
        opts[idx] = { value: label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""), label }
        updateQuestion(qId, { options: opts })
    }

    const removeOption = (qId: string, idx: number) => {
        const q = questions.find(q => q.id === qId)
        if (!q?.options) return
        updateQuestion(qId, { options: q.options.filter((_, i) => i !== idx) })
    }

    const addRule = () => {
        if (questions.length < 2) return
        const rule: FormLogicRule = {
            id: generateRuleId(),
            form_id: formId,
            question_id: questions[0].id,
            condition_value: "",
            action_type: "jump_to",
            target_question_id: questions[1]?.id,
        }
        setRules(prev => [...prev, rule])
    }

    const updateRule = (id: string, patch: Partial<FormLogicRule>) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
    }

    const copyPublicLink = async () => {
        if (!form) return
        await navigator.clipboard.writeText(`${window.location.origin}/form/${form.slug}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const selectedQuestion = questions.find(q => q.id === selectedQuestionId)

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    if (!form) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/40">
                Formulario no encontrado.
            </div>
        )
    }

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/40 backdrop-blur shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/member/forms")} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <input
                        value={form.name}
                        onChange={e => updateForm({ name: e.target.value })}
                        className="bg-transparent text-white font-black text-base focus:outline-none border-b border-transparent focus:border-white/20 transition-colors px-1"
                    />
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${form.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                        {form.status === "published" ? "Publicado" : "Borrador"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push(`/member/forms/${formId}/responses`)}
                        className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        title="Respuestas"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => router.push(`/member/forms/${formId}/analytics`)}
                        className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        title="Analytics"
                    >
                        <BarChart2 className="w-4 h-4" />
                    </button>
                    <a
                        href={`/form/${form.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        title="Preview"
                    >
                        <Eye className="w-4 h-4" />
                    </a>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-black transition-all"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                        {saved ? "Guardado" : "Guardar"}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${form.status === "published"
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-violet-600 hover:bg-violet-500 text-white"
                            }`}
                    >
                        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {form.status === "published" ? "Despublicar" : "Publicar"}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 border-b border-white/[0.06] bg-black/20 shrink-0">
                {([
                    { id: "questions", label: "Preguntas", icon: Layers },
                    { id: "design", label: "Diseño", icon: Palette },
                    { id: "logic", label: "Lógica", icon: GitBranch },
                    { id: "publish", label: "Publicar", icon: Share2 },
                ] as { id: Tab; label: string; icon: React.ElementType }[]).map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === t.id
                            ? "border-violet-500 text-white"
                            : "border-transparent text-white/30 hover:text-white/60"
                            }`}
                    >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">

                {/* ─── QUESTIONS TAB ─────────────────────────────── */}
                {activeTab === "questions" && (
                    <>
                        {/* Left: question list */}
                        <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
                            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-white/30">Preguntas ({questions.length})</span>
                                <button
                                    onClick={() => setShowAddPanel(p => !p)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600/20 hover:bg-violet-600 rounded-lg text-xs font-black text-violet-300 hover:text-white transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                    Agregar
                                </button>
                            </div>

                            <AnimatePresence>
                                {showAddPanel && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-b border-white/[0.06] bg-black/40"
                                    >
                                        <div className="p-3 space-y-3">
                                            {QUESTION_TYPES_GROUPED.map(group => (
                                                <div key={group.group}>
                                                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold mb-1.5">{group.group}</p>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {group.types.map(type => {
                                                            const Icon = QUESTION_ICONS[type]
                                                            return (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => addQuestion(type)}
                                                                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 text-left transition-colors"
                                                                >
                                                                    <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                                                    <span className="text-[11px] text-white/60 font-medium">{QUESTION_TYPE_LABELS[type]}</span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {questions.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                                        <Plus className="w-8 h-8 text-white/10" />
                                        <p className="text-xs text-white/20 font-medium">Agrega tu primera pregunta</p>
                                    </div>
                                )}
                                {questions.map((q, i) => {
                                    const Icon = QUESTION_ICONS[q.type]
                                    const isSelected = selectedQuestionId === q.id
                                    return (
                                        <div
                                            key={q.id}
                                            onClick={() => setSelectedQuestionId(q.id)}
                                            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-violet-600/20 border border-violet-500/30" : "hover:bg-white/5 border border-transparent"}`}
                                        >
                                            <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{q.label || "Sin título"}</p>
                                                <p className="text-[10px] text-white/20">{i + 1} · {QUESTION_TYPE_LABELS[q.type]}{q.required ? " · requerida" : ""}</p>
                                            </div>
                                            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={e => { e.stopPropagation(); moveQuestion(q.id, -1) }} disabled={i === 0} className="p-0.5 hover:bg-white/10 rounded disabled:opacity-20">
                                                    <ChevronUp className="w-3 h-3" />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); moveQuestion(q.id, 1) }} disabled={i === questions.length - 1} className="p-0.5 hover:bg-white/10 rounded disabled:opacity-20">
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Right: question editor */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {!selectedQuestion ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <Layers className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p className="text-white/30 font-medium">Selecciona o agrega una pregunta</p>
                                </div>
                            ) : (
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {(() => { const Icon = QUESTION_ICONS[selectedQuestion.type]; return <Icon className="w-5 h-5 text-violet-400" /> })()}
                                            <span className="text-sm font-black text-violet-400 uppercase tracking-widest">{QUESTION_TYPE_LABELS[selectedQuestion.type]}</span>
                                        </div>
                                        <button
                                            onClick={() => removeQuestion(selectedQuestion.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Eliminar
                                        </button>
                                    </div>

                                    {/* Label */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Pregunta</label>
                                        <textarea
                                            value={selectedQuestion.label}
                                            onChange={e => updateQuestion(selectedQuestion.id, { label: e.target.value })}
                                            rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-medium placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors resize-none text-lg"
                                            placeholder="Escribe tu pregunta aquí..."
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Descripción (opcional)</label>
                                        <input
                                            type="text"
                                            value={selectedQuestion.description || ""}
                                            onChange={e => updateQuestion(selectedQuestion.id, { description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                                            placeholder="Texto de ayuda o instrucción adicional..."
                                        />
                                    </div>

                                    {/* Placeholder (for text types) */}
                                    {["short_text", "long_text", "email", "phone", "number"].includes(selectedQuestion.type) && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-white/40">Placeholder</label>
                                            <input
                                                type="text"
                                                value={selectedQuestion.placeholder || ""}
                                                onChange={e => updateQuestion(selectedQuestion.id, { placeholder: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                                                placeholder="Texto placeholder..."
                                            />
                                        </div>
                                    )}

                                    {/* Options (for choice types) */}
                                    {["single_choice", "multiple_choice", "dropdown", "visual_buttons"].includes(selectedQuestion.type) && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-black uppercase tracking-widest text-white/40">Opciones</label>
                                            <div className="space-y-2">
                                                {(selectedQuestion.options || []).map((opt, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/30">{idx + 1}</div>
                                                        <input
                                                            type="text"
                                                            value={opt.label}
                                                            onChange={e => updateOption(selectedQuestion.id, idx, e.target.value)}
                                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors"
                                                        />
                                                        <button onClick={() => removeOption(selectedQuestion.id, idx)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addOption(selectedQuestion.id)}
                                                    className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 font-bold transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Agregar opción
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rating settings */}
                                    {selectedQuestion.type === "rating" && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-white/40">Escala máxima</label>
                                            <div className="flex gap-2">
                                                {[5, 10].map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => updateQuestion(selectedQuestion.id, { settings: { ...selectedQuestion.settings, max: n, stars: n } })}
                                                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all border ${(selectedQuestion.settings?.max || 5) === n ? "border-violet-500 bg-violet-500/10 text-violet-300" : "border-white/10 text-white/40 hover:border-white/20"}`}
                                                    >
                                                        1–{n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* CRM field mapping */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Mapear al CRM</label>
                                        <select
                                            value={selectedQuestion.settings?.crm_field || ""}
                                            onChange={e => updateQuestion(selectedQuestion.id, { settings: { ...selectedQuestion.settings, crm_field: e.target.value as any || undefined } })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors"
                                        >
                                            <option value="">Sin mapear</option>
                                            <option value="nombre">Nombre del lead</option>
                                            <option value="email">Email del lead</option>
                                            <option value="whatsapp">WhatsApp del lead</option>
                                        </select>
                                        <p className="text-[11px] text-white/20">La respuesta se guardará en el campo correspondiente del lead.</p>
                                    </div>

                                    {/* Required toggle */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                        <div>
                                            <p className="text-sm font-black text-white">Pregunta requerida</p>
                                            <p className="text-xs text-white/30 mt-0.5">El usuario no puede continuar sin responder.</p>
                                        </div>
                                        <button
                                            onClick={() => updateQuestion(selectedQuestion.id, { required: !selectedQuestion.required })}
                                            className={`w-12 h-6 rounded-full border-2 transition-all relative ${selectedQuestion.required ? "bg-violet-600 border-violet-600" : "bg-transparent border-white/20"}`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${selectedQuestion.required ? "left-6" : "left-0.5"}`} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ─── DESIGN TAB ────────────────────────────────── */}
                {activeTab === "design" && (
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <h2 className="text-xl font-black">Diseño del formulario</h2>

                            {/* Mode */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-white/40">Modo de visualización</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: "conversational", label: "Conversacional", desc: "Una pregunta a la vez (Typeform)" },
                                        { value: "classic", label: "Clásico", desc: "Todas las preguntas en pantalla" },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateForm({ mode: opt.value as any })}
                                            className={`rounded-2xl border p-4 text-left transition-all ${form.mode === opt.value ? "border-violet-500 bg-violet-500/10" : "border-white/[0.06] hover:border-white/20"}`}
                                        >
                                            <p className="font-black text-sm text-white">{opt.label}</p>
                                            <p className="text-[11px] text-white/30 mt-1">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-white/40">Color principal</label>
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                                        <input
                                            type="color"
                                            value={form.design?.primary_color || "#7c3aed"}
                                            onChange={e => updateForm({ design: { ...(form.design || DEFAULT_DESIGN), primary_color: e.target.value } })}
                                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        />
                                        <span className="text-sm font-mono text-white/60">{form.design?.primary_color || "#7c3aed"}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-white/40">Color de fondo</label>
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                                        <input
                                            type="color"
                                            value={form.design?.bg_color || "#0f0a1a"}
                                            onChange={e => updateForm({ design: { ...(form.design || DEFAULT_DESIGN), bg_color: e.target.value } })}
                                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                                        />
                                        <span className="text-sm font-mono text-white/60">{form.design?.bg_color || "#0f0a1a"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Welcome screen */}
                            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <h3 className="font-black text-white">Pantalla de bienvenida</h3>
                                {[
                                    { key: "title", label: "Título", placeholder: "Bienvenido" },
                                    { key: "subtitle", label: "Subtítulo", placeholder: "Completa este formulario..." },
                                    { key: "button_label", label: "Texto del botón", placeholder: "Comenzar" },
                                ].map(field => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/30">{field.label}</label>
                                        <input
                                            type="text"
                                            value={(form.welcome_screen as any)?.[field.key] || ""}
                                            onChange={e => updateForm({ welcome_screen: { ...(form.welcome_screen || DEFAULT_WELCOME), [field.key]: e.target.value } })}
                                            placeholder={field.placeholder}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* End screen */}
                            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <h3 className="font-black text-white">Pantalla final</h3>
                                {[
                                    { key: "title", label: "Título", placeholder: "¡Gracias!" },
                                    { key: "subtitle", label: "Subtítulo", placeholder: "Nos pondremos en contacto pronto." },
                                    { key: "redirect_url", label: "Redirigir a URL (opcional)", placeholder: "https://..." },
                                ].map(field => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/30">{field.label}</label>
                                        <input
                                            type="text"
                                            value={(form.end_screen as any)?.[field.key] || ""}
                                            onChange={e => updateForm({ end_screen: { ...(form.end_screen || DEFAULT_END), [field.key]: e.target.value } })}
                                            placeholder={field.placeholder}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/20"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── LOGIC TAB ─────────────────────────────────── */}
                {activeTab === "logic" && (
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black">Lógica condicional</h2>
                                    <p className="text-xs text-white/30 mt-1">Redirige al usuario según sus respuestas.</p>
                                </div>
                                <button
                                    onClick={addRule}
                                    disabled={questions.length < 2}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white rounded-xl text-sm font-black transition-all disabled:opacity-30"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva regla
                                </button>
                            </div>

                            {rules.length === 0 ? (
                                <div className="text-center py-16 text-white/20">
                                    <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">Sin reglas de lógica</p>
                                    <p className="text-xs mt-1">Las reglas permiten mostrar u ocultar preguntas según respuestas.</p>
                                </div>
                            ) : rules.map(rule => (
                                <div key={rule.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-widest text-violet-400">Regla</span>
                                        <button onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))} className="p-1.5 hover:bg-red-500/20 rounded-lg">
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/30 w-6 shrink-0">Si</span>
                                            <select
                                                value={rule.question_id}
                                                onChange={e => updateRule(rule.id, { question_id: e.target.value })}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                                            >
                                                {questions.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/30 w-6 shrink-0">es</span>
                                            <input
                                                type="text"
                                                value={rule.condition_value}
                                                onChange={e => updateRule(rule.id, { condition_value: e.target.value })}
                                                placeholder="valor de la respuesta..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-white/20"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/30 w-6 shrink-0">→</span>
                                            <select
                                                value={rule.action_type}
                                                onChange={e => updateRule(rule.id, { action_type: e.target.value as any })}
                                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                                            >
                                                <option value="jump_to">Ir a pregunta</option>
                                                <option value="end_form">Terminar formulario</option>
                                            </select>
                                            {rule.action_type === "jump_to" && (
                                                <select
                                                    value={rule.target_question_id || ""}
                                                    onChange={e => updateRule(rule.id, { target_question_id: e.target.value })}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                                                >
                                                    {questions.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── PUBLISH TAB ───────────────────────────────── */}
                {activeTab === "publish" && (
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <h2 className="text-xl font-black">Publicar y compartir</h2>

                            {/* Pipeline + CRM settings */}
                            <div className="space-y-5 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="w-4 h-4 text-violet-400" />
                                    <h3 className="font-black text-white">Conexión con CRM y Pipeline</h3>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-white/30">Etapa del pipeline al ingresar</label>
                                    <select
                                        value={form.settings?.pipeline_stage || "lead_nuevo"}
                                        onChange={e => updateForm({ settings: { ...form.settings, pipeline_stage: e.target.value } })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors"
                                    >
                                        {PIPELINE_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-white/30">
                                        <Tag className="w-3 h-3 inline mr-1" />
                                        Etiqueta automática al lead
                                    </label>
                                    <input
                                        type="text"
                                        value={form.settings?.tag || ""}
                                        onChange={e => updateForm({ settings: { ...form.settings, tag: e.target.value || undefined } })}
                                        placeholder="Ej: formulario-captacion, webinar-junio..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors placeholder:text-white/15"
                                    />
                                    <p className="text-[11px] text-white/20">El lead recibirá esta etiqueta automáticamente al enviar el formulario.</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black text-white">Notificación por email</p>
                                        <p className="text-xs text-white/30 mt-0.5">Recibir email cuando alguien complete el formulario.</p>
                                    </div>
                                    <button
                                        onClick={() => updateForm({ settings: { ...form.settings, notify_email: !form.settings?.notify_email } })}
                                        className={`w-12 h-6 rounded-full border-2 transition-all relative ${form.settings?.notify_email ? "bg-violet-600 border-violet-600" : "bg-transparent border-white/20"}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.settings?.notify_email ? "left-6" : "left-0.5"}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Booking post-submit */}
                            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarCheck className="w-4 h-4 text-emerald-400" />
                                        <h3 className="font-black text-white">Redirigir a citas después del envío</h3>
                                    </div>
                                    <button
                                        onClick={() => updateForm({ end_screen: { ...(form.end_screen || {}), show_booking: !(form.end_screen as any)?.show_booking } as any })}
                                        className={`w-12 h-6 rounded-full border-2 transition-all relative ${(form.end_screen as any)?.show_booking ? "bg-emerald-600 border-emerald-600" : "bg-transparent border-white/20"}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${(form.end_screen as any)?.show_booking ? "left-6" : "left-0.5"}`} />
                                    </button>
                                </div>
                                {(form.end_screen as any)?.show_booking && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/30">Slug del calendario de citas</label>
                                        <input
                                            type="text"
                                            value={(form.end_screen as any)?.booking_calendar_slug || ""}
                                            onChange={e => updateForm({ end_screen: { ...(form.end_screen as any), booking_calendar_slug: e.target.value } as any })}
                                            placeholder="mi-calendario"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/15"
                                        />
                                        <p className="text-[11px] text-white/20">
                                            Después del formulario, el lead verá un botón para agendar una cita. El nombre y email se pre-llenarán automáticamente.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Publish status */}
                            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                <h3 className="font-black text-white">Estado de publicación</h3>
                                <div className={`p-4 rounded-xl ${form.status === "published" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                                    <p className={`font-black text-sm ${form.status === "published" ? "text-emerald-400" : "text-amber-400"}`}>
                                        {form.status === "published" ? "✓ Publicado — el formulario está activo" : "Borrador — no visible al público"}
                                    </p>
                                </div>
                                <button
                                    onClick={handlePublish}
                                    disabled={publishing}
                                    className={`w-full py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${form.status === "published"
                                        ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                        : "bg-violet-600 hover:bg-violet-500 text-white"
                                        }`}
                                >
                                    {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {form.status === "published" ? "Despublicar" : "Publicar formulario"}
                                </button>
                            </div>

                            {/* Share links */}
                            {form.status === "published" && (
                                <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                                    <h3 className="font-black text-white">Compartir</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/30">Enlace público</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-violet-300 text-sm font-mono truncate">
                                                {typeof window !== "undefined" ? `${window.location.origin}/form/${form.slug}` : `/form/${form.slug}`}
                                            </code>
                                            <button onClick={copyPublicLink} className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600/20 hover:bg-violet-600 rounded-xl text-sm font-black text-violet-300 hover:text-white transition-all shrink-0">
                                                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                {copied ? "Copiado" : "Copiar"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-white/30">Código de incrustación</label>
                                        <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] font-mono text-white/40 overflow-x-auto whitespace-pre-wrap">
                                            {`<iframe\n  src="${typeof window !== "undefined" ? window.location.origin : ""}/form/${form.slug}"\n  width="100%"\n  height="600"\n  frameborder="0"\n></iframe>`}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
