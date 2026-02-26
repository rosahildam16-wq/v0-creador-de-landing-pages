"use client"

import { cn } from "@/lib/utils"
import { TemperatureBadge } from "./temperature-badge"
import { calcularTemperatura } from "@/lib/lead-scoring"
import type { Lead } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { GripVertical } from "lucide-react"

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onClick?: () => void
}

const FUENTE_ICONS: Record<string, string> = {
  "Meta Ads": "M",
  "Instagram": "IG",
  "TikTok": "TT",
  "Google": "G",
  "Organico": "O",
}

export function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick }: LeadCardProps) {
  const { temperatura, score } = calcularTemperatura(lead)
  const timeAgo = formatDistanceToNow(new Date(lead.fecha_ingreso), { locale: es, addSuffix: true })

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group cursor-grab rounded-xl border border-border/30 bg-card/60 p-3 backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:bg-card/80 active:cursor-grabbing",
        isDragging && "rotate-2 opacity-50 shadow-lg shadow-primary/10"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">{lead.nombre}</span>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold text-muted-foreground">
              {FUENTE_ICONS[lead.fuente] || "?"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <TemperatureBadge temperatura={temperatura} score={score} />
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
          {lead.asignado_a && lead.asignado_a !== "Sin asignar" && (
            <div className="pt-1 border-t border-border/10">
              <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest italic leading-none">
                Socio: {lead.asignado_a}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
