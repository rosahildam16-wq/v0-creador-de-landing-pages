"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getLandings, deleteLanding, duplicateLanding, createLanding } from "@/lib/landing-builder-storage"
import { TEMPLATES } from "@/lib/landing-builder-types"
import type { LandingConfig, TemplateKey } from "@/lib/landing-builder-types"
import {
  Plus, MoreVertical, Pencil, Copy, Trash2, Eye, LayoutTemplate,
  ShoppingCart, Users, Calendar, FileText, X, Layers,
} from "lucide-react"

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  ShoppingCart, Users, Calendar,
}

export default function LandingBuilderPage() {
  const router = useRouter()
  const [landings, setLandings] = useState<LandingConfig[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLandings(getLandings().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleCreate = (name: string, description: string, template: TemplateKey | "blank") => {
    const blockTypes = template === "blank"
      ? ["hero" as const, "cta" as const]
      : TEMPLATES.find((t) => t.key === template)!.blocks
    const landing = createLanding(name, description, blockTypes)
    router.push(`/admin/landing-builder/${landing.id}`)
  }

  const handleDelete = (id: string) => {
    deleteLanding(id)
    refresh()
    setMenuOpen(null)
  }

  const handleDuplicate = (id: string) => {
    duplicateLanding(id)
    refresh()
    setMenuOpen(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Magic Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crea y gestiona tus landing pages con drag & drop</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/25"
        >
          <Plus className="h-4 w-4" />
          Crear Landing
        </button>
      </div>

      {/* Landing list */}
      {landings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-card/30 py-20">
          <div className="rounded-2xl bg-primary/10 p-5">
            <Layers className="h-12 w-12 text-primary/60" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground">Sin landing pages</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            Crea tu primera landing page. Elige una plantilla o empieza desde cero.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Crear mi primera landing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {landings.map((landing) => (
            <LandingCard
              key={landing.id}
              landing={landing}
              isMenuOpen={menuOpen === landing.id}
              onToggleMenu={() => setMenuOpen(menuOpen === landing.id ? null : landing.id)}
              onEdit={() => router.push(`/admin/landing-builder/${landing.id}`)}
              onPreview={() => window.open(`/admin/landing-builder/preview/${landing.id}`, "_blank")}
              onDuplicate={() => handleDuplicate(landing.id)}
              onDelete={() => handleDelete(landing.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}

// --- Landing Card ---
function LandingCard({
  landing,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
}: {
  landing: LandingConfig
  isMenuOpen: boolean
  onToggleMenu: () => void
  onEdit: () => void
  onPreview: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const blockCount = landing.blocks.length
  const dateStr = new Date(landing.updatedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <div className="group relative rounded-xl border border-border/40 bg-card/50 p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Mini preview bar */}
      <div className="mb-4 flex h-24 items-center justify-center overflow-hidden rounded-lg"
        style={{ background: `linear-gradient(135deg, ${landing.theme.backgroundColor}, ${landing.theme.primaryColor}33)` }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="h-2 w-20 rounded-full" style={{ background: landing.theme.primaryColor }} />
          <div className="h-1.5 w-14 rounded-full opacity-40" style={{ background: landing.theme.textColor }} />
          <div className="h-1.5 w-10 rounded-full opacity-20" style={{ background: landing.theme.textColor }} />
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{landing.name}</h3>
          {landing.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{landing.description}</p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={onToggleMenu}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-30 w-40 rounded-lg border border-border/50 bg-popover p-1 shadow-xl">
              <MenuButton icon={Pencil} label="Editar" onClick={onEdit} />
              <MenuButton icon={Eye} label="Previsualizar" onClick={onPreview} />
              <MenuButton icon={Copy} label="Duplicar" onClick={onDuplicate} />
              <div className="my-1 h-px bg-border/30" />
              <MenuButton icon={Trash2} label="Eliminar" onClick={onDelete} destructive />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className={`rounded-full px-2 py-0.5 font-medium ${landing.status === "published" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
          {landing.status === "published" ? "Publicado" : "Borrador"}
        </span>
        <span>{blockCount} bloques</span>
        <span>{dateStr}</span>
      </div>

      {/* Click to edit overlay */}
      <button
        onClick={onEdit}
        className="absolute inset-0 z-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={`Editar ${landing.name}`}
      >
        <span className="sr-only">Editar</span>
      </button>
      {/* Menu needs to be above the overlay */}
      <div className="absolute right-5 top-[7.5rem] z-20">
        {/* Spacer for menu positioning - handled by relative parent */}
      </div>
    </div>
  )
}

function MenuButton({ icon: Icon, label, onClick, destructive = false }: { icon: React.ElementType; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

// --- Create Modal ---
function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, description: string, template: TemplateKey | "blank") => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | "blank">("venta")

  const handleSubmit = () => {
    if (!name.trim()) return
    onCreate(name.trim(), description.trim(), selectedTemplate)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Crear nueva landing</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi landing increible"
              className="rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Descripcion (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Landing para mi nuevo producto..."
              className="rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Plantilla</label>
            <div className="grid grid-cols-2 gap-2">
              {/* Blank option */}
              <button
                onClick={() => setSelectedTemplate("blank")}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  selectedTemplate === "blank"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/40 hover:border-primary/30"
                }`}
              >
                <div className="rounded-md bg-muted/50 p-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">En blanco</p>
                  <p className="text-[10px] text-muted-foreground">Solo Hero + CTA</p>
                </div>
              </button>
              {/* Templates */}
              {TEMPLATES.map((t) => {
                const Icon = TEMPLATE_ICONS[t.icon] ?? LayoutTemplate
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedTemplate === t.key
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border/40 hover:border-primary/30"
                    }`}
                  >
                    <div className="rounded-md bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            Crear landing
          </button>
        </div>
      </div>
    </div>
  )
}
