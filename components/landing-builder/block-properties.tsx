"use client"

import { useState } from "react"
import type { LandingBlock, LandingTheme, BlockType } from "@/lib/landing-builder-types"
import { BLOCK_CATALOG } from "@/lib/landing-builder-types"
import { Trash2, Plus, X, Palette } from "lucide-react"

interface BlockPropertiesProps {
  block: LandingBlock | null
  theme: LandingTheme
  onUpdateBlock: (id: string, props: Record<string, unknown>) => void
  onUpdateTheme: (theme: LandingTheme) => void
  onDeleteBlock: (id: string) => void
}

export function BlockProperties({ block, theme, onUpdateBlock, onUpdateTheme, onDeleteBlock }: BlockPropertiesProps) {
  const [tab, setTab] = useState<"block" | "theme">(block ? "block" : "theme")

  // Switch to block tab when block is selected
  if (block && tab === "theme") {
    // only auto-switch, don't set state in render
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border/40">
        <button
          onClick={() => setTab("block")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${tab === "block" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Bloque
        </button>
        <button
          onClick={() => setTab("theme")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${tab === "theme" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Palette className="h-3 w-3" /> Tema
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "theme" ? (
          <ThemeEditor theme={theme} onUpdate={onUpdateTheme} />
        ) : block ? (
          <BlockEditor block={block} theme={theme} onUpdate={onUpdateBlock} onDelete={onDeleteBlock} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="rounded-xl bg-muted/30 p-4">
              <Palette className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Selecciona un bloque en el canvas para editarlo</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Theme Editor ---
function ThemeEditor({ theme, onUpdate }: { theme: LandingTheme; onUpdate: (t: LandingTheme) => void }) {
  const colorField = (label: string, key: keyof LandingTheme) => (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={theme[key] as string}
          onChange={(e) => onUpdate({ ...theme, [key]: e.target.value })}
          className="h-7 w-7 cursor-pointer rounded border border-border/50 bg-transparent"
        />
        <input
          type="text"
          value={theme[key] as string}
          onChange={(e) => onUpdate({ ...theme, [key]: e.target.value })}
          className="w-20 rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-[10px] font-mono text-foreground"
        />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colores</h4>
        <div className="flex flex-col gap-3">
          {colorField("Primario", "primaryColor")}
          {colorField("Fondo", "backgroundColor")}
          {colorField("Texto", "textColor")}
          {colorField("Acento", "accentColor")}
        </div>
      </div>
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipografia</h4>
        <select
          value={theme.fontFamily}
          onChange={(e) => onUpdate({ ...theme, fontFamily: e.target.value as LandingTheme["fontFamily"] })}
          className="w-full rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground"
        >
          <option value="sans">Sans-serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
        </select>
      </div>
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bordes</h4>
        <select
          value={theme.borderRadius}
          onChange={(e) => onUpdate({ ...theme, borderRadius: e.target.value as LandingTheme["borderRadius"] })}
          className="w-full rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground"
        >
          <option value="none">Sin bordes</option>
          <option value="sm">Sutil</option>
          <option value="md">Medio</option>
          <option value="lg">Redondeado</option>
          <option value="full">Muy redondeado</option>
        </select>
      </div>
    </div>
  )
}

// --- Block Editor ---
function BlockEditor({
  block,
  theme,
  onUpdate,
  onDelete,
}: {
  block: LandingBlock
  theme: LandingTheme
  onUpdate: (id: string, props: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  const meta = BLOCK_CATALOG.find((b) => b.type === block.type)
  const p = block.props

  const updateProp = (key: string, value: unknown) => {
    onUpdate(block.id, { ...p, [key]: value })
  }

  const textInput = (label: string, key: string, multiline = false) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {multiline ? (
        <textarea
          value={(p[key] as string) ?? ""}
          onChange={(e) => updateProp(key, e.target.value)}
          rows={3}
          className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
        />
      ) : (
        <input
          type="text"
          value={(p[key] as string) ?? ""}
          onChange={(e) => updateProp(key, e.target.value)}
          className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
        />
      )}
    </div>
  )

  const selectInput = (label: string, key: string, options: Array<{ value: string; label: string }>) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <select
        value={(p[key] as string) ?? options[0]?.value}
        onChange={(e) => updateProp(key, e.target.value)}
        className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )

  const colorInput = (label: string, key: string) => (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <input
        type="color"
        value={(p[key] as string) ?? theme.primaryColor}
        onChange={(e) => updateProp(key, e.target.value)}
        className="h-7 w-7 cursor-pointer rounded border border-border/50 bg-transparent"
      />
    </div>
  )

  // Render fields per block type
  function renderFields() {
    switch (block.type) {
      case "hero":
        return (
          <>
            {textInput("Titulo", "title")}
            {textInput("Subtitulo", "subtitle", true)}
            {textInput("Texto del boton", "ctaText")}
            {textInput("Link del boton", "ctaLink")}
            {textInput("Badge", "badgeText")}
            {selectInput("Fondo", "backgroundStyle", [
              { value: "gradient", label: "Gradiente" },
              { value: "solid", label: "Solido" },
              { value: "image", label: "Imagen" },
            ])}
            {selectInput("Alineacion", "alignment", [
              { value: "center", label: "Centro" },
              { value: "left", label: "Izquierda" },
            ])}
          </>
        )
      case "problem":
        return (
          <>
            {textInput("Titulo de seccion", "sectionTitle")}
            {colorInput("Color acento", "accentColor")}
            <ListEditor
              label="Pain Points"
              items={(p.painPoints as Array<{ icon: string; text: string }>) ?? []}
              onUpdate={(items) => updateProp("painPoints", items)}
              renderItem={(item, onChange) => (
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => onChange({ ...item, text: e.target.value })}
                  className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none"
                />
              )}
              createItem={() => ({ icon: "AlertTriangle", text: "Nuevo problema" })}
            />
          </>
        )
      case "benefits":
        return (
          <>
            {textInput("Titulo de seccion", "sectionTitle")}
            {selectInput("Layout", "layout", [
              { value: "grid", label: "Cuadricula" },
              { value: "list", label: "Lista" },
            ])}
            <ListEditor
              label="Beneficios"
              items={(p.benefits as Array<{ icon: string; title: string; description: string }>) ?? []}
              onUpdate={(items) => updateProp("benefits", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => onChange({ ...item, title: e.target.value })}
                    placeholder="Titulo"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => onChange({ ...item, description: e.target.value })}
                    placeholder="Descripcion"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none"
                  />
                </div>
              )}
              createItem={() => ({ icon: "Star", title: "Nuevo beneficio", description: "Descripcion del beneficio" })}
            />
          </>
        )
      case "testimonials":
        return (
          <>
            {textInput("Titulo de seccion", "sectionTitle")}
            <ListEditor
              label="Testimonios"
              items={(p.testimonials as Array<{ name: string; text: string; label: string }>) ?? []}
              onUpdate={(items) => updateProp("testimonials", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <input type="text" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="Nombre"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
                  <textarea value={item.text} onChange={(e) => onChange({ ...item, text: e.target.value })} placeholder="Testimonio" rows={2}
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                  <input type="text" value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value })} placeholder="Etiqueta"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                </div>
              )}
              createItem={() => ({ name: "Nombre", text: "Testimonio increible...", label: "Cliente" })}
            />
          </>
        )
      case "cta":
        return (
          <>
            {textInput("Titulo", "title")}
            {textInput("Descripcion", "description", true)}
            {textInput("Precio original", "originalPrice")}
            {textInput("Precio oferta", "offerPrice")}
            {textInput("Texto del boton", "buttonText")}
            {textInput("Link del boton", "buttonLink")}
            {textInput("Texto de urgencia", "urgencyText")}
            <ListEditor
              label="Caracteristicas"
              items={((p.features as string[]) ?? []).map((f) => ({ text: f }))}
              onUpdate={(items) => updateProp("features", items.map((i) => i.text))}
              renderItem={(item, onChange) => (
                <input type="text" value={item.text} onChange={(e) => onChange({ ...item, text: e.target.value })}
                  className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
              )}
              createItem={() => ({ text: "Nueva caracteristica" })}
            />
          </>
        )
      case "faq":
        return (
          <>
            {textInput("Titulo de seccion", "sectionTitle")}
            {selectInput("Estilo", "style", [
              { value: "accordion", label: "Acordeon" },
              { value: "list", label: "Lista" },
            ])}
            <ListEditor
              label="Preguntas"
              items={(p.questions as Array<{ question: string; answer: string }>) ?? []}
              onUpdate={(items) => updateProp("questions", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <input type="text" value={item.question} onChange={(e) => onChange({ ...item, question: e.target.value })} placeholder="Pregunta"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
                  <textarea value={item.answer} onChange={(e) => onChange({ ...item, answer: e.target.value })} placeholder="Respuesta" rows={2}
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                </div>
              )}
              createItem={() => ({ question: "Nueva pregunta?", answer: "Respuesta aqui..." })}
            />
          </>
        )
      case "countdown":
        return (
          <>
            {textInput("Titulo", "title")}
            {textInput("Subtitulo", "subtitle")}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-foreground">Fecha objetivo</label>
              <input
                type="datetime-local"
                value={(p.targetDate as string)?.slice(0, 16) ?? ""}
                onChange={(e) => updateProp("targetDate", new Date(e.target.value).toISOString())}
                className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground"
              />
            </div>
            {selectInput("Estilo", "style", [
              { value: "cards", label: "Tarjetas" },
              { value: "inline", label: "En linea" },
            ])}
          </>
        )
      case "form":
        return (
          <>
            {textInput("Titulo", "title")}
            {textInput("Subtitulo", "subtitle")}
            {textInput("Texto del boton", "buttonText")}
            {textInput("Mensaje de exito", "successMessage")}
            <ListEditor
              label="Campos"
              items={(p.fields as Array<{ name: string; type: string; label: string; required: boolean }>) ?? []}
              onUpdate={(items) => updateProp("fields", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <input type="text" value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="Label"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
                  <div className="flex gap-2">
                    <select value={item.type} onChange={(e) => onChange({ ...item, type: e.target.value })}
                      className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-[10px] text-foreground">
                      <option value="text">Texto</option>
                      <option value="email">Email</option>
                      <option value="tel">Telefono</option>
                    </select>
                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <input type="checkbox" checked={item.required} onChange={(e) => onChange({ ...item, required: e.target.checked })} />
                      Req.
                    </label>
                  </div>
                </div>
              )}
              createItem={() => ({ name: "campo", type: "text", label: "Nuevo campo", required: false })}
            />
          </>
        )
      case "video":
        return (
          <>
            {textInput("URL del video", "url")}
            {textInput("Titulo", "title")}
            {textInput("Descripcion", "description", true)}
            {selectInput("Layout", "layout", [
              { value: "contained", label: "Contenido" },
              { value: "full", label: "Ancho completo" },
            ])}
          </>
        )
      case "gallery":
        return (
          <>
            {textInput("Titulo de seccion", "sectionTitle")}
            {selectInput("Columnas", "columns", [
              { value: "2", label: "2 columnas" },
              { value: "3", label: "3 columnas" },
              { value: "4", label: "4 columnas" },
            ])}
            <ListEditor
              label="Imagenes"
              items={(p.images as Array<{ url: string; alt: string }>) ?? []}
              onUpdate={(items) => updateProp("images", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <input type="text" value={item.url} onChange={(e) => onChange({ ...item, url: e.target.value })} placeholder="URL de imagen"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
                  <input type="text" value={item.alt} onChange={(e) => onChange({ ...item, alt: e.target.value })} placeholder="Texto alternativo"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                </div>
              )}
              createItem={() => ({ url: "https://placehold.co/600x400", alt: "Imagen" })}
            />
          </>
        )
      default:
        return <p className="text-sm text-muted-foreground">Sin opciones para este bloque.</p>
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{meta?.label ?? block.type}</h4>
          <p className="text-[10px] text-muted-foreground">{meta?.description}</p>
        </div>
        <button
          onClick={() => onDelete(block.id)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Eliminar bloque"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="h-px bg-border/30" />
      {renderFields()}
    </div>
  )
}

// --- Generic List Editor ---
function ListEditor<T extends Record<string, unknown>>({
  label,
  items,
  onUpdate,
  renderItem,
  createItem,
}: {
  label: string
  items: T[]
  onUpdate: (items: T[]) => void
  renderItem: (item: T, onChange: (updated: T) => void, index: number) => React.ReactNode
  createItem: () => T
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <button
          onClick={() => onUpdate([...items, createItem()])}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Plus className="h-3 w-3" /> Agregar
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/20 p-2">
            {renderItem(
              item,
              (updated) => {
                const next = [...items]
                next[i] = updated
                onUpdate(next)
              },
              i
            )}
            <button
              onClick={() => onUpdate(items.filter((_, idx) => idx !== i))}
              className="mt-1 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
