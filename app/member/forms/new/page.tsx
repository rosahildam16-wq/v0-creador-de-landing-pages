"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft, Sparkles, MessageSquare, AlignLeft, Loader2 } from "lucide-react"

const TEMPLATES = [
    {
        id: "blank",
        name: "En Blanco",
        description: "Empieza desde cero con total libertad.",
        icon: AlignLeft,
        color: "from-slate-600 to-slate-700",
        questions: [],
    },
    {
        id: "lead_capture",
        name: "Captura de Leads",
        description: "Formulario esencial para capturar nombre, email y teléfono.",
        icon: Sparkles,
        color: "from-violet-600 to-indigo-600",
        questions: [
            { type: "short_text", label: "¿Cuál es tu nombre completo?", required: true, settings: { crm_field: "nombre" } },
            { type: "email", label: "¿Cuál es tu email?", required: true, settings: { crm_field: "email" } },
            { type: "phone", label: "¿Tu número de WhatsApp?", required: false, settings: { crm_field: "whatsapp" } },
        ],
    },
    {
        id: "qualification",
        name: "Calificación de Prospectos",
        description: "Quiz funnel para calificar leads antes de una llamada.",
        icon: MessageSquare,
        color: "from-emerald-600 to-teal-600",
        questions: [
            { type: "short_text", label: "¿Cuál es tu nombre?", required: true, settings: { crm_field: "nombre" } },
            { type: "email", label: "¿Tu email?", required: true, settings: { crm_field: "email" } },
            { type: "phone", label: "¿Tu WhatsApp?", required: false, settings: { crm_field: "whatsapp" } },
            { type: "single_choice", label: "¿A qué te dedicas actualmente?", required: true, options: [{ value: "empleado", label: "Empleado" }, { value: "emprendedor", label: "Emprendedor" }, { value: "networker", label: "Network Marketer" }, { value: "otro", label: "Otro" }] },
            { type: "single_choice", label: "¿Cuánto tiempo disponible tienes por semana?", required: true, options: [{ value: "2-5h", label: "2-5 horas" }, { value: "5-10h", label: "5-10 horas" }, { value: "10-20h", label: "10-20 horas" }, { value: "fulltime", label: "Tiempo completo" }] },
            { type: "rating", label: "Del 1 al 10, ¿qué tan urgente es generar ingresos extra para ti?", required: true, settings: { min: 1, max: 10 } },
        ],
    },
    {
        id: "event_registration",
        name: "Registro a Evento",
        description: "Formulario para webinar, masterclass o evento presencial.",
        icon: Sparkles,
        color: "from-rose-600 to-pink-600",
        questions: [
            { type: "short_text", label: "Nombre completo", required: true, settings: { crm_field: "nombre" } },
            { type: "email", label: "Email de confirmación", required: true, settings: { crm_field: "email" } },
            { type: "phone", label: "WhatsApp (para recordatorio)", required: false, settings: { crm_field: "whatsapp" } },
            { type: "single_choice", label: "¿Cómo te enteraste del evento?", required: false, options: [{ value: "instagram", label: "Instagram" }, { value: "facebook", label: "Facebook" }, { value: "referido", label: "Me lo recomendaron" }, { value: "otro", label: "Otro" }] },
        ],
    },
]

export default function NewFormPage() {
    const router = useRouter()
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[1])
    const [name, setName] = useState("")
    const [mode, setMode] = useState<"conversational" | "classic">("conversational")
    const [creating, setCreating] = useState(false)

    const handleCreate = async () => {
        const trimmedName = name.trim() || selectedTemplate.name
        setCreating(true)
        try {
            // Create form
            const res = await fetch("/api/member/forms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmedName, mode }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            const formId = data.form.id

            // If template has questions, save them
            if (selectedTemplate.questions.length > 0) {
                const { generateQuestionId } = await import("@/lib/form-types")
                const questions = selectedTemplate.questions.map((q, i) => ({
                    ...q,
                    id: generateQuestionId(),
                    form_id: formId,
                    order_index: i,
                    required: (q as any).required ?? false,
                }))
                await fetch(`/api/member/forms/${formId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ questions }),
                })
            }

            router.push(`/member/forms/${formId}`)
        } catch (err) {
            console.error(err)
            setCreating(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16">
            <div className="max-w-5xl mx-auto space-y-12 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push("/member/forms")}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Volver</span>
                    </button>
                </div>

                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                        Nuevo <span className="text-violet-500">Formulario</span>
                    </h1>
                    <p className="text-white/40 mt-3 text-lg font-medium">
                        Elige una plantilla y personaliza tu formulario inteligente.
                    </p>
                </div>

                {/* Template selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {TEMPLATES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setSelectedTemplate(t)
                                if (!name) setName(t.name === "En Blanco" ? "" : t.name)
                            }}
                            className={`relative rounded-2xl border p-5 text-left transition-all ${selectedTemplate.id === t.id
                                ? "border-violet-500 bg-violet-500/10"
                                : "border-white/[0.06] bg-white/[0.02] hover:border-white/20"
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-3`}>
                                <t.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-black text-white text-sm">{t.name}</h3>
                            <p className="text-[11px] text-white/30 mt-1 leading-relaxed">{t.description}</p>
                            {t.questions.length > 0 && (
                                <span className="absolute top-3 right-3 text-[10px] text-white/20 font-bold">{t.questions.length} preguntas</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Configuration */}
                <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-8 space-y-8">
                    <h2 className="text-xl font-black">Configuración</h2>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Nombre del formulario</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={selectedTemplate.name}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium placeholder:text-white/20 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40">Modo de experiencia</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { value: "conversational", label: "Conversacional", desc: "Una pregunta a la vez. Estilo Typeform." },
                                { value: "classic", label: "Clásico", desc: "Todas las preguntas en una sola página." },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setMode(opt.value as "conversational" | "classic")}
                                    className={`rounded-2xl border p-4 text-left transition-all ${mode === opt.value
                                        ? "border-violet-500 bg-violet-500/10"
                                        : "border-white/[0.06] hover:border-white/20"
                                        }`}
                                >
                                    <p className="font-black text-sm text-white">{opt.label}</p>
                                    <p className="text-[11px] text-white/30 mt-1">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                    >
                        {creating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Creando formulario...</>
                        ) : (
                            <>Crear formulario →</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
