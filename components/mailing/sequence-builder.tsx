"use client"

import { useState } from "react"
import {
    Plus, Mail, Clock, Trash2, ChevronDown, ChevronUp,
    Zap, Play, Pause, ArrowDown, Sparkles, Tag, Route,
    UserPlus, CheckCircle2, Pencil, Copy, GripVertical, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { EMBUDOS } from "@/lib/embudos-config"
import { EmailTemplateBuilder } from "./email-template-builder"
import { toast } from "sonner"

export interface SequenceStep {
    id: string
    asunto: string
    contenido_html: string
    delay_days: number
    delay_hours: number
    condition_type: "none" | "opened_previous" | "clicked_previous" | "has_tag"
    condition_value: string
    activo: boolean
}

export interface EmailSequence {
    id?: string
    nombre: string
    descripcion: string
    trigger_type: "manual" | "funnel_entry" | "tag_added" | "lead_created" | "form_submit"
    trigger_value: string
    estado: "borrador" | "activa" | "pausada"
    community_id: string
    steps: SequenceStep[]
}

interface SequenceBuilderProps {
    mode: "admin" | "leader"
    communityId?: string
    sequence?: EmailSequence
    onSave: (sequence: EmailSequence) => void
    onCancel: () => void
}

const TRIGGER_OPTIONS = [
    { value: "lead_created", label: "Nuevo Lead Registrado", icon: UserPlus, color: "text-emerald-400", desc: "Cuando alguien se registra por primera vez" },
    { value: "funnel_entry", label: "Entra a un Embudo", icon: Route, color: "text-blue-400", desc: "Cuando un lead entra a un embudo específico" },
    { value: "tag_added", label: "Se Agrega Etiqueta", icon: Tag, color: "text-amber-400", desc: "Cuando se le asigna una etiqueta al lead" },
    { value: "manual", label: "Inscripción Manual", icon: Zap, color: "text-violet-400", desc: "Tú decides cuándo agregar personas" },
]

const CONDITION_OPTIONS = [
    { value: "none", label: "Sin condición (enviar siempre)" },
    { value: "opened_previous", label: "Solo si abrió el email anterior" },
    { value: "clicked_previous", label: "Solo si hizo click en el anterior" },
    { value: "has_tag", label: "Solo si tiene una etiqueta específica" },
]

function generateId() {
    return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function SequenceBuilder({ mode, communityId, sequence, onSave, onCancel }: SequenceBuilderProps) {
    const [data, setData] = useState<EmailSequence>(sequence || {
        nombre: "",
        descripcion: "",
        trigger_type: "lead_created",
        trigger_value: "",
        estado: "borrador",
        community_id: communityId || "general",
        steps: []
    })

    const [expandedStep, setExpandedStep] = useState<string | null>(null)
    const [editingStepBuilder, setEditingStepBuilder] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const addStep = () => {
        const newStep: SequenceStep = {
            id: generateId(),
            asunto: "",
            contenido_html: "",
            delay_days: data.steps.length === 0 ? 0 : 1,
            delay_hours: 0,
            condition_type: "none",
            condition_value: "",
            activo: true
        }
        setData({ ...data, steps: [...data.steps, newStep] })
        setExpandedStep(newStep.id)
    }

    const updateStep = (stepId: string, updates: Partial<SequenceStep>) => {
        setData({
            ...data,
            steps: data.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
        })
    }

    const removeStep = (stepId: string) => {
        setData({ ...data, steps: data.steps.filter(s => s.id !== stepId) })
        if (expandedStep === stepId) setExpandedStep(null)
    }

    const duplicateStep = (stepId: string) => {
        const step = data.steps.find(s => s.id === stepId)
        if (!step) return
        const newStep = { ...step, id: generateId(), asunto: `${step.asunto} (copia)` }
        const idx = data.steps.findIndex(s => s.id === stepId)
        const newSteps = [...data.steps]
        newSteps.splice(idx + 1, 0, newStep)
        setData({ ...data, steps: newSteps })
    }

    const moveStep = (stepId: string, direction: "up" | "down") => {
        const idx = data.steps.findIndex(s => s.id === stepId)
        if (direction === "up" && idx <= 0) return
        if (direction === "down" && idx >= data.steps.length - 1) return
        const newSteps = [...data.steps]
        const swapIdx = direction === "up" ? idx - 1 : idx + 1
            ;[newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]]
        setData({ ...data, steps: newSteps })
    }

    const handleSave = async () => {
        if (!data.nombre.trim()) {
            toast.error("Dale un nombre a la secuencia")
            return
        }
        if (data.steps.length === 0) {
            toast.error("Agrega al menos un email a la secuencia")
            return
        }
        if (data.steps.some(s => !s.asunto.trim())) {
            toast.error("Todos los emails necesitan un asunto")
            return
        }
        setSaving(true)
        await onSave(data)
        setSaving(false)
    }

    const totalDays = data.steps.reduce((sum, s) => sum + s.delay_days, 0)
    const totalEmails = data.steps.length

    const selectedTrigger = TRIGGER_OPTIONS.find(t => t.value === data.trigger_type)

    // If we're editing a step's content with the builder
    if (editingStepBuilder) {
        const step = data.steps.find(s => s.id === editingStepBuilder)
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Diseñar Email: {step?.asunto || "Sin asunto"}</h3>
                        <p className="text-xs text-white/30">Paso {data.steps.findIndex(s => s.id === editingStepBuilder) + 1} de {data.steps.length}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingStepBuilder(null)}>
                        ← Volver a la secuencia
                    </Button>
                </div>
                <EmailTemplateBuilder
                    onSave={(html) => {
                        updateStep(editingStepBuilder, { contenido_html: html })
                        setEditingStepBuilder(null)
                    }}
                    initialHtml={step?.contenido_html || ""}
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">
                        {sequence ? "Editar Secuencia" : "Crear Secuencia Automatizada"}
                    </h2>
                    <p className="text-xs text-white/30 mt-1">
                        Diseña una serie de emails que se envían automáticamente según un trigger
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel} className="border-zinc-800">
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                    >
                        {saving ? "Guardando..." : "Guardar Secuencia"}
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            {totalEmails > 0 && (
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-bold text-white">{totalEmails}</span>
                        <span className="text-xs text-white/40">emails</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-bold text-white">{totalDays}</span>
                        <span className="text-xs text-white/40">días total</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                        {data.estado === "activa" ? "🟢 Activa" : data.estado === "pausada" ? "⏸️ Pausada" : "📝 Borrador"}
                    </Badge>
                </div>
            )}

            {/* Sequence Config */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Left: Basic Info */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-4 space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nombre de la Secuencia</Label>
                            <Input
                                placeholder="Ej: Bienvenida Nuevo Suscriptor"
                                value={data.nombre}
                                onChange={e => setData({ ...data, nombre: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 h-10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Descripción (opcional)</Label>
                            <Textarea
                                placeholder="¿Qué hace esta secuencia?"
                                value={data.descripcion}
                                onChange={e => setData({ ...data, descripcion: e.target.value })}
                                className="bg-zinc-950 border-zinc-800 min-h-[60px] resize-none text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Trigger */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-4 space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">¿Qué activa esta secuencia?</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {TRIGGER_OPTIONS.map(trigger => (
                                <button
                                    key={trigger.value}
                                    onClick={() => setData({ ...data, trigger_type: trigger.value as any, trigger_value: "" })}
                                    className={cn(
                                        "flex flex-col gap-1 rounded-xl border p-3 text-left transition-all",
                                        data.trigger_type === trigger.value
                                            ? "border-primary/40 bg-primary/5"
                                            : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <trigger.icon className={cn("h-4 w-4", trigger.color)} />
                                        <span className="text-xs font-bold text-white/80">{trigger.label}</span>
                                    </div>
                                    <span className="text-[10px] text-white/30 leading-tight">{trigger.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* Trigger value selector */}
                        {data.trigger_type === "funnel_entry" && (
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Seleccionar Embudo</Label>
                                <Select value={data.trigger_value} onValueChange={v => setData({ ...data, trigger_value: v })}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-9 text-xs">
                                        <SelectValue placeholder="Elegir embudo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                        {EMBUDOS.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {data.trigger_type === "tag_added" && (
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Nombre de la Etiqueta</Label>
                                <Input
                                    placeholder="Ej: interesado, comprador, vip..."
                                    value={data.trigger_value}
                                    onChange={e => setData({ ...data, trigger_value: e.target.value })}
                                    className="bg-zinc-950 border-zinc-800 h-9 text-xs"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sequence Steps Visual Timeline */}
            <div className="space-y-1">
                <div className="flex items-center justify-between px-1 mb-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        Correos de la Secuencia ({totalEmails})
                    </Label>
                </div>

                {/* Trigger node */}
                <div className="flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white/70">TRIGGER: {selectedTrigger?.label || "Sin configurar"}</p>
                        <p className="text-[10px] text-white/30">{selectedTrigger?.desc}</p>
                    </div>
                </div>

                {/* Steps */}
                {data.steps.map((step, index) => {
                    const isExpanded = expandedStep === step.id
                    const cumulativeDays = data.steps.slice(0, index + 1).reduce((sum, s) => sum + s.delay_days, 0)

                    return (
                        <div key={step.id} className="relative">
                            {/* Connector line */}
                            <div className="absolute left-[23px] -top-1 h-6 w-0.5 bg-gradient-to-b from-zinc-800 to-primary/30" />

                            {/* Delay badge */}
                            <div className="flex items-center gap-2 py-1 pl-3">
                                <Clock className="h-3 w-3 text-blue-400/60" />
                                <span className="text-[10px] font-medium text-blue-400/60">
                                    {step.delay_days === 0 && step.delay_hours === 0
                                        ? "Inmediatamente"
                                        : `Esperar ${step.delay_days > 0 ? `${step.delay_days} día${step.delay_days > 1 ? "s" : ""}` : ""} ${step.delay_hours > 0 ? `${step.delay_hours}h` : ""}`
                                    }
                                    {cumulativeDays > 0 && ` (día ${cumulativeDays})`}
                                </span>
                            </div>

                            {/* Step Card */}
                            <div className={cn(
                                "rounded-xl border transition-all ml-2",
                                isExpanded
                                    ? "border-primary/30 bg-zinc-900/80"
                                    : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700"
                            )}>
                                {/* Step Header (always visible) */}
                                <div
                                    className="flex items-center gap-3 p-3 cursor-pointer"
                                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                                >
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black",
                                        step.activo
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                                    )}>
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-white/30 shrink-0" />
                                            <span className={cn(
                                                "text-sm font-medium truncate",
                                                step.asunto ? "text-white/80" : "text-white/20 italic"
                                            )}>
                                                {step.asunto || "Sin asunto..."}
                                            </span>
                                        </div>
                                        {step.condition_type !== "none" && (
                                            <span className="text-[10px] text-amber-400/60 ml-5">
                                                Condición: {CONDITION_OPTIONS.find(c => c.value === step.condition_type)?.label}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {step.contenido_html && (
                                            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400/60 h-5">
                                                Diseñado
                                            </Badge>
                                        )}
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-white/20" /> : <ChevronDown className="h-4 w-4 text-white/20" />}
                                    </div>
                                </div>

                                {/* Step Expanded Content */}
                                {isExpanded && (
                                    <div className="px-3 pb-3 space-y-3 border-t border-zinc-800/50 mt-0 pt-3">
                                        {/* Subject */}
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Asunto del Email</Label>
                                            <Input
                                                placeholder="Ej: ¡Bienvenido! Aquí tu primera lección"
                                                value={step.asunto}
                                                onChange={e => updateStep(step.id, { asunto: e.target.value })}
                                                className="bg-zinc-950 border-zinc-800 h-9 text-sm"
                                            />
                                        </div>

                                        {/* Timing */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Días de Espera</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={step.delay_days}
                                                    onChange={e => updateStep(step.id, { delay_days: Math.max(0, parseInt(e.target.value) || 0) })}
                                                    className="bg-zinc-950 border-zinc-800 h-9 text-sm"
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Horas Extra</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    value={step.delay_hours}
                                                    onChange={e => updateStep(step.id, { delay_hours: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) })}
                                                    className="bg-zinc-950 border-zinc-800 h-9 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Condition */}
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Condición (opcional)</Label>
                                            <Select
                                                value={step.condition_type}
                                                onValueChange={v => updateStep(step.id, { condition_type: v as any })}
                                            >
                                                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-9 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                    {CONDITION_OPTIONS.map(c => (
                                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Content */}
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Contenido del Email</Label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingStepBuilder(step.id)}
                                                    className={cn(
                                                        "flex-1 flex items-center gap-2 rounded-lg border p-3 transition-all text-left",
                                                        step.contenido_html
                                                            ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                                                            : "border-dashed border-zinc-800 hover:border-zinc-700"
                                                    )}
                                                >
                                                    <Sparkles className={cn("h-4 w-4", step.contenido_html ? "text-emerald-400" : "text-zinc-600")} />
                                                    <div>
                                                        <p className="text-xs font-medium text-white/70">
                                                            {step.contenido_html ? "✅ Diseño Visual Aplicado" : "Diseñar con Template Builder"}
                                                        </p>
                                                        <p className="text-[10px] text-white/30">
                                                            {step.contenido_html ? "Click para editar" : "Click para abrir el editor visual"}
                                                        </p>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => moveStep(step.id, "up")}
                                                    disabled={index === 0}
                                                    className="rounded-md p-1.5 text-white/20 hover:text-white/50 hover:bg-white/5 disabled:opacity-20 transition-all"
                                                >
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => moveStep(step.id, "down")}
                                                    disabled={index === data.steps.length - 1}
                                                    className="rounded-md p-1.5 text-white/20 hover:text-white/50 hover:bg-white/5 disabled:opacity-20 transition-all"
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => duplicateStep(step.id)}
                                                    className="rounded-md p-1.5 text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateStep(step.id, { activo: !step.activo })}
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-1 rounded transition-all",
                                                        step.activo
                                                            ? "text-emerald-400 bg-emerald-500/10"
                                                            : "text-zinc-500 bg-zinc-800"
                                                    )}
                                                >
                                                    {step.activo ? "Activo" : "Desactivado"}
                                                </button>
                                                <button
                                                    onClick={() => removeStep(step.id)}
                                                    className="rounded-md p-1.5 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Add Step Button */}
                <div className="relative pt-1">
                    {data.steps.length > 0 && (
                        <div className="absolute left-[23px] -top-1 h-4 w-0.5 bg-zinc-800" />
                    )}
                    <button
                        onClick={addStep}
                        className="flex items-center gap-3 w-full p-3 ml-2 rounded-xl border-2 border-dashed border-zinc-800/60 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
                            <Plus className="h-4 w-4 text-zinc-600 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-xs font-medium text-zinc-600 group-hover:text-primary/80 transition-colors">
                            Agregar email a la secuencia
                        </span>
                    </button>
                </div>

                {/* End node */}
                {data.steps.length > 0 && (
                    <div className="flex items-center gap-3 px-2 pt-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-700">
                            <CheckCircle2 className="h-5 w-5 text-zinc-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/30">FIN DE LA SECUENCIA</p>
                            <p className="text-[10px] text-white/15">El lead queda marcado como "completada"</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
