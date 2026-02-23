"use client"

import { useState, useEffect, useReducer, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { getLanding, saveLanding } from "@/lib/landing-builder-storage"
import { getDefaultProps } from "@/lib/landing-block-defaults"
import type { LandingConfig, LandingBlock, LandingTheme, BlockType } from "@/lib/landing-builder-types"
import { BlockPalette } from "@/components/landing-builder/block-palette"
import { BuilderCanvas } from "@/components/landing-builder/builder-canvas"
import { BlockProperties } from "@/components/landing-builder/block-properties"
import {
  ArrowLeft, Save, Eye, Undo2, Redo2, Monitor, Smartphone, Check,
  PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen,
} from "lucide-react"

// --- State management ---
type Action =
  | { type: "SET_CONFIG"; config: LandingConfig }
  | { type: "ADD_BLOCK"; blockType: BlockType; index: number }
  | { type: "REMOVE_BLOCK"; id: string }
  | { type: "MOVE_BLOCK"; fromIndex: number; toIndex: number }
  | { type: "UPDATE_BLOCK_PROPS"; id: string; props: Record<string, unknown> }
  | { type: "UPDATE_THEME"; theme: LandingTheme }
  | { type: "UPDATE_NAME"; name: string }
  | { type: "UNDO" }
  | { type: "REDO" }

interface BuilderState {
  config: LandingConfig | null
  history: LandingConfig[]
  historyIndex: number
  selectedBlockId: string | null
}

function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function pushToHistory(state: BuilderState, newConfig: LandingConfig): BuilderState {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(JSON.parse(JSON.stringify(newConfig)))
  return {
    ...state,
    config: newConfig,
    history: newHistory.slice(-30), // Keep last 30 states
    historyIndex: Math.min(newHistory.length - 1, 29),
  }
}

function builderReducer(state: BuilderState, action: Action): BuilderState {
  switch (action.type) {
    case "SET_CONFIG": {
      return {
        config: action.config,
        history: [JSON.parse(JSON.stringify(action.config))],
        historyIndex: 0,
        selectedBlockId: null,
      }
    }
    case "ADD_BLOCK": {
      if (!state.config) return state
      const newBlock: LandingBlock = {
        id: generateBlockId(),
        type: action.blockType,
        props: getDefaultProps(action.blockType),
        order: action.index,
      }
      const blocks = [...state.config.blocks]
      blocks.splice(action.index, 0, newBlock)
      const reordered = blocks.map((b, i) => ({ ...b, order: i }))
      const newConfig = { ...state.config, blocks: reordered }
      return { ...pushToHistory(state, newConfig), selectedBlockId: newBlock.id }
    }
    case "REMOVE_BLOCK": {
      if (!state.config) return state
      const blocks = state.config.blocks
        .filter((b) => b.id !== action.id)
        .map((b, i) => ({ ...b, order: i }))
      const newConfig = { ...state.config, blocks }
      return {
        ...pushToHistory(state, newConfig),
        selectedBlockId: state.selectedBlockId === action.id ? null : state.selectedBlockId,
      }
    }
    case "MOVE_BLOCK": {
      if (!state.config) return state
      const blocks = [...state.config.blocks]
      const [moved] = blocks.splice(action.fromIndex, 1)
      const targetIndex = action.toIndex > action.fromIndex ? action.toIndex - 1 : action.toIndex
      blocks.splice(targetIndex, 0, moved)
      const reordered = blocks.map((b, i) => ({ ...b, order: i }))
      const newConfig = { ...state.config, blocks: reordered }
      return pushToHistory(state, newConfig)
    }
    case "UPDATE_BLOCK_PROPS": {
      if (!state.config) return state
      const blocks = state.config.blocks.map((b) =>
        b.id === action.id ? { ...b, props: action.props } : b
      )
      const newConfig = { ...state.config, blocks }
      return pushToHistory(state, newConfig)
    }
    case "UPDATE_THEME": {
      if (!state.config) return state
      const newConfig = { ...state.config, theme: action.theme }
      return pushToHistory(state, newConfig)
    }
    case "UPDATE_NAME": {
      if (!state.config) return state
      const newConfig = { ...state.config, name: action.name }
      return { ...state, config: newConfig }
    }
    case "UNDO": {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        ...state,
        config: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      }
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        ...state,
        config: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      }
    }
    default:
      return state
  }
}

// --- Page Component ---
export default function LandingEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [state, dispatch] = useReducer(builderReducer, {
    config: null,
    history: [],
    historyIndex: 0,
    selectedBlockId: null,
  })

  const [draggingType, setDraggingType] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load landing
  useEffect(() => {
    const landing = getLanding(id)
    if (landing) {
      dispatch({ type: "SET_CONFIG", config: landing })
    }
  }, [id])

  // Auto-save every 5 seconds when there are changes
  useEffect(() => {
    if (!state.config) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveLanding(state.config!)
    }, 5000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [state.config])

  const handleSave = useCallback(() => {
    if (!state.config) return
    saveLanding(state.config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [state.config])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          dispatch({ type: "REDO" })
        } else {
          dispatch({ type: "UNDO" })
        }
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleSave])

  const selectedBlock = state.config?.blocks.find((b) => b.id === state.selectedBlockId) ?? null

  if (!state.config) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Cargando editor...</p>
      </div>
    )
  }

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Top Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-card/80 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleSave()
              router.push("/admin/landing-builder")
            }}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-5 w-px bg-border/50" />
          <input
            type="text"
            value={state.config.name}
            onChange={(e) => dispatch({ type: "UPDATE_NAME", name: e.target.value })}
            className="max-w-[200px] rounded-md bg-transparent px-2 py-1 text-sm font-semibold text-foreground outline-none transition-colors focus:bg-muted/50"
          />
        </div>

        <div className="flex items-center gap-1">
          {/* Undo / Redo */}
          <button onClick={() => dispatch({ type: "UNDO" })} disabled={!canUndo}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            aria-label="Deshacer">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={() => dispatch({ type: "REDO" })} disabled={!canRedo}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            aria-label="Rehacer">
            <Redo2 className="h-4 w-4" />
          </button>
          <div className="mx-1 h-5 w-px bg-border/50" />

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-border/40 bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode("desktop")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "desktop" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              aria-label="Vista escritorio"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`rounded-md p-1.5 transition-colors ${viewMode === "mobile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              aria-label="Vista movil"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mx-1 h-5 w-px bg-border/50" />

          {/* Panel toggles */}
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={leftOpen ? "Ocultar bloques" : "Mostrar bloques"}
          >
            {leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={rightOpen ? "Ocultar propiedades" : "Mostrar propiedades"}
          >
            {rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
          <div className="mx-1 h-5 w-px bg-border/50" />

          {/* Preview */}
          <button
            onClick={() => window.open(`/admin/landing-builder/preview/${id}`, "_blank")}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium shadow-sm transition-all ${
              saved
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {saved ? <><Check className="h-3.5 w-3.5" /> Guardado</> : <><Save className="h-3.5 w-3.5" /> Guardar</>}
          </button>
        </div>
      </header>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Block Palette */}
        {leftOpen && (
          <aside className="w-56 shrink-0 border-r border-border/40 bg-card/50">
            <BlockPalette
              onDragStart={(type) => setDraggingType(type)}
              onDragEnd={() => setDraggingType(null)}
            />
          </aside>
        )}

        {/* Center: Canvas */}
        <div className={`flex flex-1 items-start justify-center overflow-hidden bg-muted/10 ${viewMode === "mobile" ? "px-4" : ""}`}>
          <div className={`h-full w-full transition-all ${viewMode === "mobile" ? "max-w-[375px]" : ""}`}>
            <BuilderCanvas
              blocks={state.config.blocks}
              theme={state.config.theme}
              selectedBlockId={state.selectedBlockId ?? null}
              draggingType={draggingType}
              onSelectBlock={(id) => dispatch({ type: "UPDATE_NAME", name: state.config!.name }) || (state.selectedBlockId !== id && (state as { selectedBlockId: string | null }).selectedBlockId !== id) ? undefined : undefined}
              onDropBlock={(type, index) => dispatch({ type: "ADD_BLOCK", blockType: type as BlockType, index })}
              onMoveBlock={(from, to) => dispatch({ type: "MOVE_BLOCK", fromIndex: from, toIndex: to })}
              onDeleteBlock={(id) => dispatch({ type: "REMOVE_BLOCK", id })}
            />
          </div>
        </div>

        {/* Right panel: Properties */}
        {rightOpen && (
          <aside className="w-72 shrink-0 border-l border-border/40 bg-card/50">
            <BlockProperties
              block={selectedBlock}
              theme={state.config.theme}
              onUpdateBlock={(id, props) => dispatch({ type: "UPDATE_BLOCK_PROPS", id, props })}
              onUpdateTheme={(theme) => dispatch({ type: "UPDATE_THEME", theme })}
              onDeleteBlock={(id) => dispatch({ type: "REMOVE_BLOCK", id })}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
