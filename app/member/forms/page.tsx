"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, ClipboardList, Eye, Trash2, BarChart2, ExternalLink, Copy, CheckCircle, Globe, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Form } from "@/lib/form-types"
import { conversionRate } from "@/lib/form-types"

const STATUS_CLASSES: Record<string, string> = {
    draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
}

export default function FormsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [forms, setForms] = useState<Form[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/member/forms")
            .then(r => r.json())
            .then(d => setForms(d.forms || []))
            .finally(() => setLoading(false))
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este formulario? Esta acción no se puede deshacer.")) return
        setDeletingId(id)
        await fetch(`/api/member/forms/${id}`, { method: "DELETE" })
        setForms(prev => prev.filter(f => f.id !== id))
        setDeletingId(null)
    }

    const handleCopyLink = async (slug: string, id: string) => {
        const url = `${window.location.origin}/form/${slug}`
        await navigator.clipboard.writeText(url)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
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
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                            Form <span className="text-violet-500">Builder</span>
                        </h1>
                        <p className="text-white/40 mt-2 text-sm font-medium">
                            Crea formularios inteligentes que capturan y califican leads automáticamente.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/member/forms/new")}
                        className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-2xl text-sm font-black transition-all shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Formulario
                    </button>
                </div>

                {/* Stats bar */}
                {forms.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Formularios", value: forms.length },
                            { label: "Publicados", value: forms.filter(f => f.status === "published").length },
                            { label: "Respuestas totales", value: forms.reduce((acc, f) => acc + (f.completions || 0), 0) },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 text-center">
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-[11px] text-white/30 font-medium uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Forms grid */}
                {forms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center">
                            <ClipboardList className="w-10 h-10 text-white/20" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white/40">Aún no tienes formularios</h3>
                            <p className="text-sm text-white/20 mt-2">Crea tu primer formulario inteligente</p>
                        </div>
                        <button
                            onClick={() => router.push("/member/forms/new")}
                            className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-2xl text-sm font-black transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Crear mi primer formulario
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {forms.map((form, i) => (
                            <motion.div
                                key={form.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="group rounded-[2rem] border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-violet-500/20 transition-all"
                            >
                                {/* Card top accent */}
                                <div className="h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600" />

                                <div className="p-6 space-y-4">
                                    {/* Title + status */}
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-black text-white text-lg leading-tight line-clamp-2">{form.name}</h3>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${STATUS_CLASSES[form.status]}`}>
                                            {form.status === "published" ? "Publicado" : "Borrador"}
                                        </span>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {[
                                            { icon: Eye, label: "Vistas", value: form.views || 0 },
                                            { icon: FileText, label: "Respuestas", value: form.completions || 0 },
                                            { icon: BarChart2, label: "Conversión", value: conversionRate(form) },
                                        ].map(s => (
                                            <div key={s.label} className="rounded-xl bg-white/5 p-2.5">
                                                <p className="text-sm font-black text-white">{s.value}</p>
                                                <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mode badge */}
                                    <p className="text-[11px] text-white/20 font-medium">
                                        {form.mode === "conversational" ? "Modo conversacional (Typeform)" : "Modo clásico"} · actualizado {new Date(form.updated_at).toLocaleDateString("es-MX")}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            onClick={() => router.push(`/member/forms/${form.id}`)}
                                            className="flex-1 py-2.5 bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white rounded-xl text-xs font-black transition-all text-center"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => router.push(`/member/forms/${form.id}/responses`)}
                                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                            title="Ver respuestas"
                                        >
                                            <FileText className="w-4 h-4 text-white/40" />
                                        </button>
                                        {form.status === "published" && (
                                            <>
                                                <button
                                                    onClick={() => handleCopyLink(form.slug, form.id)}
                                                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                                    title="Copiar enlace"
                                                >
                                                    {copiedId === form.id
                                                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                        : <Copy className="w-4 h-4 text-white/40" />
                                                    }
                                                </button>
                                                <a
                                                    href={`/form/${form.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                                    title="Ver formulario"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-white/40" />
                                                </a>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDelete(form.id)}
                                            disabled={deletingId === form.id}
                                            className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
