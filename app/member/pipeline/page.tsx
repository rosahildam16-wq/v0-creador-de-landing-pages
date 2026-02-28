"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { LeadCard } from "@/components/admin/lead-card"
import { ETAPA_LABELS, type EtapaPipeline, type Lead } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { TEAM_MEMBERS } from "@/lib/team-data"
import { cn } from "@/lib/utils"
import { Loader2, Users, Kanban, Settings2, Plus, Trash2, Check, X as XIcon } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MemberPipelinePage() {
  const { user } = useAuth()
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [newStageLabel, setNewStageLabel] = useState("")

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
      { label: "lead_nuevo", color: "#3b82f6" },
      { label: "llamada_agendada", color: "#f59e0b" },
      { label: "cerrado", color: "#10b981" }
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
    const newStage = { username: user.username, label: newStageLabel, color: "#8b5cf6", order_index: (stages?.length || 0) }
    setNewStageLabel("")
    await fetch("/api/member/pipeline-stages", {
      method: "POST",
      body: JSON.stringify(newStage)
    })
    mutateStages()
  }

  const deleteStage = async (id: string) => {
    await fetch(`/api/member/pipeline-stages?id=${id}`, { method: "DELETE" })
    mutateStages()
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/10 border border-violet-600/20">
            <Kanban className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pipeline de Ventas</h1>
        </div>
        <p className="text-sm text-violet-300/40 ml-13">
          Gestiona tus {leads?.length || 0} prospectos arrastrándolos entre etapas para cerrar más ventas.
        </p>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-3xl border border-white/[0.05] bg-white/[0.01] p-6">
        <div className="flex gap-6 min-h-[600px]">
          {activeStages.map((stage) => {
            const etapa = stage.label
            const columnLeads = pipeline[etapa] || []
            const isOver = dragOverColumn === etapa

            return (
              <div
                key={etapa}
                className="w-[280px] shrink-0 flex flex-col gap-4"
                onDragOver={(e) => handleDragOver(e, etapa)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, etapa)}
              >
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color, boxShadow: `0 0 10px ${stage.color}80` }}
                    />
                    <span className="text-[11px] font-black uppercase tracking-wider text-white/50">
                      {ETAPA_LABELS[etapa as EtapaPipeline] || etapa.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Badge className="bg-white/5 border-white/10 text-white/40 text-[10px] tabular-nums font-bold">
                    {columnLeads.length}
                  </Badge>
                </div>

                <div className={cn(
                  "flex-1 flex flex-col gap-3 p-3 rounded-3xl border transition-all duration-300 min-h-[400px]",
                  isOver ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]" : "bg-white/[0.02] border-white/5"
                )}>
                  {columnLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isDragging={draggedLead?.lead.id === lead.id}
                      onDragStart={(e) => {
                        // @ts-ignore
                        e.dataTransfer.setData("text/plain", lead.id)
                        handleDragStart(lead, etapa)
                      }}
                      onDragEnd={handleDragEnd}
                    />
                  ))}

                  {columnLeads.length === 0 && !isOver && (
                    <div className="flex flex-1 flex-col items-center justify-center opacity-10 py-20">
                      <Users className="h-10 w-10 mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sin leads</span>
                    </div>
                  )}

                  {isOver && (
                    <div className="flex-1 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Soltar aquí</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="bg-white/5" />
      </ScrollArea>
    </div>
  )
}
