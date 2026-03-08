"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, Save, Plus,
    Monitor, Smartphone, Tablet, Sparkles,
    Eye, Rocket, X,
    ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getLanding, saveLanding, generateBlockId } from "@/lib/landing-builder-storage"
import { LandingConfig, LandingBlock, LandingTheme } from "@/lib/landing-builder-types"
import { getDefaultProps } from "@/lib/landing-block-defaults"
import { toast } from "sonner"

// Components
import { BlockPalette } from "@/components/landing-builder/block-palette"
import { BuilderCanvas } from "@/components/landing-builder/builder-canvas"
import { BlockProperties } from "@/components/landing-builder/block-properties"

export default function MagicBuilderEditor() {
    const router = useRouter()
    const params = useParams()
    const [mounted, setMounted] = useState(false)
    const [config, setConfig] = useState<LandingConfig | null>(null)
    const [viewport, setViewport] = useState<"desktop" | "mobile" | "tablet">("desktop")
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
    const [draggingType, setDraggingType] = useState<string | null>(null)
    const [isPreview, setIsPreview] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (params.id) {
            getLanding(params.id as string).then(data => {
                if (data) {
                    setConfig(data)
                } else {
                    toast.error("Embudo no encontrado")
                    router.push("/member/builder")
                }
            })
        }
    }, [params.id, router])

    const handleSave = async () => {
        if (config) {
            await saveLanding({
                ...config,
                updatedAt: new Date().toISOString()
            })
            toast.success("¡Cambios guardados con éxito!")
        }
    }

    const handlePublish = async () => {
        if (config) {
            const published = { ...config, status: "published" as const, updatedAt: new Date().toISOString() }
            await saveLanding(published)
            toast.success("¡Tu embudo ya está en línea!")
            setConfig(published)
        }
    }

    // --- Block Handlers ---
    const handleUpdateBlock = (id: string, props: Record<string, unknown>) => {
        if (!config) return
        setConfig({
            ...config,
            blocks: config.blocks.map(b => b.id === id ? { ...b, props } : b)
        })
    }

    const handleUpdateProp = (id: string, key: string, value: any) => {
        if (!config) return
        setConfig({
            ...config,
            blocks: config.blocks.map(b =>
                b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b
            )
        })
    }

    const handleUpdateTheme = (theme: LandingTheme) => {
        if (!config) return
        setConfig({ ...config, theme })
    }

    const handleUpdateConfig = (newConfig: LandingConfig) => {
        setConfig(newConfig)
    }

    const handleDropBlock = (type: string, index: number) => {
        if (!config) return
        const newBlock: LandingBlock = {
            id: generateBlockId(),
            type: type as any,
            props: getDefaultProps(type as any),
            order: index
        }
        const newBlocks = [...config.blocks]
        newBlocks.splice(index, 0, newBlock)

        // Update orders
        const sortedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }))

        setConfig({ ...config, blocks: sortedBlocks })
        setSelectedBlockId(newBlock.id)
    }

    const handleMoveBlock = (fromIndex: number, toIndex: number) => {
        if (!config) return
        const newBlocks = [...config.blocks]
        const [moved] = newBlocks.splice(fromIndex, 1)
        newBlocks.splice(toIndex, 0, moved)

        const sortedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }))
        setConfig({ ...config, blocks: sortedBlocks })
    }

    const handleDeleteBlock = (id: string) => {
        if (!config) return
        const newBlocks = config.blocks.filter(b => b.id !== id)
        const sortedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }))
        setConfig({ ...config, blocks: sortedBlocks })
        if (selectedBlockId === id) setSelectedBlockId(null)
        toast.info("Bloque eliminado")
    }

    if (!mounted || !config) {
        return (
            <div className="fixed inset-0 bg-[#050505] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <Sparkles className="w-8 h-8 text-violet-500 animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-widest text-white/40">Iniciando Constructor...</p>
                </div>
            </div>
        )
    }

    const selectedBlock = config.blocks.find(b => b.id === selectedBlockId) || null

    if (isPreview) {
        return (
            <div className="fixed inset-0 z-[100] bg-black overflow-y-auto">
                <button
                    onClick={() => setIsPreview(false)}
                    className="fixed top-6 right-6 z-[110] bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-white shadow-2xl transition-all group"
                >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
                <div className="mx-auto" style={{ maxWidth: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px' }}>
                    <BuilderCanvas
                        blocks={config.blocks}
                        theme={config.theme}
                        selectedBlockId={null}
                        draggingType={null}
                        onSelectBlock={() => { }}
                        onDropBlock={() => { }}
                        onMoveBlock={() => { }}
                        onDeleteBlock={() => { }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col overflow-hidden text-white font-sans selection:bg-violet-500/30">

            {/* --- SUPER TOP BAR --- */}
            <header className="h-16 border-b border-white/[0.08] bg-black/40 backdrop-blur-3xl px-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/member/builder")}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group"
                    >
                        <ChevronLeft className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black tracking-tight">{config.name}</span>
                            {config.status === "published" ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase">En Línea</span>
                            ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase">Borrador</span>
                            )}
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
                    <button
                        onClick={() => setIsPreview(true)}
                        className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        Previsualizar
                    </button>
                    <button
                        onClick={handlePublish}
                        className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-2xl text-xs font-black shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_30px_rgba(139,92,246,0.3)] transition-all transform active:scale-95"
                    >
                        <Rocket className="w-4 h-4" />
                        Publicar
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* --- MAIN WORKSPACE --- */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDEBAR: PALETTE */}
                <aside className="w-72 border-r border-white/[0.08] bg-[#080808] flex flex-col">
                    <BlockPalette
                        onDragStart={(type) => setDraggingType(type)}
                        onDragEnd={() => setDraggingType(null)}
                    />
                </aside>

                {/* CENTER: THE CANVAS */}
                <main className="flex-1 bg-[#050505] overflow-y-auto relative flex justify-center p-8 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]">
                    <div
                        className={cn(
                            "transition-all duration-500 ease-in-out h-fit min-h-full",
                            viewport === "desktop" ? "w-full max-w-5xl" : viewport === "tablet" ? "w-[768px]" : "w-[375px]"
                        )}
                        style={{
                            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                            borderRadius: viewport === 'desktop' ? '0' : '32px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        {viewport !== 'desktop' && (
                            <div className="h-10 w-full flex items-center justify-center bg-zinc-900/50 border-b border-white/5 backdrop-blur-xl">
                                <div className="h-1.5 w-12 rounded-full bg-white/10" />
                            </div>
                        )}
                        <BuilderCanvas
                            blocks={config.blocks}
                            theme={config.theme}
                            selectedBlockId={selectedBlockId}
                            draggingType={draggingType}
                            onSelectBlock={setSelectedBlockId}
                            onDropBlock={handleDropBlock}
                            onMoveBlock={handleMoveBlock}
                            onDeleteBlock={handleDeleteBlock}
                            onUpdateProp={handleUpdateProp}
                        />
                    </div>
                </main>

                {/* RIGHT SIDEBAR: PROPERTIES */}
                <aside className="w-80 border-l border-white/[0.08] bg-[#080808] flex flex-col">
                    <BlockProperties
                        block={selectedBlock}
                        config={config}
                        theme={config.theme}
                        onUpdateBlock={handleUpdateBlock}
                        onUpdateTheme={handleUpdateTheme}
                        onUpdateConfig={handleUpdateConfig}
                        onDeleteBlock={handleDeleteBlock}
                    />
                </aside>
            </div>

        </div>
    )
}

