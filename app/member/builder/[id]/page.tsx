"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, Play, Save, Share2, Plus,
    Settings, MousePointer2, Layers, Zap,
    Monitor, Smartphone, Tablet, Sparkles,
    Search, Palette, Type, HelpCircle,
    Clock, CheckCircle2, ChevronRight,
    MoreVertical, Copy, Trash2, Eye, Layout
} from "lucide-react"
import { cn } from "@/lib/utils"

// Funnel Step Type
type FunnelStep = {
    id: string
    type: "landing" | "quiz" | "offer" | "thank-you"
    name: string
    active: boolean
}

const INITIAL_STEPS: FunnelStep[] = [
    { id: "s1", type: "landing", name: "Página de Captura", active: true },
    { id: "s2", type: "quiz", name: "Cuestionario Filtro", active: false },
    { id: "s3", type: "offer", name: "Oferta Irresistible", active: false },
]

export default function MagicBuilderEditor() {
    const router = useRouter()
    const params = useParams()
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState<"builder" | "settings" | "stats">("builder")
    const [selectedStep, setSelectedStep] = useState<string>("s1")
    const [viewport, setViewport] = useState<"desktop" | "mobile" | "tablet">("desktop")
    const [steps, setSteps] = useState<FunnelStep[]>(INITIAL_STEPS)

    useEffect(() => { setMounted(true) }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden text-white font-sans">

            {/* --- SUPER TOP BAR --- */}
            <header className="h-16 border-b border-white/[0.08] bg-black/40 backdrop-blur-3xl px-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/member/builder")}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                    >
                        <ChevronLeft className="w-5 h-5 text-white/50" />
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black tracking-tight">Embudo de Lanzamiento 2026</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase">En Línea</span>
                        </div>
                    </div>
                </div>

                {/* Viewport Toggles */}
                <div className="hidden md:flex items-center bg-white/[0.03] border border-white/[0.08] p-1 rounded-2xl">
                    {[
                        { id: "desktop", icon: Monitor },
                        { id: "tablet", icon: Tablet },
                        { id: "mobile", icon: Smartphone },
                    ].map(v => (
                        <button
                            key={v.id}
                            onClick={() => setViewport(v.id as any)}
                            className={cn(
                                "p-2.5 rounded-xl transition-all",
                                viewport === v.id ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            <v.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/40 hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                        Previsualizar
                    </button>
                    <button className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-2xl text-xs font-black shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.3)] transition-all transform active:scale-95">
                        <Rocket className="w-4 h-4" />
                        Publicar
                    </button>
                    <button className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20">
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* --- MAIN WORKSPACE --- */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDEBAR: FUNNEL FLOW MAP */}
                <aside className="w-80 border-r border-white/[0.08] bg-black/20 flex flex-col">
                    <div className="p-6 border-b border-white/[0.08]">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Mapa del Embudo</h2>

                        <div className="relative space-y-4">
                            {/* Connector Line */}
                            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-violet-500/50 via-white/10 to-transparent" />

                            <AnimatePresence mode="popLayout">
                                {steps.map((step, idx) => (
                                    <motion.div
                                        key={step.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setSelectedStep(step.id)}
                                        className={cn(
                                            "group relative flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer",
                                            selectedStep === step.id
                                                ? "bg-violet-600/[0.08] border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.05)]"
                                                : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.08]"
                                        )}
                                    >
                                        <div className={cn(
                                            "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                            selectedStep === step.id
                                                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/40"
                                                : "bg-white/5 text-white/40 border border-white/5"
                                        )}>
                                            {step.type === "landing" && <Layout className="w-5 h-5" />}
                                            {step.type === "quiz" && <HelpCircle className="w-5 h-5" />}
                                            {step.type === "offer" && <Zap className="w-5 h-5" />}
                                            {step.type === "thank-you" && <CheckCircle2 className="w-5 h-5" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">Paso 0{idx + 1}</div>
                                            <div className={cn(
                                                "text-sm font-black truncate",
                                                selectedStep === step.id ? "text-violet-200" : "text-white/40"
                                            )}>{step.name}</div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4 text-white/20" />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Add Step Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full mt-4 p-4 rounded-3xl border border-dashed border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all flex items-center justify-center gap-3 text-white/30 hover:text-violet-400 group"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-white/5 group-hover:bg-violet-500/10 flex items-center justify-center">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">Añadir Paso</span>
                            </motion.button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20">Biblioteca de Módulos</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { icon: Zap, label: "Botón", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                                    { icon: Type, label: "Título", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                                    { icon: Palette, label: "Diseño", color: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" },
                                    { icon: Clock, label: "Contador", color: "bg-red-500/10 text-red-400 border-red-500/20" },
                                ].map((item, i) => (
                                    <div key={i} className={cn("p-4 rounded-2xl border flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform", item.color)}>
                                        <item.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>



                {/* CENTER: THE CANVAS (LIVE PREVIEW) */}
                <main className="flex-1 bg-[#080808] p-12 overflow-y-auto relative flex justify-center">

                    {/* Zoom & Move Controls */}
                    <div className="absolute top-8 left-8 flex flex-col gap-2 z-20">
                        <div className="flex bg-black/60 backdrop-blur-3xl border border-white/10 p-1 rounded-2xl shadow-2xl">
                            <button className="px-3 py-1.5 text-[10px] font-black hover:text-violet-400">100%</button>
                            <div className="w-px bg-white/10" />
                            <button className="p-1.5 hover:text-violet-400"><MousePointer2 className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <motion.div
                        layout
                        className={cn(
                            "bg-black border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] transition-all duration-500 relative",
                            viewport === "desktop" ? "w-full max-w-5xl" : viewport === "tablet" ? "w-[768px]" : "w-[375px]"
                        )}
                        style={{ borderRadius: viewport === 'desktop' ? '0' : '40px', overflow: 'hidden' }}
                    >
                        {/* Device Frame Top for Mobile/Tablet */}
                        {viewport !== 'desktop' && (
                            <div className="h-10 w-full flex items-center justify-center bg-zinc-900 border-b border-white/5">
                                <div className="h-1.5 w-12 rounded-full bg-white/10" />
                            </div>
                        )}

                        {/* PREVIEW CONTENT (MOCKING A LANDING) */}
                        <div className="p-0 text-center">
                            {/* Fake Hero Block */}
                            <div className="h-screen bg-gradient-to-br from-[#0a0a0a] to-[#121212] flex flex-col items-center justify-center px-12 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                                <div className="relative space-y-12 max-w-2xl">
                                    <div className="group relative inline-block">
                                        <div className="absolute -inset-4 bg-violet-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] cursor-text transition-all hover:scale-105 active:scale-95 focus:outline-none" contentEditable suppressContentEditableWarning>
                                            Multiplica tus resultados <span className="text-violet-500">sin limite</span>
                                        </h1>
                                    </div>

                                    <p className="text-lg md:text-xl text-white/50 leading-relaxed cursor-text" contentEditable suppressContentEditableWarning>
                                        La plataforma que automatiza tu negocio mientras tú te enfocas en liderar. Empieza hoy mismo tu prueba gratuita.
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                        <button className="group relative bg-violet-600 px-8 py-5 rounded-2xl font-black text-lg shadow-[0_20px_40px_rgba(139,92,246,0.3)] transition-all hover:scale-105 active:scale-95">
                                            Únete Ahora
                                            <Plus className="absolute -top-3 -right-3 w-6 h-6 bg-white text-black p-1 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all rotate-45 transform group-hover:rotate-0" />
                                        </button>
                                        <div className="flex flex-col items-start">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800" />)}
                                            </div>
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">+1,200 Socios Activos</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating "Magic Wand" for AI suggestions */}
                                <div className="absolute top-1/2 right-12 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="h-12 w-12 rounded-2xl bg-black border border-violet-500/50 flex items-center justify-center text-violet-400 shadow-2xl hover:bg-violet-500 hover:text-white transition-all">
                                        <Sparkles className="w-5 h-5 animate-pulse" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </main>



                {/* RIGHT SIDEBAR: CONTEXTUAL PROPERTIES */}
                <aside className="w-80 border-l border-white/[0.08] bg-black/20 flex flex-col p-6 space-y-8 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Propiedades</h2>
                        <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-white/30" />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Color Palette */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-violet-400" />
                                <h3 className="text-sm font-bold">Colores Globales</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {["#8B5CF6", "#EC4899", "#3B82F6", "#10B981"].map(c => (
                                    <button key={c} className="h-10 rounded-xl border border-white/5 transition-transform hover:scale-110" style={{ background: c }} />
                                ))}
                                <button className="h-10 rounded-xl border border-white/10 flex items-center justify-center bg-white/5">
                                    <Plus className="w-4 h-4 text-white/40" />
                                </button>
                            </div>
                        </div>

                        {/* Smart Settings */}
                        <div className="p-5 rounded-3xl bg-violet-600/10 border border-violet-500/20 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <span className="text-xs font-black text-violet-400 uppercase">Magia IA</span>
                            </div>
                            <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                                Detectamos que tu nicho es MLM. ¿Quieres que optimice los textos para aumentar la curiosidad?
                            </p>
                            <button className="w-full bg-violet-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-600/30">
                                Optimizar Títulos
                            </button>
                        </div>

                        {/* Countdown Properties (if count is on page) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-white/40" />
                                <h3 className="text-sm font-bold text-white/60">Configurar Contador</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] uppercase font-black text-white/20">Fecha Límite</label>
                                    <input type="date" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-violet-500" />
                                </div>
                            </div>
                        </div>

                        {/* Links & CTA */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-white/40" />
                                <h3 className="text-sm font-bold text-white/60">Destino del Botón</h3>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-white/40">PASO SIGUIENTE</span>
                                    <ChevronRight className="w-3 h-3 text-white/40" />
                                </div>
                                <div className="text-xs font-bold text-violet-400">Cuestionario Filtro (Paso 02)</div>
                            </div>
                        </div>

                    </div>
                </aside>
            </div>

        </div>
    )
}
