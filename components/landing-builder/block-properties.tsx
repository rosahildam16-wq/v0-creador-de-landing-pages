"use client"

import { useState } from "react"
import type { LandingBlock, LandingTheme, BlockType, LandingConfig } from "@/lib/landing-builder-types"
import { BLOCK_CATALOG } from "@/lib/landing-builder-types"
import { Trash2, Plus, X, Palette, Globe, Link as LinkIcon } from "lucide-react"

interface BlockPropertiesProps {
  block: LandingBlock | null
  config: LandingConfig
  theme: LandingTheme
  onUpdateBlock: (id: string, props: Record<string, unknown>) => void
  onUpdateTheme: (theme: LandingTheme) => void
  onUpdateConfig: (config: LandingConfig) => void
  onDeleteBlock: (id: string) => void
}

export function BlockProperties({ block, config, theme, onUpdateBlock, onUpdateTheme, onUpdateConfig, onDeleteBlock }: BlockPropertiesProps) {
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
        <button
          onClick={() => setTab("config" as any)}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${tab === ("config" as any) ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Ajustes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === ("config" as any) ? (
          <ConfigEditor config={config} onUpdate={onUpdateConfig!} />
        ) : tab === "theme" ? (
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

// --- Config Editor ---
function ConfigEditor({ config, onUpdate }: { config: LandingConfig; onUpdate: (c: LandingConfig) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identidad Viral</h4>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <LinkIcon className="h-3 w-3" /> Subdominio Magic
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="mi-oferta"
                value={config.slug || ""}
                onChange={(e) => onUpdate({ ...config, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="flex-1 rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              />
              <span className="text-[10px] font-medium opacity-40">.magicfunnel.io</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Globe className="h-3 w-3" /> Dominio Personalizado
            </label>
            <input
              type="text"
              placeholder="www.mipagina.com"
              value={config.customDomain || ""}
              onChange={(e) => onUpdate({ ...config, customDomain: e.target.value.toLowerCase().trim() })}
              className="w-full rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
            />
            <p className="text-[9px] text-muted-foreground opacity-60">
              Apunta tu CNAME a <span className="text-foreground font-mono">cname.magicfunnel.io</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Conecta tu dominio para transmitir <strong>maxima autoridad</strong>. Tus leads confiaran mas si ven tu propia marca en la URL.
        </p>
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
      case "community":
        return (
          <>
            {textInput("Titulo de seccion", "sectionTitle")}
            {textInput("Descripcion", "description", true)}
            {textInput("Nombre de comunidad", "communityName")}
            {textInput("Cantidad de miembros", "memberCount")}
            {selectInput("Layout", "layout", [
              { value: "split", label: "Feed + Leaderboard" },
              { value: "feed", label: "Solo feed" },
            ])}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={(p.showLeaderboard as boolean) ?? true}
                  onChange={(e) => updateProp("showLeaderboard", e.target.checked)}
                  className="rounded"
                />
                Mostrar leaderboard
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={(p.showCategories as boolean) ?? true}
                  onChange={(e) => updateProp("showCategories", e.target.checked)}
                  className="rounded"
                />
                Mostrar categorias
              </label>
            </div>
            <ListEditor
              label="Categorias"
              items={(p.categories as Array<{ name: string; emoji: string }>) ?? []}
              onUpdate={(items) => updateProp("categories", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 items-center gap-2">
                  <input type="text" value={item.emoji} onChange={(e) => onChange({ ...item, emoji: e.target.value })} placeholder="Emoji"
                    className="w-10 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-center text-xs text-foreground outline-none" />
                  <input type="text" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="Nombre"
                    className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
                </div>
              )}
              createItem={() => ({ name: "Nueva categoria", emoji: "📌" })}
            />
            <ListEditor
              label="Publicaciones"
              items={(p.posts as Array<{ author: string; content: string; timeAgo: string; likes: number; comments: number; category: string; badge?: string }>) ?? []}
              onUpdate={(items) => updateProp("posts", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex gap-2">
                    <input type="text" value={item.author} onChange={(e) => onChange({ ...item, author: e.target.value })} placeholder="Autor"
                      className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
                    <input type="text" value={item.badge ?? ""} onChange={(e) => onChange({ ...item, badge: e.target.value || undefined })} placeholder="Badge"
                      className="w-24 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                  </div>
                  <textarea value={item.content} onChange={(e) => onChange({ ...item, content: e.target.value })} placeholder="Contenido" rows={2}
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                  <div className="flex gap-2">
                    <input type="text" value={item.category} onChange={(e) => onChange({ ...item, category: e.target.value })} placeholder="Categoria"
                      className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                    <input type="number" value={item.likes} onChange={(e) => onChange({ ...item, likes: Number(e.target.value) })} placeholder="Likes"
                      className="w-16 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                    <input type="number" value={item.comments} onChange={(e) => onChange({ ...item, comments: Number(e.target.value) })} placeholder="Comments"
                      className="w-16 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                  </div>
                </div>
              )}
              createItem={() => ({ author: "Nuevo miembro", content: "Contenido del post...", timeAgo: "hace 1 hora", likes: 0, comments: 0, category: "General", badge: "" })}
            />
            <ListEditor
              label="Leaderboard"
              items={(p.leaderboard as Array<{ name: string; points: number; level: number; badge: string }>) ?? []}
              onUpdate={(items) => updateProp("leaderboard", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <input type="text" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} placeholder="Nombre"
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none" />
                  <div className="flex gap-2">
                    <input type="number" value={item.points} onChange={(e) => onChange({ ...item, points: Number(e.target.value) })} placeholder="Puntos"
                      className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                    <input type="number" value={item.level} onChange={(e) => onChange({ ...item, level: Number(e.target.value) })} placeholder="Nivel"
                      className="w-14 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-[10px] text-foreground outline-none" />
                    <select value={item.badge} onChange={(e) => onChange({ ...item, badge: e.target.value })}
                      className="w-20 rounded-md border border-border/40 bg-muted/30 px-1 py-1 text-[10px] text-foreground">
                      <option value="Diamante">Diamante</option>
                      <option value="Oro">Oro</option>
                      <option value="Plata">Plata</option>
                      <option value="Bronce">Bronce</option>
                    </select>
                  </div>
                </div>
              )}
              createItem={() => ({ name: "Nuevo miembro", points: 100, level: 1, badge: "Bronce" })}
            />
          </>
        )
      case "whatsapp_final":
        return (
          <>
            {textInput("Titulo del Chat", "title")}
            <ListEditor
              label="Mensajes"
              items={(p.messages as Array<{ id: string; text: string; sender: "agent" | "user"; timestamp: string }>) ?? []}
              onUpdate={(items) => updateProp("messages", items)}
              renderItem={(item, onChange) => (
                <div className="flex flex-1 flex-col gap-1">
                  <textarea
                    value={item.text}
                    onChange={(e) => onChange({ ...item, text: e.target.value })}
                    placeholder="Mensaje"
                    rows={2}
                    className="rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 text-xs text-foreground outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={item.sender}
                      onChange={(e) => onChange({ ...item, sender: e.target.value as "agent" | "user" })}
                      className="flex-1 rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-[10px] text-foreground"
                    >
                      <option value="agent">Agente</option>
                      <option value="user">Usuario (Yo)</option>
                    </select>
                    <input
                      type="text"
                      value={item.timestamp}
                      onChange={(e) => onChange({ ...item, timestamp: e.target.value })}
                      placeholder="Hora"
                      className="w-20 rounded-md border border-border/40 bg-muted/30 px-2 py-1 text-[10px] text-foreground outline-none"
                    />
                  </div>
                </div>
              )}
              createItem={() => ({
                id: Math.random().toString(36).substr(2, 9),
                text: "Nuevo mensaje...",
                sender: "agent",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              })}
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
