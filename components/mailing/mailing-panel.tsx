"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Plus, Mail, Send, Calendar, Users, Eye, Search, Loader2,
    CheckCircle2, Clock, AlertCircle, Sparkles, Zap, Tag,
    Palette, Trash2, X, BarChart3, Play, Pause, GitBranch,
    Route, UserPlus, ArrowRight, Settings2, MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import type { CampanaEmail, EstadoCampana, Lead, EmailSequence } from "@/lib/types"
import { getCampanasEmail, createCampanaEmail, getLeads } from "@/lib/data"
import { getAllCommunities, type Community } from "@/lib/communities-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { EmailTemplateBuilder } from "./email-template-builder"
import { SequenceBuilder, type EmailSequence as SequenceBuilderType } from "./sequence-builder"

import { useAuth } from "@/lib/auth-context"

interface MailingPanelProps {
    mode: "admin" | "leader"
    communityId?: string
}

export function MailingPanel({ mode, communityId }: MailingPanelProps) {
    const { user } = useAuth()
    const [campanas, setCampanas] = useState<CampanaEmail[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [communities, setCommunities] = useState<Community[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [sendingNow, setSendingNow] = useState(false)
    const [mainTab, setMainTab] = useState("campanas")
    const [activeTab, setActiveTab] = useState("all")
    const [leadSearch, setLeadSearch] = useState("")
    const [campaignSearch, setCampaignSearch] = useState("")
    const [showBuilder, setShowBuilder] = useState(false)
    const [previewCampaign, setPreviewCampaign] = useState<CampanaEmail | null>(null)

    // Sequences state
    const [sequences, setSequences] = useState<EmailSequence[]>([])
    const [sequencesLoading, setSequencesLoading] = useState(false)
    const [showSequenceBuilder, setShowSequenceBuilder] = useState(false)
    const [editingSequence, setEditingSequence] = useState<SequenceBuilderType | undefined>(undefined)
    const [deletingSeqId, setDeletingSeqId] = useState<string | null>(null)

    const [newCampana, setNewCampana] = useState({
        titulo: "",
        asunto: "",
        contenido_html: "",
        audiencia: "comunidad" as CampanaEmail["audiencia"],
        community_id: communityId || "todas",
        programado_para: "",
        estado: "borrador" as EstadoCampana,
        audience_filters: {
            funnel_id: "",
            lead_ids: [] as string[]
        }
    })

    useEffect(() => {
        loadData()
        loadSequences()
    }, [user, communityId]) // Reload if user or communityId changes

    const loadSequences = async () => {
        setSequencesLoading(true)
        try {
            const params = communityId ? `?communityId=${communityId}` : ""
            const res = await fetch(`/api/mailing/sequences${params}`)
            if (res.ok) {
                const data = await res.json()
                setSequences(Array.isArray(data) ? data : [])
            }
        } catch (err) {
            console.error("Error loading sequences:", err)
        } finally {
            setSequencesLoading(false)
        }
    }

    const handleSaveSequence = async (seqData: SequenceBuilderType) => {
        try {
            const isEdit = !!seqData.id
            const userId = user?.memberId || user?.username || "admin"

            const payload = {
                ...seqData,
                autor_id: userId,
                autor_role: mode,
                community_id: communityId || seqData.community_id || "general",
            }

            if (isEdit) {
                const res = await fetch("/api/mailing/sequences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) throw new Error("Error al actualizar")
                toast.success("✅ Secuencia actualizada")
            } else {
                const res = await fetch("/api/mailing/sequences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (!res.ok) throw new Error("Error al crear")
                toast.success("✅ Secuencia creada exitosamente")
            }

            setShowSequenceBuilder(false)
            setEditingSequence(undefined)
            loadSequences()
        } catch (err: any) {
            toast.error(err.message || "Error al guardar la secuencia")
        }
    }

    const handleToggleSequenceStatus = async (seq: EmailSequence) => {
        const newStatus = seq.estado === "activa" ? "pausada" : "activa"
        try {
            const res = await fetch("/api/mailing/sequences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: seq.id, estado: newStatus })
            })
            if (!res.ok) throw new Error("Error")
            toast.success(newStatus === "activa" ? "▶️ Secuencia activada" : "⏸️ Secuencia pausada")
            loadSequences()
        } catch {
            toast.error("Error al cambiar estado")
        }
    }

    const handleDeleteSequence = async (id: string) => {
        setDeletingSeqId(id)
        try {
            const res = await fetch(`/api/mailing/sequences?id=${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Error")
            toast.success("Secuencia eliminada")
            loadSequences()
        } catch {
            toast.error("Error al eliminar")
        } finally {
            setDeletingSeqId(null)
        }
    }

    const getTriggerInfo = (trigger: string) => {
        const map: Record<string, { label: string; icon: any; color: string }> = {
            lead_created: { label: "Nuevo Lead", icon: UserPlus, color: "text-emerald-400" },
            funnel_entry: { label: "Entra al Embudo", icon: Route, color: "text-blue-400" },
            tag_added: { label: "Etiqueta Añadida", icon: Tag, color: "text-amber-400" },
            manual: { label: "Manual", icon: Zap, color: "text-violet-400" },
        }
        return map[trigger] || { label: trigger, icon: Zap, color: "text-zinc-400" }
    }

    const loadData = async () => {
        setLoading(true)

        try {
            // Load campaigns
            const campanasData = await getCampanasEmail()
            const filteredCampanas = mode === "leader"
                ? campanasData.filter(c => c.community_id === communityId)
                : campanasData
            setCampanas(filteredCampanas)

            // Load leads differently based on mode
            if (mode === "admin") {
                // Admin: load ALL leads from the global data function
                const leadsData = await getLeads()
                setLeads(leadsData)
            } else {
                // Member/Leader: load leads from API (which filters by their email/team)
                const userEmail = user?.email || ""

                if (userEmail) {
                    const res = await fetch(`/api/member/leads?email=${encodeURIComponent(userEmail)}`)
                    if (res.ok) {
                        const leadsData = await res.json()
                        const finalLeads = Array.isArray(leadsData) ? leadsData : []

                        // If no assigned leads, fallback to community leads
                        if (finalLeads.length === 0) {
                            const globalLeads = await getLeads()
                            const communityLeads = communityId
                                ? globalLeads.filter(l => l.community_id === communityId)
                                : globalLeads
                            setLeads(communityLeads)
                        } else {
                            setLeads(finalLeads)
                        }
                    } else {
                        // Fallback on API failure
                        const globalLeads = await getLeads()
                        const communityLeads = communityId
                            ? globalLeads.filter(l => l.community_id === communityId)
                            : globalLeads
                        setLeads(communityLeads)
                    }
                } else {
                    // Last fallback if no user email
                    const globalLeads = await getLeads()
                    setLeads(globalLeads)
                }
            }
        } catch (err) {
            console.error("Error leading data in MailingPanel:", err)
        }

        setCommunities(getAllCommunities())
        setLoading(false)
    }

    const filteredLeadsForSearch = useMemo(() => {
        let result = leads

        // Filter by community ONLY if we are in admin mode with a filter or if communityId is explicitly set
        if (mode === "leader" && communityId) {
            result = result.filter(l => l.community_id === communityId)
        } else if (newCampana.community_id && newCampana.community_id !== "todas" && newCampana.community_id !== "all") {
            result = result.filter(l => l.community_id === newCampana.community_id)
        }

        if (leadSearch) {
            result = result.filter(l =>
                l.nombre?.toLowerCase().includes(leadSearch.toLowerCase()) ||
                l.email?.toLowerCase().includes(leadSearch.toLowerCase())
            )
        }
        return result.slice(0, 50)
    }, [leads, leadSearch, mode, communityId, newCampana.community_id])

    const handleCreate = async (sendImmediately: boolean = false) => {
        if (!newCampana.titulo || !newCampana.asunto || !newCampana.contenido_html) {
            toast.error("Por favor completa los campos obligatorios")
            return
        }

        if (newCampana.audiencia === "leads_por_embudo" && !newCampana.audience_filters.funnel_id) {
            toast.error("Por favor selecciona un embudo")
            return
        }

        if (newCampana.audiencia === "persona_especifica" && (!newCampana.audience_filters.lead_ids || newCampana.audience_filters.lead_ids.length === 0)) {
            toast.error("Por favor selecciona al menos una persona")
            return
        }

        if (sendImmediately) setSendingNow(true)

        try {
            const res = await createCampanaEmail({
                titulo: newCampana.titulo,
                asunto: newCampana.asunto,
                contenido_html: newCampana.contenido_html,
                audiencia: newCampana.audiencia,
                audience_filters: newCampana.audience_filters,
                community_id: mode === "leader" ? communityId : newCampana.community_id,
                programado_para: sendImmediately ? null : (newCampana.programado_para || null),
                estado: sendImmediately ? "borrador" : (newCampana.programado_para ? "programada" : "borrador"),
                autor_id: "current-user",
                autor_role: mode
            })

            if (res) {
                if (sendImmediately && res.id) {
                    // Immediately trigger the send
                    toast.loading("Enviando campaña...")
                    const sendRes = await fetch("/api/mailing/process-campaign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ campaignId: res.id })
                    })
                    const sendData = await sendRes.json()
                    toast.dismiss()
                    if (sendData.success) {
                        toast.success(`✅ Campaña enviada exitosamente a ${sendData.sent} personas.`)
                    } else {
                        toast.error(`Error al enviar: ${sendData.error || "Error desconocido"}`)
                    }
                } else {
                    toast.success(newCampana.programado_para ? "Campaña programada exitosamente" : "Campaña guardada como borrador")
                }
                setIsCreateOpen(false)
                setShowBuilder(false)
                loadData()
                resetForm()
            }
        } catch (err) {
            toast.error("Error al crear la campaña")
        } finally {
            setSendingNow(false)
        }
    }

    const resetForm = () => {
        setNewCampana({
            titulo: "",
            asunto: "",
            contenido_html: "",
            audiencia: "comunidad",
            community_id: communityId || "general",
            programado_para: "",
            estado: "borrador",
            audience_filters: { funnel_id: "", lead_ids: [] }
        })
    }

    const toggleLeadSelection = (leadId: string) => {
        setNewCampana(prev => {
            const current = prev.audience_filters.lead_ids || []
            const next = current.includes(leadId)
                ? current.filter(id => id !== leadId)
                : [...current, leadId]
            return {
                ...prev,
                audience_filters: { ...prev.audience_filters, lead_ids: next }
            }
        })
    }

    const getStatusBadge = (estado: EstadoCampana) => {
        switch (estado) {
            case "enviada":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Enviada</Badge>
            case "programada":
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Programada</Badge>
            case "borrador":
                return <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" /> Borrador</Badge>
            case "cancelada":
                return <Badge variant="destructive">Cancelada</Badge>
        }
    }

    const [sendingId, setSendingId] = useState<string | null>(null)

    const handleSendNow = async (campaignId: string) => {
        try {
            setSendingId(campaignId)
            const response = await fetch("/api/mailing/process-campaign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(`Campaña enviada a ${data.sent} personas.`)
                loadData()
            } else {
                toast.error(data.error || "Error al enviar la campaña")
            }
        } catch (err) {
            console.error("Error sending campaign:", err)
            toast.error("Error de conexión al enviar")
        } finally {
            setSendingId(null)
        }
    }

    const filteredCampanas = campanas.filter(c => {
        const matchesTab = activeTab === "all" || c.estado === activeTab
        const matchesSearch = !campaignSearch ||
            c.titulo.toLowerCase().includes(campaignSearch.toLowerCase()) ||
            c.asunto.toLowerCase().includes(campaignSearch.toLowerCase())
        return matchesTab && matchesSearch
    })

    const getAudienciaLabel = (audiencia: CampanaEmail["audiencia"]) => {
        switch (audiencia) {
            case "todos": return "Todos los leads"
            case "comunidad": return "Mi comunidad"
            case "miembros_activos": return "Miembros Activos"
            case "leads_por_embudo": return "Por Embudo"
            case "persona_especifica": return "Persona Específica"
            default: return audiencia
        }
    }

    // Stats
    const stats = useMemo(() => {
        const enviadas = campanas.filter(c => c.estado === "enviada")
        const totalEnviados = enviadas.reduce((sum, c) => sum + (c.leads_alcanzados || 0), 0)
        return {
            totalCampanas: campanas.length,
            totalEnviados,
            borradores: campanas.filter(c => c.estado === "borrador").length,
            programadas: campanas.filter(c => c.estado === "programada").length,
        }
    }, [campanas])

    // ─── Full-screen Template Builder Mode ───
    if (showBuilder) {
        return (
            <div className="space-y-6">
                <EmailTemplateBuilder
                    initialSubject={newCampana.asunto}
                    onComplete={(html, subject) => {
                        setNewCampana(prev => ({
                            ...prev,
                            contenido_html: html,
                            asunto: subject,
                        }))
                        setShowBuilder(false)
                        setIsCreateOpen(true)
                    }}
                    onCancel={() => setShowBuilder(false)}
                />
            </div>
        )
    }

    // ── Full-screen Sequence Builder ──
    if (showSequenceBuilder) {
        return (
            <div className="space-y-6">
                <SequenceBuilder
                    mode={mode}
                    communityId={communityId}
                    sequence={editingSequence}
                    onSave={handleSaveSequence}
                    onCancel={() => { setShowSequenceBuilder(false); setEditingSequence(undefined) }}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        Email Marketing
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {mode === "admin"
                            ? "Centro de comando global. Diseña, personaliza y envía campañas a toda la red."
                            : "Diseña y envía campañas personalizadas a tus prospectos y equipo."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {mainTab === "secuencias" ? (
                        <Button
                            onClick={() => { setEditingSequence(undefined); setShowSequenceBuilder(true) }}
                            className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white gap-2 font-bold uppercase tracking-wider text-[11px] h-10 px-5 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        >
                            <GitBranch className="w-4 h-4" />
                            Nueva Secuencia
                        </Button>
                    ) : (
                        <>
                            {/* Visual Builder button */}
                            <Button
                                variant="outline"
                                onClick={() => setShowBuilder(true)}
                                className="border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary gap-2 font-bold uppercase tracking-wider text-[11px] h-10 px-5 rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]"
                            >
                                <Palette className="w-4 h-4" />
                                Diseñar Email
                            </Button>

                            {/* Quick create dialog */}
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] font-bold uppercase tracking-wider text-[11px] h-10 px-5 rounded-xl">
                                        <Plus className="w-4 h-4" />
                                        Nueva Campaña
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black italic">CREAR NUEVA CAMPAÑA</DialogTitle>
                                        <DialogDescription className="text-zinc-500">
                                            {newCampana.contenido_html
                                                ? "Tu diseño visual está listo. Configura la audiencia y envía."
                                                : "Diseña tu mensaje y elige a quién enviarlo con precisión militar."}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-5 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid gap-2 text-left">
                                                <Label htmlFor="titulo" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Nombre interno</Label>
                                                <Input
                                                    id="titulo"
                                                    placeholder="Ej: Seguimiento Funnel Reset"
                                                    className="bg-zinc-900 border-zinc-700 h-11"
                                                    value={newCampana.titulo}
                                                    onChange={(e) => setNewCampana({ ...newCampana, titulo: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid gap-2 text-left">
                                                <Label htmlFor="asunto" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Asunto del correo</Label>
                                                <Input
                                                    id="asunto"
                                                    placeholder="¡Esto te va a interesar! ⚡"
                                                    className="bg-zinc-900 border-zinc-700 h-11"
                                                    value={newCampana.asunto}
                                                    onChange={(e) => setNewCampana({ ...newCampana, asunto: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="grid gap-2 text-left">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Canal / Audiencia</Label>
                                                <Select
                                                    value={newCampana.audiencia}
                                                    onValueChange={(v: any) => setNewCampana({ ...newCampana, audiencia: v })}
                                                >
                                                    <SelectTrigger className="bg-zinc-900 border-zinc-700 h-11">
                                                        <SelectValue placeholder="Elegir audiencia" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        {mode === "admin" && <SelectItem value="todos">Todos los Leads (Global)</SelectItem>}
                                                        <SelectItem value="comunidad">Comunidad Total</SelectItem>
                                                        <SelectItem value="leads_por_embudo">Leads por Embudo</SelectItem>
                                                        <SelectItem value="persona_especifica">Persona en particular</SelectItem>
                                                        <SelectItem value="miembros_activos">Solo Miembros Activos</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-2 text-left">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Programar Envío</Label>
                                                <Input
                                                    type="datetime-local"
                                                    className="bg-zinc-900 border-zinc-700 h-11"
                                                    value={newCampana.programado_para}
                                                    onChange={(e) => setNewCampana({ ...newCampana, programado_para: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Additional filters based on audience selection */}
                                        <div className="grid gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                                            {mode === "admin" && newCampana.audiencia !== "todos" && (
                                                <div className="grid gap-2 text-left">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Seleccionar Comunidad</Label>
                                                    <Select
                                                        value={newCampana.community_id}
                                                        onValueChange={(v) => setNewCampana({ ...newCampana, community_id: v })}
                                                    >
                                                        <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10">
                                                            <SelectValue placeholder="Elegir comunidad" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                            <SelectItem value="todas">Todas las Comunidades</SelectItem>
                                                            {communities.map(c => (
                                                                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {newCampana.audiencia === "leads_por_embudo" && (
                                                <div className="grid gap-2 text-left">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Seleccionar Embudo</Label>
                                                    <Select
                                                        value={newCampana.audience_filters.funnel_id}
                                                        onValueChange={(v) => setNewCampana({
                                                            ...newCampana,
                                                            audience_filters: { ...newCampana.audience_filters, funnel_id: v }
                                                        })}
                                                    >
                                                        <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10">
                                                            <SelectValue placeholder="Elegir embudo" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                            {EMBUDOS.map(e => (
                                                                <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {newCampana.audiencia === "persona_especifica" && (
                                                <div className="grid gap-3 text-left">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Seleccionar Destinatario(s)</Label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                                                        <Input
                                                            placeholder="Buscar por nombre o email..."
                                                            className="pl-9 bg-zinc-950 border-zinc-800 h-10"
                                                            value={leadSearch}
                                                            onChange={(e) => setLeadSearch(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="max-h-[120px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                                        {filteredLeadsForSearch.map(lead => (
                                                            <div
                                                                key={lead.id}
                                                                onClick={() => toggleLeadSelection(lead.id)}
                                                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${newCampana.audience_filters.lead_ids?.includes(lead.id)
                                                                    ? "bg-primary/10 border-primary/40"
                                                                    : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700"
                                                                    }`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold">{lead.nombre}</span>
                                                                    <span className="text-[10px] text-zinc-500">{lead.email}</span>
                                                                </div>
                                                                {newCampana.audience_filters.lead_ids?.includes(lead.id) && (
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                                                )}
                                                            </div>
                                                        ))}
                                                        {filteredLeadsForSearch.length === 0 && (
                                                            <p className="text-[10px] text-zinc-600 italic text-center py-2">No se encontraron leads</p>
                                                        )}
                                                    </div>

                                                    {newCampana.audience_filters.lead_ids && newCampana.audience_filters.lead_ids.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            <Badge variant="secondary" className="bg-primary/20 text-primary text-[9px] border-primary/20">
                                                                {newCampana.audience_filters.lead_ids.length} SELECCIONADOS
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 text-[9px] px-2 hover:bg-zinc-800"
                                                                onClick={() => setNewCampana(prev => ({ ...prev, audience_filters: { ...prev.audience_filters, lead_ids: [] } }))}
                                                            >
                                                                Limpiar
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content - If from builder, show indicator; else show textarea */}
                                        {newCampana.contenido_html ? (
                                            <div className="grid gap-2 text-left">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Contenido del email</Label>
                                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-emerald-400">Diseño visual aplicado</p>
                                                            <p className="text-[10px] text-zinc-500">Email diseñado con el template builder</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setIsCreateOpen(false)
                                                                setShowBuilder(true)
                                                            }}
                                                            className="h-8 text-[10px] border-zinc-700 hover:bg-zinc-800 gap-1"
                                                        >
                                                            <Palette className="w-3 h-3" /> Editar Diseño
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setNewCampana(prev => ({ ...prev, contenido_html: "" }))}
                                                            className="h-8 text-[10px] text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid gap-2 text-left">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="contenido" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mensaje HTML</Label>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setIsCreateOpen(false)
                                                                setShowBuilder(true)
                                                            }}
                                                            className="h-7 text-[10px] bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary font-bold gap-1"
                                                        >
                                                            <Sparkles className="w-3 h-3" /> Editor Visual
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => setNewCampana(prev => ({ ...prev, contenido_html: prev.contenido_html + "{nombre}" }))} className="h-7 text-[10px] bg-zinc-900 border-zinc-700 font-bold hover:bg-primary/10 hover:text-primary transition-all">
                                                            {`{nombre}`}
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => setNewCampana(prev => ({ ...prev, contenido_html: prev.contenido_html + "{email}" }))} className="h-7 text-[10px] bg-zinc-900 border-zinc-700 font-bold hover:bg-primary/10 hover:text-primary transition-all">
                                                            {`{email}`}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Textarea
                                                    id="contenido"
                                                    placeholder="Utiliza etiquetas HTML o texto plano. También puedes usar el Editor Visual para diseñar emails profesionales."
                                                    className="min-h-[180px] bg-zinc-900 border-zinc-700 font-mono text-xs leading-relaxed"
                                                    value={newCampana.contenido_html}
                                                    onChange={(e) => setNewCampana({ ...newCampana, contenido_html: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter className="gap-2 flex-wrap">
                                        <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm() }} className="border-zinc-700 hover:bg-zinc-900 h-11 px-6 rounded-xl font-bold uppercase tracking-widest text-[11px]">
                                            Cancelar
                                        </Button>
                                        <Button onClick={() => handleCreate(false)} className="h-11 px-6 rounded-xl font-bold uppercase tracking-widest text-[11px] bg-zinc-700 text-zinc-200 hover:bg-zinc-600">
                                            {newCampana.programado_para ? <><Calendar className="w-3.5 h-3.5 mr-2" /> Programar</> : <><Clock className="w-3.5 h-3.5 mr-2" /> Guardar Borrador</>}
                                        </Button>
                                        <Button
                                            onClick={() => handleCreate(true)}
                                            disabled={sendingNow}
                                            className="h-11 px-8 rounded-xl font-bold uppercase tracking-widest text-[11px] bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                        >
                                            {sendingNow ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Enviando...</> : <><Send className="w-3.5 h-3.5 mr-2" /> Enviar Ahora</>}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm group hover:border-primary/30 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-primary transition-colors flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            Total Campañas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white italic">{stats.totalCampanas}</div>
                        <p className="text-[10px] text-zinc-600 mt-1">{stats.borradores} borradores · {stats.programadas} programadas</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-emerald-500 transition-colors flex items-center gap-2">
                            <Send className="w-3 h-3" />
                            Emails Enviados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white italic">{stats.totalEnviados}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm group hover:border-amber-500/30 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-amber-500 transition-colors flex items-center gap-2">
                            <Eye className="w-3 h-3" />
                            Tasa de Apertura
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white italic">—</div>
                        <p className="text-[10px] text-zinc-600 mt-1">Próximamente</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm group hover:border-sky-500/30 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-sky-500 transition-colors flex items-center gap-2">
                            <BarChart3 className="w-3 h-3" />
                            Tasa de Click
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white italic">—</div>
                        <p className="text-[10px] text-zinc-600 mt-1">Próximamente</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Main Tabs: Campañas | Secuencias ── */}
            <Tabs defaultValue="campanas" className="w-full" onValueChange={setMainTab}>
                <TabsList className="bg-zinc-900/60 border border-zinc-800 rounded-xl h-11 p-1 mb-6">
                    <TabsTrigger
                        value="campanas"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 px-5"
                    >
                        <Mail className="w-3.5 h-3.5" /> Campañas
                    </TabsTrigger>
                    <TabsTrigger
                        value="secuencias"
                        className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 px-5"
                    >
                        <GitBranch className="w-3.5 h-3.5" /> Automatizaciones
                    </TabsTrigger>
                </TabsList>

                {/* ── CAMPAÑAS TAB ── */}
                <TabsContent value="campanas" className="mt-0">
                    {/* ── Campaigns Table ── */}
                    <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-px">
                            <TabsList className="bg-transparent h-auto p-0 gap-8">
                                {["all", "enviada", "programada", "borrador"].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="data-[state=active]:text-primary px-0 pb-3 bg-transparent border-b-2 border-b-transparent data-[state=active]:border-b-primary rounded-none font-bold uppercase tracking-widest text-[11px] transition-all"
                                    >
                                        {tab === "all" ? "Todas" : tab === "enviada" ? "Enviadas" : tab === "programada" ? "Programadas" : "Borradores"}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="flex items-center gap-2 pb-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
                                    <Input
                                        placeholder="Buscar campaña..."
                                        className="pl-9 h-9 w-[180px] md:w-[260px] bg-zinc-900/50 border-zinc-800 text-xs"
                                        value={campaignSearch}
                                        onChange={(e) => setCampaignSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <TabsContent value={activeTab} className="mt-6">
                            <div className="rounded-2xl border border-zinc-800/50 overflow-hidden bg-zinc-950/50 backdrop-blur-xl">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-zinc-900/80 hover:bg-zinc-900/80 border-zinc-800">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-4">Campaña / Asunto</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estado</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Audiencia</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Alcance</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Fecha</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-64 text-center text-zinc-500">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                                                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Cargando inteligencia...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredCampanas.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-64 text-center text-zinc-500">
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <div className="opacity-20">
                                                            <Mail className="w-16 h-16" />
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">
                                                            {campaignSearch ? "No se encontraron campañas" : "Silencio en la red..."}
                                                        </span>
                                                        {!campaignSearch && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setShowBuilder(true)}
                                                                className="h-8 text-[10px] font-bold uppercase tracking-widest border-zinc-800 hover:border-primary/30 hover:text-primary gap-1.5 mt-2"
                                                            >
                                                                <Palette className="w-3 h-3" /> Crear tu primer email
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCampanas.map((c) => (
                                                <TableRow key={c.id} className="border-zinc-800/50 hover:bg-white/[0.02] transition-colors group">
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-zinc-100 uppercase text-xs tracking-wider">{c.titulo}</span>
                                                            <span className="text-[10px] text-zinc-500 truncate max-w-[200px] mt-0.5">{c.asunto}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(c.estado)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-zinc-300">
                                                            <Badge variant="outline" className="border-zinc-800 bg-zinc-900/50 text-[9px] font-black tracking-widest uppercase">
                                                                {getAudienciaLabel(c.audiencia)}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-mono text-zinc-100 text-sm">{c.leads_alcanzados}</span>
                                                            <span className="text-[9px] font-black uppercase text-zinc-600 tracking-tighter">unidades</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-bold text-zinc-400">
                                                                {format(new Date(c.created_at), "d MMM yyyy", { locale: es })}
                                                            </span>
                                                            {c.programado_para && (
                                                                <span className="text-[9px] text-amber-500/80 font-black uppercase flex items-center gap-1 mt-0.5">
                                                                    <Clock className="w-2.5 h-2.5" />
                                                                    {format(new Date(c.programado_para), "d MMM, HH:mm", { locale: es })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-primary/20 hover:text-primary rounded-lg"
                                                                onClick={() => setPreviewCampaign(c)}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            {c.estado === "borrador" && (
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="h-8 bg-zinc-800 hover:bg-primary hover:text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg px-4"
                                                                    onClick={() => handleSendNow(c.id)}
                                                                    disabled={sendingId === c.id}
                                                                >
                                                                    {sendingId === c.id ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        "Enviar Ya!"
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* ── SECUENCIAS TAB ── */}
                <TabsContent value="secuencias" className="mt-0">
                    {sequencesLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cargando automatizaciones...</span>
                        </div>
                    ) : sequences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-5 rounded-2xl border-2 border-dashed border-zinc-800/60">
                            <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                                <GitBranch className="w-9 h-9 text-violet-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold text-lg">Sin automatizaciones aún</p>
                                <p className="text-zinc-500 text-sm mt-1 max-w-sm">
                                    Crea secuencias de emails que se envían automáticamente cuando un lead llega a un embudo, se registra, o recibe una etiqueta.
                                </p>
                            </div>
                            <Button
                                onClick={() => { setEditingSequence(undefined); setShowSequenceBuilder(true) }}
                                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white gap-2 font-bold uppercase tracking-wider text-[11px] h-10 px-6 rounded-xl"
                            >
                                <GitBranch className="w-4 h-4" />
                                Crear Primera Automatización
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {sequences.map((seq) => {
                                const trigger = getTriggerInfo(seq.trigger_type)
                                const TriggerIcon = trigger.icon
                                const stepsCount = seq.email_sequence_steps?.[0]?.count ?? (seq.steps?.length ?? 0)
                                return (
                                    <div
                                        key={seq.id}
                                        className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all p-5 flex flex-col md:flex-row md:items-center gap-4"
                                    >
                                        {/* Status indicator */}
                                        <div className={`absolute top-4 right-4 h-2 w-2 rounded-full ${seq.estado === "activa" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" :
                                            seq.estado === "pausada" ? "bg-amber-500" : "bg-zinc-600"
                                            }`} />

                                        {/* Trigger icon */}
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                                            <TriggerIcon className={`h-5 w-5 ${trigger.color}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-white text-sm uppercase tracking-wide">{seq.nombre}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] font-black border h-5 ${seq.estado === "activa" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" :
                                                        seq.estado === "pausada" ? "border-amber-500/30 text-amber-400 bg-amber-500/5" :
                                                            "border-zinc-700 text-zinc-500"
                                                        }`}
                                                >
                                                    {seq.estado === "activa" ? "🟢 ACTIVA" : seq.estado === "pausada" ? "⏸ PAUSADA" : "📝 BORRADOR"}
                                                </Badge>
                                            </div>
                                            {seq.descripcion && (
                                                <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-md">{seq.descripcion}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                    <TriggerIcon className="h-3 w-3" />
                                                    <span className="text-[11px] font-medium">{trigger.label}</span>
                                                    {seq.trigger_value && (
                                                        <span className="text-[11px] text-zinc-600">· {seq.trigger_value}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                    <Mail className="h-3 w-3" />
                                                    <span className="text-[11px] font-medium">{stepsCount} emails</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-zinc-500">
                                                    <Clock className="h-3 w-3" />
                                                    <span className="text-[11px]">{format(new Date(seq.created_at), "d MMM yyyy", { locale: es })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pipeline visualization mini */}
                                        <div className="hidden lg:flex items-center gap-1">
                                            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                                            </div>
                                            {Array.from({ length: Math.min(stepsCount, 4) }).map((_, i) => (
                                                <>
                                                    <ArrowRight key={`arr-${i}`} className="h-3 w-3 text-zinc-700" />
                                                    <div key={`dot-${i}`} className="flex items-center justify-center h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700">
                                                        <Mail className="h-3 w-3 text-zinc-500" />
                                                    </div>
                                                </>
                                            ))}
                                            {stepsCount > 4 && (
                                                <>
                                                    <ArrowRight className="h-3 w-3 text-zinc-700" />
                                                    <div className="flex items-center justify-center h-7 w-14 rounded-lg bg-zinc-800 border border-zinc-700">
                                                        <span className="text-[10px] font-bold text-zinc-500">+{stepsCount - 4}</span>
                                                    </div>
                                                </>
                                            )}
                                            <ArrowRight className="h-3 w-3 text-zinc-700" />
                                            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-zinc-800/50 border border-zinc-700">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-600" />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleSequenceStatus(seq)}
                                                className={`h-8 text-[10px] font-bold uppercase tracking-widest gap-1.5 border rounded-lg ${seq.estado === "activa"
                                                    ? "border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10"
                                                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                                                    }`}
                                            >
                                                {seq.estado === "activa" ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Activar</>}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-800">
                                                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white">
                                                    <DropdownMenuItem
                                                        className="text-xs gap-2 cursor-pointer hover:bg-zinc-800"
                                                        onClick={() => {
                                                            setEditingSequence(seq as unknown as SequenceBuilderType)
                                                            setShowSequenceBuilder(true)
                                                        }}
                                                    >
                                                        <Settings2 className="h-3 w-3" /> Editar Secuencia
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                                    <DropdownMenuItem
                                                        className="text-xs gap-2 text-red-400 cursor-pointer hover:bg-red-500/10 hover:text-red-300"
                                                        onClick={() => handleDeleteSequence(seq.id)}
                                                        disabled={deletingSeqId === seq.id}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        {deletingSeqId === seq.id ? "Eliminando..." : "Eliminar"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Info card */}
                    {sequences.length > 0 && (
                        <div className="mt-6 p-4 rounded-xl border border-zinc-800/50 bg-gradient-to-r from-violet-500/5 to-blue-500/5 flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0 mt-0.5">
                                <Zap className="h-4 w-4 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white/70">¿Cómo funcionan las Automatizaciones?</p>
                                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                                    Cuando se cumple el trigger (ej. nuevo lead registrado), el sistema inscribe automáticamente al lead en la secuencia y programa cada email con los días de espera que configuraste. Los leads con etiquetas específicas también pueden activar flujos independientes.
                                </p>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* ── Campaign Preview Dialog ── */}
            <Dialog open={!!previewCampaign} onOpenChange={(open) => !open && setPreviewCampaign(null)}>
                <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            PREVIEW: {previewCampaign?.titulo}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Asunto: {previewCampaign?.asunto}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800">
                        {previewCampaign?.contenido_html && (
                            <iframe
                                srcDoc={previewCampaign.contenido_html
                                    .replace(/{nombre}/g, "Carlos Ejemplo")
                                    .replace(/{email}/g, "carlos@ejemplo.com")
                                }
                                className="w-full border-0 bg-white"
                                style={{ height: "500px" }}
                                title="Campaign Preview"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    )
}
