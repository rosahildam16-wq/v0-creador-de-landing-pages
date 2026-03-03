"use client"

import React, { useState, useEffect } from "react"
import {
    Archive,
    Plus,
    FileText,
    Image as ImageIcon,
    Video,
    Link as LinkIcon,
    MoreVertical,
    Download,
    Trash2,
    Search,
    Filter,
    ExternalLink,
    Grid,
    List,
    FolderPlus,
    X,
    Loader2,
    Sparkles,
    Bot,
    Send,
    Zap,
    Layout,
    Shield
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Resource {
    id: string
    name: string
    type: "imagen" | "video" | "documento" | "enlace"
    file_url: string
    thumbnail_url?: string
    description?: string
    category: string
    created_at: string
}

export default function ResourceLibraryPage() {
    const { user } = useAuth()
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [filterType, setFilterType] = useState<string>("todos")
    const [search, setSearch] = useState("")
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Notebook AI state
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isNotebookOpen, setIsNotebookOpen] = useState(false)
    const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([])
    const [chatInput, setChatInput] = useState("")
    const [isChatLoading, setIsChatLoading] = useState(false)

    // Form state
    const [newResource, setNewResource] = useState({
        name: "",
        type: "imagen" as const,
        file_url: "",
        description: "",
        category: "General"
    })

    const isCreator = (user?.role as any) === "leader" || user?.role === "super_admin"

    useEffect(() => {
        fetchResources()
    }, [])

    const fetchResources = async () => {
        try {
            const res = await fetch("/api/member/resources")
            const data = await res.json()
            if (data.success) {
                setResources(data.resources)
            }
        } catch (err) {
            console.error("Error fetching resources:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/member/resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newResource)
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Recurso añadido a la librería central 🥂")
                setIsAddModalOpen(false)
                setNewResource({ name: "", type: "imagen", file_url: "", description: "", category: "General" })
                fetchResources()
            } else {
                toast.error(data.error)
            }
        } catch (err) {
            toast.error("Error de conexión")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este recurso?")) return
        try {
            const res = await fetch(`/api/member/resources?id=${id}`, { method: "DELETE" })
            const data = await res.json()
            if (data.success) {
                toast.success("Recurso eliminado")
                fetchResources()
            }
        } catch (err) {
            toast.error("Error al eliminar")
        }
    }

    const filtered = resources.filter(r => {
        const matchesType = filterType === "todos" || r.type === filterType
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase())
        return matchesType && matchesSearch
    })

    const getIcon = (type: string) => {
        switch (type) {
            case "imagen": return <ImageIcon className="h-5 w-5" />
            case "video": return <Video className="h-5 w-5" />
            case "documento": return <FileText className="h-5 w-5" />
            case "enlace": return <LinkIcon className="h-5 w-5" />
            default: return <Archive className="h-5 w-5" />
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleNotebookChat = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!chatInput.trim() || isChatLoading) return

        const userMsg = chatInput.trim()
        setChatInput("")
        setChatMessages(prev => [...prev, { role: "user", content: userMsg }])
        setIsChatLoading(true)

        // Get context from selected resources
        const selectedResources = resources.filter(r => selectedIds.includes(r.id))
        const context = selectedResources.map(r => `[${r.type.toUpperCase()}] ${r.name}: ${r.description || ""}`).join("\n")

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `CONTEXTO (Notebook):
                    ${context}
                    
                    PREGUNTA DEL USUARIO:
                    ${userMsg}`,
                    history: chatMessages
                })
            })
            const data = await res.json()
            if (data.response) {
                setChatMessages(prev => [...prev, { role: "assistant", content: data.response }])
            }
        } catch (err) {
            toast.error("Error al conectar con la IA")
        } finally {
            setIsChatLoading(true)
            setIsChatLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 md:pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Archive className="h-6 w-6 text-primary" />
                        Librería de Recursos
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Materiales, activos y documentos compartidos por tu comunidad.</p>
                </div>

                {isCreator && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:brightness-110 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Subir Recurso
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        placeholder="Buscar recursos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {["todos", "imagen", "video", "documento", "enlace"].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={cn(
                                "whitespace-nowrap rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                filterType === type
                                    ? "bg-primary text-white"
                                    : "bg-white/5 text-white/40 hover:bg-white/10"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 border border-white/10 rounded-xl p-1 bg-black/20">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30")}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-white/10 text-white" : "text-white/30")}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <Archive className="h-12 w-12 text-white/10 mb-4" />
                    <p className="text-white/30 text-sm font-medium">No se encontraron recursos</p>
                    {isCreator && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-4 text-xs font-bold text-primary hover:underline"
                        >
                            Sube el primer recurso ahora
                        </button>
                    )}
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((resource) => (
                        <div
                            key={resource.id}
                            onClick={() => toggleSelection(resource.id)}
                            className={cn(
                                "premium-card group relative flex flex-col overflow-hidden bg-white/5 border border-white/10 rounded-2xl transition-all cursor-pointer",
                                selectedIds.includes(resource.id) ? "border-primary/60 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]" : "hover:border-white/20"
                            )}
                        >
                            {/* Checkbox */}
                            <div className={cn(
                                "absolute top-3 left-3 z-10 h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                                selectedIds.includes(resource.id) ? "bg-primary border-primary" : "bg-black/40 border-white/20"
                            )}>
                                {selectedIds.includes(resource.id) && <Plus className="h-3 w-3 text-white rotate-45" />}
                            </div>

                            {/* Preview Area */}
                            <div className="aspect-video w-full bg-black/40 flex items-center justify-center relative">
                                {resource.type === "imagen" && resource.file_url ? (
                                    <img src={resource.file_url} className="h-full w-full object-cover" alt="" />
                                ) : (
                                    <div className="text-white/20">
                                        {getIcon(resource.type)}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <a
                                        href={resource.file_url}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-110 transition-transform"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                    </a>
                                    {isCreator && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(resource.id) }}
                                            className="h-10 w-10 flex items-center justify-center rounded-full bg-red-500 text-white hover:scale-110 transition-transform"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">{resource.type}</span>
                                    <span className="text-[9px] text-white/20">{new Date(resource.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-sm font-bold text-white truncate">{resource.name}</h3>
                                {resource.description && (
                                    <p className="text-[11px] text-white/40 line-clamp-2 mt-1">{resource.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="px-6 py-4 w-10">
                                    <div
                                        onClick={() => {
                                            if (selectedIds.length === filtered.length) setSelectedIds([])
                                            else setSelectedIds(filtered.map(f => f.id))
                                        }}
                                        className={cn(
                                            "h-4 w-4 rounded border flex items-center justify-center cursor-pointer",
                                            selectedIds.length === filtered.length ? "bg-primary border-primary" : "border-white/20"
                                        )}
                                    >
                                        {selectedIds.length === filtered.length && <Plus className="h-2 w-2 text-white rotate-45" />}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Nombre</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hidden sm:table-cell">Categoría</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hidden md:table-cell">Fecha</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-white/40">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map(resource => (
                                <tr
                                    key={resource.id}
                                    onClick={() => toggleSelection(resource.id)}
                                    className={cn(
                                        "hover:bg-white/[0.02] transition-colors group cursor-pointer",
                                        selectedIds.includes(resource.id) && "bg-primary/[0.03]"
                                    )}
                                >
                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "h-4 w-4 rounded border flex items-center justify-center",
                                            selectedIds.includes(resource.id) ? "bg-primary border-primary" : "border-white/20"
                                        )}>
                                            {selectedIds.includes(resource.id) && <Plus className="h-2 w-2 text-white rotate-45" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-primary/50">{getIcon(resource.type)}</div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{resource.name}</p>
                                                <p className="text-[10px] text-white/30 uppercase">{resource.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <span className="text-xs text-white/50">{resource.category}</span>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <span className="text-xs text-white/30">{new Date(resource.created_at).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <a
                                                href={resource.file_url}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-white/20 hover:text-white transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                            {isCreator && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(resource.id) }}
                                                    className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Notebook AI Floating Panel Toggle */}
            {selectedIds.length > 0 && !isNotebookOpen && (
                <div className="fixed bottom-24 right-6 left-6 z-50 md:left-auto md:w-80 animate-in slide-in-from-bottom-10">
                    <div className="bg-neutral-900/90 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 h-10 w-10 rounded-xl flex items-center justify-center border border-primary/20">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Notebook AI</h4>
                                <p className="text-[10px] text-white/40">{selectedIds.length} fuentes seleccionadas</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsNotebookOpen(true)}
                            className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
                        >
                            Chatear
                        </button>
                    </div>
                </div>
            )}

            {/* Notebook Sidebar */}
            {isNotebookOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNotebookOpen(false)} />

                    <div className="relative w-full max-w-lg bg-neutral-900 border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tighter text-white">Notebook AI</h2>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Pregunta sobre tus recursos</p>
                                </div>
                            </div>
                            <button onClick={() => setIsNotebookOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Selected Sources Chip List */}
                        <div className="px-6 py-4 flex gap-2 overflow-x-auto border-b border-white/5 bg-black/20">
                            {resources.filter(r => selectedIds.includes(r.id)).map(r => (
                                <div key={r.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 whitespace-nowrap">
                                    {getIcon(r.type)}
                                    <span className="text-[10px] font-bold text-white/80">{r.name}</span>
                                    <button onClick={() => toggleSelection(r.id)} className="text-white/20 hover:text-red-400">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto space-y-4">
                                    <div className="h-16 w-16 bg-white/5 rounded-3xl flex items-center justify-center">
                                        <Bot className="h-8 w-8 text-white/20" />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">¿En qué puedo ayudarte hoy?</h3>
                                    <p className="text-xs text-white/40 leading-relaxed font-medium">He leído los {selectedIds.length} recursos seleccionados. Puedo ayudarte a construir tu negocio más rápido.</p>

                                    <div className="grid grid-cols-1 gap-2 w-full pt-4">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 text-left px-1">Prompts Mágicos</div>
                                        <button
                                            onClick={() => setChatInput("Analiza estos recursos y crea un script de invitación de 30 segundos para WhatsApp.")}
                                            className="group text-[10px] bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 rounded-xl p-3 text-white/60 hover:text-white transition-all text-left flex items-start gap-2"
                                        >
                                            <Zap className="h-3 w-3 mt-0.5 text-primary" />
                                            <span>Generar Script de Invitación</span>
                                        </button>
                                        <button
                                            onClick={() => setChatInput("Basado en estos documentos, redacta el copy para una Landing Page de ventas (Encabezado, Beneficios y CTA).")}
                                            className="group text-[10px] bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 rounded-xl p-3 text-white/60 hover:text-white transition-all text-left flex items-start gap-2"
                                        >
                                            <Layout className="h-3 w-3 mt-0.5 text-primary" />
                                            <span>Redactar Copy de Ventas</span>
                                        </button>
                                        <button
                                            onClick={() => setChatInput("Escanea estos archivos y extrae todas las posibles objeciones de un prospecto y cómo rebatirlas.")}
                                            className="group text-[10px] bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 rounded-xl p-3 text-white/60 hover:text-white transition-all text-left flex items-start gap-2"
                                        >
                                            <Shield className="h-3 w-3 mt-0.5 text-primary" />
                                            <span>Manejo de Objeciones AI</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div key={idx} className={cn(
                                        "flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2",
                                        msg.role === "user" ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                                            msg.role === "user"
                                                ? "bg-primary text-white font-medium rounded-tr-none"
                                                : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isChatLoading && (
                                <div className="flex items-center gap-2 text-primary">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Pensando...</span>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-white/5 bg-black/20">
                            <form onSubmit={handleNotebookChat} className="relative">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Pregunta a tu Notebook AI..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm text-white outline-none focus:border-primary/50 transition-all shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isChatLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:scale-105"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                            <p className="text-[9px] text-white/20 text-center mt-4 uppercase tracking-[0.2em] font-black">Powered by Magic AI</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />

                    <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-black uppercase tracking-tighter text-white flex items-center gap-2">
                                <Plus className="h-5 w-5 text-primary" />
                                Nuevo Recurso
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-white/20 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddResource} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Título del Recurso</label>
                                <input
                                    type="text"
                                    required
                                    value={newResource.name}
                                    onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                                    placeholder="Ej: Logo Skalia PNG"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Tipo</label>
                                    <select
                                        value={newResource.type}
                                        onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="imagen">Imagen</option>
                                        <option value="video">Video</option>
                                        <option value="documento">Documento</option>
                                        <option value="enlace">Enlace/Link</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Categoría</label>
                                    <input
                                        type="text"
                                        value={newResource.category}
                                        onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                                        placeholder="Diseño"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Archivo URL / Link</label>
                                <input
                                    type="url"
                                    required
                                    value={newResource.file_url}
                                    onChange={(e) => setNewResource({ ...newResource, file_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                                />
                                <p className="text-[9px] text-white/20 italic">Sube tu archivo a Drive/Cloud y pega el link aquí.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Descripción (Opcional)</label>
                                <textarea
                                    value={newResource.description}
                                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                    placeholder="Detalles adicionales..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-colors h-24 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? "Sincronizando..." : (
                                    <>
                                        <Archive className="h-4 w-4" />
                                        Subir a la Librería
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .premium-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
            `}</style>
        </div>
    )
}
