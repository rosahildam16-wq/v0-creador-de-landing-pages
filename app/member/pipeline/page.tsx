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
import { Loader2, Users } from "lucide-react"
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
  const member = TEAM_MEMBERS.find((m) => m.id === user?.memberId)

  const { data: allLeads, isLoading, mutate } = useSWR<Lead[]>("/api/admin/leads", fetcher, {
    refreshInterval: 15000,
  })

  const myLeads = useMemo(() => {
    if (!allLeads || !member) return []
    return allLeads.filter((l) => l.asignado_a === member.id || member.embudos_asignados.includes(l.embudo_id))
  }, [allLeads, member])

  const [draggedLead, setDraggedLead] = useState<{ lead: Lead; fromColumn: EtapaPipeline } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<EtapaPipeline | null>(null)

  const pipeline: Record<string, Lead[]> = {}
  PIPELINE_ETAPAS.forEach((etapa) => { pipeline[etapa] = [] })
  myLeads.forEach((lead) => {
    const etapa = lead.etapa === "contactado" ? "lead_nuevo" : lead.etapa
    if (pipeline[etapa]) pipeline[etapa].push(lead)
    else pipeline["lead_nuevo"].push(lead)
  })

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

  const handleDragLeave = useCallback(() => { setDragOverColumn(null) }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, toColumn: EtapaPipeline) => {
      e.preventDefault()
      if (!draggedLead || draggedLead.fromColumn === toColumn) { setDragOverColumn(null); return }
      const updatedLeads = (allLeads || []).map((l) =>
        l.id === draggedLead.lead.id ? { ...l, etapa: toColumn } : l
      )
      mutate(updatedLeads, false)
      await fetch("/api/admin/leads/etapa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: draggedLead.lead.id, etapa: toColumn }),
      })
      setDraggedLead(null)
      setDragOverColumn(null)
    },
    [draggedLead, allLeads, mutate]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando pipeline...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {myLeads.length} leads en tu pipeline - Arrastra para mover entre etapas
        </p>
      </div>

      {myLeads.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-semibold">Pipeline vacio</h3>
            <p className="text-center text-sm text-muted-foreground">
              Tus leads apareceran aqui cuando ingresen por tu embudo asignado.
            </p>
          </CardContent>
        </Card>
      )}

      {myLeads.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: `${PIPELINE_ETAPAS.length * 272}px` }}>
            {PIPELINE_ETAPAS.map((etapa) => {
              const columnLeads = pipeline[etapa] || []
              const isOver = dragOverColumn === etapa
              return (
                <div
                  key={etapa}
                  className="w-64 shrink-0"
                  onDragOver={(e) => handleDragOver(e, etapa)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, etapa)}
                >
                  <Card className={cn("border-t-2 border-border/50 transition-colors", COLUMN_COLORS[etapa], isOver && "border-border bg-secondary/30")}>
                    <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
                      <CardTitle className="text-xs font-medium">{ETAPA_LABELS[etapa]}</CardTitle>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">{columnLeads.length}</Badge>
                    </CardHeader>
                    <div className={cn("flex min-h-[400px] flex-col gap-2 p-3 pt-1 transition-colors", isOver && "rounded-b-lg bg-secondary/10")}>
                      {columnLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          isDragging={draggedLead?.lead.id === lead.id}
                          onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; handleDragStart(lead, etapa) }}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                      {columnLeads.length === 0 && (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/50 p-4">
                          <p className="text-center text-xs text-muted-foreground">Sin leads</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}
