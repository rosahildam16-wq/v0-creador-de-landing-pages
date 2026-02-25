"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus, Plane, Layout, Sparkles, ArrowRight, MousePointer2,
    Rocket, Search, Filter, MoreHorizontal, Copy, Trash2,
    Eye, Settings, Zap, Users, Target, MousePointer
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for initial UI
const MOCK_FUNNELS = [
    {
        id: "f1",
        name: "Embudo de Lanzamiento 2026",
        steps: 3,
        visits: 1240,
        leads: 342,
        conversion: "27.5%",
        status: "active",
        type: "Webinar",
        color: "from-violet-500 to-fuchsia-500",
    },
    {
        id: "f2",
        name: "Captación de Líderes VIP",
        steps: 2,
        visits: 850,
        leads: 120,
        conversion: "14.1%",
        status: "draft",
        type: "Lead Magnet",
        color: "from-blue-500 to-cyan-500",
    },
    {
        id: "f3",
        name: "Cuestionario de Diagnóstico",
        steps: 4,
        visits: 2100,
        leads: 890,
        conversion: "42.3%",
        status: "active",
        type: "Quiz Funnel",
        color: "from-emerald-500 to-teal-500",
    }
]

export default function MagicBuilderHub() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    if (!mounted) return null

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-12 pb-24">
            {/* --- HERO HEADER --- */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-black/40 p-12 backdrop-blur-3xl">
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest"
                        >
                            <Sparkles className="w-3 h-3" />
                            IA Powered Builder
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black tracking-tight text-white"
                        >
                            Crea <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent underline decoration-violet-500/30">Magia</span> Digital
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-white/50 max-w-lg leading-relaxed"
                        >
                            Diseña embudos de alta conversión en segundos. Sin código, sin estrés, solo resultados.
                        </motion.p>
                    </div>

                    <Link
                        href="/member/builder/new"
                        className="group relative flex items-center justify-center gap-4 bg-white text-black px-8 py-6 rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all hover:shadow-[0_20px_50px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 group-hover:text-white transition-colors">Nuevo Embudo</span>
                        <Plus className="relative z-10 w-6 h-6 transition-transform group-hover:rotate-180 group-hover:text-white" />
                    </Link>
                </div>
            </div>

            {/* --- STATS MINI GRID --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Visitas Totales", val: "12,400", icon: Eye, color: "text-blue-400" },
                    { label: "Leads Generados", val: "2,890", icon: Users, color: "text-emerald-400" },
                    { label: "Conv. Promedio", val: "23.4%", icon: Target, color: "text-violet-400" },
                    { label: "Embudos Activos", val: "8", icon: Rocket, color: "text-fuchsia-400" },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        className="p-6 rounded-3xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3 mb-2 text-white/40">
                            <s.icon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{s.label}</span>
                        </div>
                        <div className={cn("text-2xl font-black text-white")}>{s.val}</div>
                    </motion.div>
                ))}
            </div>

            {/* --- SEARCHBAR --- */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Buscar embudos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] px-12 py-4 rounded-2xl outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white transition-colors text-sm font-bold">
                        <Filter className="w-4 h-4" />
                        Filtrar
                    </button>
                    <button className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white transition-colors text-sm font-bold">
                        <Layout className="w-4 h-4" />
                        Vista
                    </button>
                </div>
            </div>

            {/* --- GRID OF FUNNELS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {MOCK_FUNNELS.map((f, i) => (
                        <Link
                            key={f.id}
                            href={`/member/builder/${f.id}`}
                            className="group relative cursor-pointer block"
                        >
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 + (i * 0.1) }}
                                whileHover={{ y: -5 }}
                                className="h-full rounded-[2rem] border border-white/[0.08] bg-black/40 p-1 backdrop-blur-xl transition-all group-hover:border-violet-500/30 group-hover:bg-violet-500/[0.03]"
                            >

                                {/* Visual Header */}
                                <div className={cn("h-40 rounded-[1.8rem] bg-gradient-to-br p-6 relative overflow-hidden", f.color)}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[60px]" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 blur-[60px]" />

                                    <div className="relative h-full flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase text-white">
                                                {f.type}
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-4 h-4 text-white" />
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(step => (
                                                    <div key={step} className="w-8 h-8 rounded-lg border-2 border-black/10 bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white">
                                                        {step}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-[10px] font-black text-white/70">
                                                {f.steps} Pasos
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6">
                                    <div>
                                        <h3 className="text-xl font-black text-white transition-colors group-hover:text-violet-400">
                                            {f.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className={cn("h-1.5 w-1.5 rounded-full", f.status === 'active' ? "bg-emerald-500" : "bg-amber-500")} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                                                {f.status === 'active' ? "En Línea" : "Borrador"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Leads</div>
                                            <div className="text-lg font-black text-white">{f.leads}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Conversión</div>
                                            <div className="text-lg font-black text-emerald-400">{f.conversion}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions Footer */}
                                <div className="p-4 pt-0 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                                        <Eye className="w-4 h-4 text-white/60" />
                                    </button>
                                    <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                                        <Copy className="w-4 h-4 text-white/60" />
                                    </button>
                                    <button className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                                        <Trash2 className="w-4 h-4 text-red-400/60" />
                                    </button>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </AnimatePresence>
            </div>

            {/* --- FLOATING HELP MODAL (MOCK) --- */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-8 right-8 z-50 p-6 rounded-3xl border border-violet-500/30 bg-violet-600 shadow-[0_20px_50px_rgba(139,92,246,0.3)] flex items-center gap-4 cursor-pointer"
                whileHover={{ scale: 1.05 }}
            >
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                    <div className="text-sm font-black text-white">¿Necesitas ayuda?</div>
                    <div className="text-xs text-white/70">Tu asistente IA está listo</div>
                </div>
            </motion.div>
        </div>
    )
}
