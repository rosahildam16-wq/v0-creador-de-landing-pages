"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LeadCard } from "@/components/admin/lead-card"
import { ETAPA_LABELS, type EtapaPipeline, type Lead } from "@/lib/types"
import { EMBUDOS } from "@/lib/embudos-config"
import { cn } from "@/lib/utils"
import { Loader2, Users, Filter } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Pipeline stages without "contactado"
const PIPELINE_ETAPAS: EtapaPipeline[] = [
  "lead_nuevo",
  "llamada_agendada",
  "no_respondio",
  "presentado",
  "cerrado",
  "perdido",
]

const COLUMN_COLORS: Record<string, string> = {
  lead_nuevo: "border-t-blue-500",
  llamada_agendada: "border-t-amber-500",
  no_respondio: "border-t-orange-500",
  presentado: "border-t-violet-500",
  cerrado: "border-t-emerald-500",
  perdido: "border-t-red-500",
}

export default function PipelinePage() {
  const router = useRouter()
  const { data: leads, isLoading, mutate } = useSWR<Lead[]>("/api/admin/leads", fetcher, {
    refreshInterval: 15000,
  })

  const [draggedLead, setDraggedLead] = useState<{ lead: Lead; fromColumn: EtapaPipeline } | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<EtapaPipeline | null>(null)
  const [embudoFilter, setEmbudoFilter] = useState<string>("todos")

  // Filter leads by embudo
  const filteredLeads = (Array.isArray(leads) ? leads : []).filter((l) => {
    if (embudoFilter === "todos") return true
    return l.embudo_id === embudoFilter
  })

  // Group leads by etapa (leads with "contactado" etapa fall into "lead_nuevo")
  const pipeline: Record<string, Lead[]> = {}
  PIPELINE_ETAPAS.forEach((etapa) => {
    pipeline[etapa] = []
  })
  filteredLeads.forEach((lead) => {
    const etapa = lead.etapa === "contactado" ? "lead_nuevo" : lead.etapa
    if (pipeline[etapa]) {
      pipeline[etapa].push(lead)
    } else {
      pipeline["lead_nuevo"].push(lead)
    }
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

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, toColumn: EtapaPipeline) => {
      e.preventDefault()
      if (!draggedLead || draggedLead.fromColumn === toColumn) {
        setDragOverColumn(null)
        return
      }

      // Optimistic update
      const updatedLeads = (Array.isArray(leads) ? leads : []).map((l) =>
        l.id === draggedLead.lead.id ? { ...l, etapa: toColumn } : l
      )
      mutate(updatedLeads, false)

      // Persist to DB
      await fetch("/api/admin/leads/etapa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: draggedLead.lead.id, etapa: toColumn }),
      })

      setDraggedLead(null)
      setDragOverColumn(null)
    },
    [draggedLead, leads, mutate]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando pipeline...</p>
      </div>
    )
  }

  const totalLeads = filteredLeads.length
  const selectedEmbudo = EMBUDOS.find((e) => e.id === embudoFilter)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {totalLeads} leads en el pipeline
            {selectedEmbudo ? ` - ${selectedEmbudo.nombre}` : ""}
            {" - Arrastra para mover entre etapas"}
          </p>
        </div>

        {/* Embudo selector */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={embudoFilter} onValueChange={setEmbudoFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Seleccionar embudo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los embudos</SelectItem>
              {EMBUDOS.map((embudo) => (
                <SelectItem key={embudo.id} value={embudo.id}>
                  <div className="flex items-center gap-2">
                    <span>{embudo.nombre}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        embudo.tipo === "cita"
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      )}
                    >
                      {embudo.tipo === "cita" ? "Cita" : "Compra"}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {totalLeads === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-semibold">Pipeline vacio</h3>
            <p className="text-center text-sm text-muted-foreground">
              {embudoFilter !== "todos"
                ? "No hay leads en este embudo. Selecciona otro o elige \"Todos los embudos\"."
                : "Los leads apareceran aqui cuando ingresen por el embudo o el webhook."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {totalLeads > 0 && (
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
                  <Card
                    className={cn(
                      "border-t-2 border-border/50 transition-colors",
                      COLUMN_COLORS[etapa],
                      isOver && "border-border bg-secondary/30"
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
                      <CardTitle className="text-xs font-medium">{ETAPA_LABELS[etapa]}</CardTitle>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                        {columnLeads.length}
                      </Badge>
                    </CardHeader>
                    <div
                      className={cn(
                        "flex min-h-[400px] flex-col gap-2 p-3 pt-1 transition-colors",
                        isOver && "rounded-b-lg bg-secondary/10"
                      )}
                    >
                      {columnLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          isDragging={draggedLead?.lead.id === lead.id}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move"
                            handleDragStart(lead, etapa)
                          }}
                          onDragEnd={handleDragEnd}
                          onClick={() => router.push(`/admin/leads/${lead.id}`)}
                        />
                      ))}
                      {columnLeads.length === 0 && (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/50 p-4">
                          <p className="text-center text-xs text-muted-foreground">
                            Sin leads
                          </p>
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
