"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { LeadCard, PIPELINE_TAGS } from "@/components/admin/lead-card"
import { ETAPA_LABELS, type EtapaPipeline, type Lead } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  Loader2, Users, Kanban, Plus, Trash2, Check, X as XIcon,
  GripVertical, Pencil, UserPlus, Phone, Mail, ChevronDown
} from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STAGE_COLORS = [
  "#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"
]

export default function MemberPipelinePage() {
  const { user } = useAuth()
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [newStageLabel, setNewStageLabel] = useState("")
  const [newStageColor, setNewStageColor] = useState("#8b5cf6")
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState("")
  const [addingLeadTo, setAddingLeadTo] = useState<string | null>(null)
  const [newLeadName, setNewLeadName] = useState("")
  const [newLeadEmail, setNewLeadEmail] = useState("")
  const [newLeadPhone, setNewLeadPhone] = useState("")

  // Tags stored in localStorage
  const [leadTags, setLeadTags] = useState<Record<string, string[]>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mf_pipeline_tags")
      if (stored) setLeadTags(JSON.parse(stored))
    } catch { }
  }, [])

  const saveLeadTags = (tags: Record<string, string[]>) => {
    setLeadTags(tags)
    try { localStorage.setItem("mf_pipeline_tags", JSON.stringify(tags)) } catch { }
  }

  const handleTagsChange = (leadId: string, tags: string[]) => {
    const updated = { ...leadTags, [leadId]: tags }
    saveLeadTags(updated)
  }

  // Fetch Stages
  const { data: stages, mutate: mutateStages } = useSWR<any[]>(
    user?.username ? `/api/member/pipeline-stages?username=${user.username}` : null,
    fetcher
  )

  // Fetch Leads
  const { data: leads, isLoading, mutate: mutateLeads } = useSWR<Lead[]>(
    user?.email ? `/api/member/leads?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const activeStages = stages && stages.length > 0
    ? stages
    : [
      { id: "default-1", label: "lead_nuevo", color: "#3b82f6", order_index: 0 },
      { id: "default-2", label: "llamada_agendada", color: "#f59e0b", order_index: 1 },
      { id: "default-3", label: "presentado", color: "#8b5cf6", order_index: 2 },
      { id: "default-4", label: "cerrado", color: "#10b981", order_index: 3 },
      { id: "default-5", label: "perdido", color: "#ef4444", order_index: 4 }
    ]

  const [draggedLead, setDraggedLead] = useState<{ lead: Lead; fromColumn: string } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const pipeline = useMemo(() => {
    const cols: Record<string, Lead[]> = {}
    activeStages.forEach((s) => { cols[s.label] = [] })
    if (leads) {
      leads.forEach((lead) => {
        const etapa = lead.etapa || activeStages[0].label
        if (cols[etapa]) cols[etapa].push(lead)
        else if (activeStages[0]) cols[activeStages[0].label].push(lead)
      })
    }
    return cols
  }, [leads, activeStages])

  const totalLeads = leads?.length || 0

  const handleDragStart = useCallback((lead: Lead, fromColumn: string) => {
    setDraggedLead({ lead, fromColumn })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedLead(null)
    setDragOverColumn(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, column: string) => {
    e.preventDefault()
    setDragOverColumn(column)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, toColumn: string) => {
      e.preventDefault()
      if (!draggedLead || draggedLead.fromColumn === toColumn) {
        setDragOverColumn(null)
        return
      }

      const updatedLeads = (leads || []).map((l) =>
        l.id === draggedLead.lead.id ? { ...l, etapa: toColumn } : l
      ) as Lead[]
      mutateLeads(updatedLeads, false)

      try {
        await fetch("/api/member/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: draggedLead.lead.id, etapa: toColumn }),
        })
      } catch (err) {
        mutateLeads()
      }

      setDraggedLead(null)
      setDragOverColumn(null)
    },
    [draggedLead, leads, mutateLeads]
  )

  const addStage = async () => {
    if (!newStageLabel.trim() || !user?.username) return
    const newStage = {
      username: user.username,
      label: newStageLabel.toLowerCase().replace(/\s+/g, "_"),
      color: newStageColor,
      order_index: (stages?.length || 0)
    }
    setNewStageLabel("")
    await fetch("/api/member/pipeline-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStage)
    })
    mutateStages()
  }

  const deleteStage = async (id: string) => {
    if (!confirm("¿Eliminar esta etapa? Los leads se moverán a la primera columna.")) return
    await fetch(`/api/member/pipeline-stages?id=${id}`, { method: "DELETE" })
    mutateStages()
  }

  const renameStage = async (stage: any) => {
    if (!editingLabel.trim() || !user?.username) return
    await fetch("/api/member/pipeline-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        label: editingLabel.toLowerCase().replace(/\s+/g, "_"),
        color: stage.color,
        order_index: stage.order_index
      })
    })
    setEditingStageId(null)
    setEditingLabel("")
    mutateStages()
  }

  const addManualLead = async (toStage: string) => {
    if (!newLeadName.trim()) return
    try {
      await fetch("/api/member/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newLeadName,
          email: newLeadEmail || `${newLeadName.toLowerCase().replace(/\s/g, ".")}@manual.com`,
          telefono: newLeadPhone || "",
          etapa: toStage,
          fuente: "Manual",
          referido_por: user?.email || "",
        })
      })
      mutateLeads()
      setAddingLeadTo(null)
      setNewLeadName("")
      setNewLeadEmail("")
      setNewLeadPhone("")
    } catch (err) {
      console.error("Error adding lead:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-white/40">Sincronizando pipeline...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 border border-violet-600/20">
            <Kanban className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Pipeline de Ventas</h1>
            <p className="text-xs text-white/30">
              {totalLeads} prospectos • Arrastra las tarjetas entre columnas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfiguring(!isConfiguring)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
              isConfiguring
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
            )}
          >
            <Pencil className="h-3 w-3" />
            {isConfiguring ? "Listo" : "Editar Etapas"}
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <ScrollArea className="w-full whitespace-nowrap rounded-2xl border border-white/[0.05] bg-white/[0.01] p-4">
        <div className="flex gap-4 min-h-[600px]">
          {activeStages.map((stage) => {
            const etapa = stage.label
            const columnLeads = pipeline[etapa] || []
            const isOver = dragOverColumn === etapa
            const isEditing = editingStageId === stage.id

            return (
              <div
                key={etapa}
                className="w-[280px] shrink-0 flex flex-col gap-3"
                onDragOver={(e) => handleDragOver(e, etapa)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, etapa)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color, boxShadow: `0 0 8px ${stage.color}60` }}
                    />
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingLabel}
                          onChange={e => setEditingLabel(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") renameStage(stage); if (e.key === "Escape") setEditingStageId(null) }}
                          autoFocus
                          className="w-[120px] rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs text-white focus:outline-none focus:border-primary"
                        />
                        <button onClick={() => renameStage(stage)} className="text-emerald-400 hover:text-emerald-300"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingStageId(null)} className="text-red-400 hover:text-red-300"><XIcon className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wider text-white/50 truncate",
                          isConfiguring && "cursor-pointer hover:text-white/80"
                        )}
                        onDoubleClick={() => {
                          if (isConfiguring) {
                            setEditingStageId(stage.id)
                            setEditingLabel(ETAPA_LABELS[etapa as EtapaPipeline] || etapa.replace(/_/g, " "))
                          }
                        }}
                      >
                        {ETAPA_LABELS[etapa as EtapaPipeline] || etapa.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className="bg-white/5 border-white/10 text-white/40 text-[10px] tabular-nums font-bold h-5 px-1.5">
                      {columnLeads.length}
                    </Badge>
                    {isConfiguring && stage.id && !stage.id.startsWith("default") && (
                      <button
                        onClick={() => deleteStage(stage.id)}
                        className="text-red-400/50 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Column Body */}
                <div className={cn(
                  "flex-1 flex flex-col gap-2 p-2 rounded-2xl border transition-all duration-300 min-h-[400px]",
                  isOver
                    ? "bg-primary/5 border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.08)]"
                    : "bg-zinc-900/30 border-white/[0.04]"
                )}>
                  {/* Lead Cards */}
                  <div className="flex flex-col gap-2 flex-1">
                    {columnLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isDragging={draggedLead?.lead.id === lead.id}
                        tags={leadTags[lead.id] || []}
                        onTagsChange={handleTagsChange}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", lead.id)
                          handleDragStart(lead, etapa)
                        }}
                        onDragEnd={handleDragEnd}
                      />
                    ))}

                    {/* Empty state */}
                    {columnLeads.length === 0 && !isOver && (
                      <div className="flex flex-1 flex-col items-center justify-center opacity-[0.08] py-16">
                        <Users className="h-8 w-8 mb-1" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Sin leads</span>
                      </div>
                    )}

                    {/* Drop zone indicator */}
                    {isOver && (
                      <div className="rounded-xl border-2 border-dashed border-primary/20 p-6 flex items-center justify-center">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">
                          Soltar aquí
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add lead form */}
                  {addingLeadTo === etapa ? (
                    <div className="rounded-xl bg-zinc-900 border border-white/10 p-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre *"
                        value={newLeadName}
                        onChange={e => setNewLeadName(e.target.value)}
                        autoFocus
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newLeadEmail}
                        onChange={e => setNewLeadEmail(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        value={newLeadPhone}
                        onChange={e => setNewLeadPhone(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => addManualLead(etapa)}
                          className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                        >
                          Agregar
                        </button>
                        <button
                          onClick={() => { setAddingLeadTo(null); setNewLeadName(""); setNewLeadEmail(""); setNewLeadPhone("") }}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white/50 hover:bg-zinc-700 transition-colors"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLeadTo(etapa)}
                      className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/[0.06] py-2 px-3 text-[11px] text-white/20 hover:border-white/15 hover:text-white/40 hover:bg-white/[0.02] transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar lead
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add New Column */}
          <div className="w-[280px] shrink-0 flex flex-col gap-3">
            <div className="flex-1 flex flex-col rounded-2xl border-2 border-dashed border-white/[0.04] hover:border-white/[0.08] transition-colors p-4">
              {isConfiguring ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">Nueva Etapa</p>
                  <input
                    type="text"
                    placeholder="Nombre de la etapa..."
                    value={newStageLabel}
                    onChange={e => setNewStageLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addStage() }}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {STAGE_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewStageColor(c)}
                        className={cn(
                          "h-6 w-6 rounded-full transition-all",
                          newStageColor === c ? "ring-2 ring-white/50 scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={addStage}
                    disabled={!newStageLabel.trim()}
                    className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-30 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-1" />
                    Crear Etapa
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfiguring(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-2 text-white/10 hover:text-white/25 transition-colors"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Agregar Etapa</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" className="bg-white/5" />
      </ScrollArea>

      {/* Tag legend */}
      <div className="flex flex-wrap gap-2 px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 mr-2 py-1">Etiquetas:</span>
        {PIPELINE_TAGS.map(tag => (
          <div key={tag.id} className="flex items-center gap-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] px-2.5 py-1">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="text-[10px] text-white/40">{tag.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
