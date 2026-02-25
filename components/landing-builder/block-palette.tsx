"use client"

import type { BlockMeta } from "@/lib/landing-builder-types"
import { BLOCK_CATALOG } from "@/lib/landing-builder-types"
import {
  Sparkles, AlertTriangle, Gift, MessageSquare, HelpCircle,
  Zap, Clock, FileText, Play, Image, GripVertical, Users,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, AlertTriangle, Gift, MessageSquare, HelpCircle,
  Zap, Clock, FileText, Play, Image, Users,
}

const CATEGORIES = [
  { key: "content" as const, label: "Contenido" },
  { key: "conversion" as const, label: "Conversion" },
  { key: "media" as const, label: "Media" },
]

interface BlockPaletteProps {
  onDragStart: (type: string) => void
  onDragEnd: () => void
}

export function BlockPalette({ onDragStart, onDragEnd }: BlockPaletteProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/40 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Bloques</h3>
        <p className="text-xs text-muted-foreground">Arrastra al canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {CATEGORIES.map((cat) => {
          const blocks = BLOCK_CATALOG.filter((b) => b.category === cat.key)
          if (blocks.length === 0) return null
          return (
            <div key={cat.key} className="mb-4">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {cat.label}
              </p>
              <div className="flex flex-col gap-1.5">
                {blocks.map((block) => (
                  <PaletteItem
                    key={block.type}
                    block={block}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaletteItem({
  block,
  onDragStart,
  onDragEnd,
}: {
  block: BlockMeta
  onDragStart: (type: string) => void
  onDragEnd: () => void
}) {
  const Icon = ICON_MAP[block.icon] ?? Sparkles

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("block-type", block.type)
        e.dataTransfer.effectAllowed = "copy"
        onDragStart(block.type)
      }}
      onDragEnd={onDragEnd}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5 active:cursor-grabbing active:scale-[0.97]"
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary/60" />
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{block.label}</p>
        <p className="truncate text-[10px] text-muted-foreground">{block.description}</p>
      </div>
    </div>
  )
}
