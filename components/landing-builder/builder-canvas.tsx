"use client"

import { useState, useCallback, useRef } from "react"
import type { LandingBlock, LandingTheme } from "@/lib/landing-builder-types"
import { BlockRenderer } from "./block-renderers"
import { GripVertical, Trash2, ChevronUp, ChevronDown, MousePointerClick } from "lucide-react"

interface BuilderCanvasProps {
  blocks: LandingBlock[]
  theme: LandingTheme
  selectedBlockId: string | null
  draggingType: string | null
  onSelectBlock: (id: string | null) => void
  onDropBlock: (type: string, index: number) => void
  onMoveBlock: (fromIndex: number, toIndex: number) => void
  onDeleteBlock: (id: string) => void
}

export function BuilderCanvas({
  blocks,
  theme,
  selectedBlockId,
  draggingType,
  onSelectBlock,
  onDropBlock,
  onMoveBlock,
  onDeleteBlock,
}: BuilderCanvasProps) {
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = draggingType ? "copy" : "move"
    setDropIndex(index)
  }, [draggingType])

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    const blockType = e.dataTransfer.getData("block-type")
    const fromIdx = e.dataTransfer.getData("block-index")

    if (blockType) {
      // New block from palette
      onDropBlock(blockType, index)
    } else if (fromIdx !== "") {
      // Reorder existing block
      onMoveBlock(parseInt(fromIdx, 10), index)
    }
    setDropIndex(null)
    setDragFromIndex(null)
  }, [onDropBlock, onMoveBlock])

  const handleDragLeave = useCallback(() => {
    setDropIndex(null)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectBlock(null)
    }
  }, [onSelectBlock])

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 overflow-y-auto bg-muted/20"
      onClick={handleCanvasClick}
    >
      {/* Canvas inner */}
      <div className="mx-auto max-w-4xl py-6">
        {blocks.length === 0 ? (
          // Empty canvas
          <div
            className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 p-12 text-center"
            onDragOver={(e) => handleDragOver(e, 0)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 0)}
          >
            <div className="rounded-xl bg-muted/30 p-5">
              <MousePointerClick className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-base font-medium text-muted-foreground">Arrastra bloques aqui</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Selecciona bloques del panel izquierdo y arrastralos a este canvas
            </p>
          </div>
        ) : (
          <>
            {/* Drop zone before first block */}
            <DropZone
              index={0}
              isActive={dropIndex === 0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            {blocks.map((block, i) => (
              <div key={block.id}>
                <CanvasBlock
                  block={block}
                  index={i}
                  theme={theme}
                  isSelected={selectedBlockId === block.id}
                  isDraggedOver={dragFromIndex === i}
                  onSelect={() => onSelectBlock(block.id)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onMoveUp={i > 0 ? () => onMoveBlock(i, i - 1) : undefined}
                  onMoveDown={i < blocks.length - 1 ? () => onMoveBlock(i, i + 1) : undefined}
                  onDragStart={() => setDragFromIndex(i)}
                  onDragEnd={() => setDragFromIndex(null)}
                />
                {/* Drop zone after each block */}
                <DropZone
                  index={i + 1}
                  isActive={dropIndex === i + 1}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// --- Drop Zone ---
function DropZone({
  index,
  isActive,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  index: number
  isActive: boolean
  onDragOver: (e: React.DragEvent, idx: number) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, idx: number) => void
}) {
  return (
    <div
      className={`relative mx-4 transition-all duration-200 ${isActive ? "py-4" : "py-1"}`}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
    >
      <div
        className={`mx-auto h-1 rounded-full transition-all duration-200 ${
          isActive
            ? "w-full bg-primary shadow-[0_0_12px_rgba(124,58,237,0.4)]"
            : "w-0 bg-transparent"
        }`}
      />
      {isActive && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] font-medium text-primary">
          Soltar aqui
        </p>
      )}
    </div>
  )
}

// --- Canvas Block Wrapper ---
function CanvasBlock({
  block,
  index,
  theme,
  isSelected,
  isDraggedOver,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
}: {
  block: LandingBlock
  index: number
  theme: LandingTheme
  isSelected: boolean
  isDraggedOver: boolean
  onSelect: () => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <div
      className={`group relative mx-4 cursor-pointer overflow-hidden rounded-lg transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "hover:ring-1 hover:ring-border/60"
      } ${isDraggedOver ? "opacity-50" : ""}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("block-index", String(index))
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onDragEnd={onDragEnd}
    >
      {/* Toolbar */}
      <div className={`absolute right-2 top-2 z-20 flex items-center gap-1 rounded-lg border border-border/50 bg-background/90 p-1 shadow-lg backdrop-blur-sm transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <button className="cursor-grab rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastrar">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        {onMoveUp && (
          <button onClick={(e) => { e.stopPropagation(); onMoveUp() }} className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mover arriba">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        )}
        {onMoveDown && (
          <button onClick={(e) => { e.stopPropagation(); onMoveDown() }} className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Mover abajo">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="mx-0.5 h-4 w-px bg-border/50" />
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Eliminar">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block type label */}
      <div className={`absolute left-2 top-2 z-20 rounded-md border border-border/50 bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
      </div>

      {/* Rendered block */}
      <div className="pointer-events-none">
        <BlockRenderer block={block} theme={theme} />
      </div>
    </div>
  )
}
