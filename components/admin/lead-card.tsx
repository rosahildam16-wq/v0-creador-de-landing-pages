"use client"

import { cn } from "@/lib/utils"
import { TemperatureBadge } from "./temperature-badge"
import { calcularTemperatura } from "@/lib/lead-scoring"
import type { Lead } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { GripVertical, Sparkles, Tag, Phone, Mail } from "lucide-react"
import { useState, useEffect, useRef } from "react"

// Trello-style tag colors
export const PIPELINE_TAGS = [
  { id: "urgente", label: "Urgente", color: "#ef4444" },
  { id: "calificado", label: "Calificado", color: "#22c55e" },
  { id: "seguimiento", label: "Seguimiento", color: "#3b82f6" },
  { id: "interesado", label: "Interesado", color: "#f59e0b" },
  { id: "vip", label: "VIP", color: "#a855f7" },
  { id: "frio", label: "Frío", color: "#64748b" },
  { id: "recontactar", label: "Re-contactar", color: "#06b6d4" },
  { id: "cerrar", label: "Por Cerrar", color: "#f97316" },
]

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onClick?: () => void
  tags?: string[]
  onTagsChange?: (leadId: string, tags: string[]) => void
}

export function LeadCard({ lead, isDragging, onDragStart, onDragEnd, onClick, tags = [], onTagsChange }: LeadCardProps) {
  const { temperatura, score } = calcularTemperatura(lead)
  const timeAgo = formatDistanceToNow(new Date(lead.fecha_ingreso), { locale: es, addSuffix: true })
  const [showTagMenu, setShowTagMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTagMenu(false)
      }
    }
    if (showTagMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showTagMenu])

  const toggleTag = (tagId: string) => {
    const newTags = tags.includes(tagId) ? tags.filter(t => t !== tagId) : [...tags, tagId]
    onTagsChange?.(lead.id, newTags)
  }

  const activeTags = PIPELINE_TAGS.filter(t => tags.includes(t.id))

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group relative cursor-grab rounded-xl border border-white/[0.06] bg-zinc-900/80 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.12] hover:bg-zinc-900 active:cursor-grabbing overflow-hidden",
        isDragging && "rotate-[3deg] scale-105 opacity-60 shadow-2xl shadow-primary/20 z-50"
      )}
    >
      {/* Tag color bars - Trello style */}
      {activeTags.length > 0 && (
        <div className="flex gap-1 px-3 pt-2.5 pb-0.5 flex-wrap">
          {activeTags.map(tag => (
            <div
              key={tag.id}
              className="h-2 rounded-full min-w-[40px] flex-shrink-0 transition-all hover:h-4 cursor-pointer group/tag relative"
              style={{ backgroundColor: tag.color }}
              title={tag.label}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white opacity-0 group-hover/tag:opacity-100 transition-opacity">
                {tag.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 pt-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* Name + Tag button */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white/90">{lead.nombre}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setShowTagMenu(!showTagMenu) }}
                className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 transition-all opacity-0 group-hover:opacity-100"
              >
                <Tag className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-3 text-[11px] text-white/30">
            {lead.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.email}</span>
              </span>
            )}
            {lead.telefono && (
              <span className="flex items-center gap-1 shrink-0">
                <Phone className="h-3 w-3" />
                {lead.telefono}
              </span>
            )}
          </div>

          {/* Temperature + time */}
          <div className="flex items-center justify-between gap-2">
            <TemperatureBadge temperatura={temperatura} score={score} />
            <span className="text-[10px] text-white/20">{timeAgo}</span>
          </div>

          {/* Magic Prospect badge */}
          {lead.insight && lead.insight.qualification_score >= 8 && (
            <div className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 w-fit">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Magic Prospect</span>
            </div>
          )}

          {/* Assigned to */}
          {lead.asignado_a && lead.asignado_a !== "Sin asignar" && (
            <div className="pt-1 border-t border-white/5">
              <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest italic">
                Socio: {lead.asignado_a}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tag picker dropdown */}
      {showTagMenu && (
        <div
          ref={menuRef}
          className="absolute top-0 right-0 z-50 mt-8 mr-2 w-44 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/50"
          onClick={e => e.stopPropagation()}
        >
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/30">Etiquetas</p>
          {PIPELINE_TAGS.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-white/5"
            >
              <div
                className={cn(
                  "h-4 w-8 rounded",
                  tags.includes(tag.id) && "ring-2 ring-white/40"
                )}
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-white/70">{tag.label}</span>
              {tags.includes(tag.id) && (
                <span className="ml-auto text-[10px] text-emerald-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
