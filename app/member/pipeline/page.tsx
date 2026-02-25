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
import { Loader2, Users, Kanban } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PIPELINE_ETAPAS: EtapaPipeline[] = [
  "lead_nuevo", "llamada_agendada", "no_respondio", "presentado", "cerrado", "perdido",
]

const COLUMN_COLORS: Record<string, string> = {
  lead_nuevo: "border-t-blue-500",
  llamada_agendada: "border-t-amber-500",
  no_respondio: "border-t-orange-500",
  presentado: "border-t-violet-500",
  cerrado: "border-t-emerald-500",
  perdido: "border-t-red-500",
}

export default function MemberPipelinePage() {
  const { user } = useAuth()
  const { data: leads, isLoading, mutate } = useSWR<Lead[]>(
    user?.email ? `/api/member/leads?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const [draggedLead, setDraggedLead] = useState<{ lead: Lead; fromColumn: EtapaPipeline } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<EtapaPipeline | null>(null)

  const pipeline = useMemo(() => {
    const cols: Record<string, Lead[]> = {}
    PIPELINE_ETAPAS.forEach((etapa) => { cols[etapa] = [] })
    if (leads) {
      leads.forEach((lead) => {
        const etapa = lead.etapa as EtapaPipeline
        if (cols[etapa]) cols[etapa].push(lead)
        else cols["lead_nuevo"].push(lead)
      })
    }
    return cols
  }, [leads])

  const handleDragStart = useCallback((lead: Lead, fromColumn: EtapaPipeline) => {
    setDraggedLead({ lead, fromColumn })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedLead(null)
    setDragOverColumn(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, column: EtapaPipeline) => {
    e.preventDefault()
    setDragOverColumn(column)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, toColumn: EtapaPipeline) => {
      e.preventDefault()
      if (!draggedLead || draggedLead.fromColumn === toColumn) {
        setDragOverColumn(null)
        return
      }

      // Optimistic update
      const updatedLeads = (leads || []).map((l) =>
        l.id === draggedLead.lead.id ? { ...l, etapa: toColumn } : l
      )
      mutate(updatedLeads, false)

      try {
        await fetch("/api/member/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: draggedLead.lead.id, etapa: toColumn }),
        })
      } catch (err) {
        console.error("Failed to update lead stage:", err)
        mutate() // Revert on error
      }

      setDraggedLead(null)
      setDragOverColumn(null)
    },
    [draggedLead, leads, mutate]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-pulse rounded-full bg-violet-500/40" />
          </div>
        </div>
        <p className="text-sm font-medium text-violet-300/60 animate-pulse">Sincronizando pipeline...</p>
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
          {PIPELINE_ETAPAS.map((etapa) => {
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
                {/* Column Header */}
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full",
                      etapa === 'cerrado' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                        etapa === 'perdido' ? "bg-red-500" : "bg-violet-500"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-200/70">
                      {ETAPA_LABELS[etapa]}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white/[0.03] border-white/[0.08] text-violet-300/60 px-2 py-0.5 text-[10px]">
                    {columnLeads.length}
                  </Badge>
                </div>

                {/* Column Content */}
                <div className={cn(
                  "flex-1 flex flex-col gap-3 p-3 rounded-2xl border transition-all duration-300",
                  isOver
                    ? "bg-violet-600/[0.08] border-violet-500/40 shadow-[inner_0_0_20px_rgba(139,92,246,0.1)]"
                    : "bg-white/[0.02] border-white/[0.05]"
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
                    <div className="flex flex-1 flex-col items-center justify-center opacity-20 py-10">
                      <Users className="h-8 w-8 mb-2" />
                      <span className="text-[10px] font-medium">Vacío</span>
                    </div>
                  )}

                  {isOver && columnLeads.length === 0 && (
                    <div className="flex-1 rounded-xl border-2 border-dashed border-violet-500/30 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-violet-400 animate-pulse">Soltar aquí</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="bg-white/[0.02]" />
      </ScrollArea>
    </div>
  )
}
