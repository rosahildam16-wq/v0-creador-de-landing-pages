"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, Layout,
    Sparkles, Plus, ArrowRight,
    Star
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TEMPLATES } from "@/lib/landing-builder-types"
import { createLanding } from "@/lib/landing-builder-storage"

const CATEGORIES = ["Todos", "Captación", "Productos", "Eventos", "Webinar"]

export default function NewFunnelPage() {
    const router = useRouter()
    const [selectedCategory, setSelectedCategory] = useState("Todos")
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    const handleCreate = async (template: typeof TEMPLATES[0]) => {
        const newLanding = await createLanding(
            template.name,
            template.description,
            template.blocks
        )
        router.push(`/member/builder/${newLanding.id}`)
    }

    const handleCreateBlank = async () => {
        const newLanding = await createLanding(
            "Nuevo Embudo en Blanco",
            "Creado desde cero",
            ["hero", "cta"]
        )
        router.push(`/member/builder/${newLanding.id}`)
    }

    if (!mounted) return null

    // Helper map for visual colors of categories in this UI
    const getTemplateColor = (key: string) => {
        if (key === 'venta') return "from-rose-500 to-fuchsia-500"
        if (key === 'leads') return "from-emerald-500 to-teal-500"
        return "from-violet-500 to-indigo-500"
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 md:p-16">
            <div className="max-w-6xl mx-auto space-y-12 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push("/member/builder")}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-black uppercase tracking-widest">Volver</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Paso 1 de 2</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight">Elige tu <span className="text-violet-500">Misión</span></h1>
                    <p className="text-white/40 max-w-xl text-lg font-medium leading-relaxed">
                        Nuestros embudos están diseñados por expertos en Network Marketing para que no tengas que adivinar. Selecciona tu objetivo.
                    </p>
                </div>

                {/* Categories Bar */}
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-8 py-4 rounded-2xl text-sm font-black transition-all border",
                                selectedCategory === cat
                                    ? "bg-white text-black border-white shadow-xl"
                                    : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:bg-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {TEMPLATES.map((t, i) => (
                            <div
                                key={t.key}
                                onClick={() => handleCreate(t)}
                                className="group relative cursor-pointer block"
                            >
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    className="h-full flex flex-col rounded-[2.5rem] border border-white/[0.08] bg-black/40 overflow-hidden backdrop-blur-3xl transition-all group-hover:border-violet-500/30 group-hover:shadow-[0_40px_100px_rgba(139,92,246,0.1)]"
                                >
                                    {/* Visual Header */}
                                    <div className={cn("h-48 bg-gradient-to-br relative p-8", getTemplateColor(t.key))}>
                                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                                        <div className="relative h-full flex items-center justify-center">
                                            <Layout className="w-16 h-16 text-white transition-transform group-hover:scale-110 group-hover:rotate-6" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 flex-1 flex flex-col space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-violet-400 tracking-[0.2em]">{t.key}</span>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                <span className="text-[10px] font-bold text-white/60">4.9</span>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-white group-hover:text-violet-400 transition-colors uppercase leading-none">
                                            {t.name}
                                        </h3>

                                        <p className="text-sm text-white/30 font-medium leading-relaxed">
                                            {t.description}
                                        </p>

                                        <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Intermedio</span>
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 group-hover:bg-violet-600 flex items-center justify-center transition-all transform group-hover:rotate-45">
                                                <ArrowRight className="w-4 h-4 text-white -rotate-45 group-hover:rotate-0 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </AnimatePresence>

                    {/* Blank Option */}
                    <div
                        onClick={handleCreateBlank}
                        className="group relative cursor-pointer block"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="h-full flex flex-col rounded-[2.5rem] border border-dashed border-white/10 hover:border-white/30 bg-transparent p-12 items-center justify-center text-center space-y-6 transition-all hover:bg-white/[0.02]"
                        >
                            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-12">
                                <Plus className="w-10 h-10 text-white/20" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white/40 uppercase">Empieza de Cero</h3>
                                <p className="text-xs text-white/20 font-medium mt-2">Para mentes creativas que saben lo que buscan</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

