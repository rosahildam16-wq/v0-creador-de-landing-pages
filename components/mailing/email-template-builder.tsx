"use client"

import { useState, useCallback, useMemo } from "react"
import {
    Eye, Code2, Palette, Type, Image, Link2, ArrowLeft,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Heading1, Heading2, List, ListOrdered, Minus, Sparkles,
    Copy, Check, Smartphone, Monitor, Undo2, Redo2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// ─── Template Types ───
export interface EmailTemplate {
    id: string
    name: string
    category: "bienvenida" | "seguimiento" | "promocion" | "notificacion" | "personalizado"
    subject: string
    preheader: string
    body: EmailBlock[]
    styles: EmailStyles
    created_at: string
    updated_at: string
}

export interface EmailBlock {
    id: string
    type: "header" | "text" | "image" | "button" | "divider" | "spacer" | "columns" | "social"
    content: Record<string, string>
    styles?: Record<string, string>
}

export interface EmailStyles {
    backgroundColor: string
    contentBg: string
    primaryColor: string
    textColor: string
    headingColor: string
    fontFamily: string
    borderRadius: string
    width: string
}

// ─── Default Styles ───
const DEFAULT_STYLES: EmailStyles = {
    backgroundColor: "#050012",
    contentBg: "rgba(255,255,255,0.03)",
    primaryColor: "#8b5cf6",
    textColor: "#a1a1aa",
    headingColor: "#ffffff",
    fontFamily: "Inter, -apple-system, sans-serif",
    borderRadius: "16px",
    width: "600px",
}

// ─── Predefined Templates ───
export const PREDEFINED_TEMPLATES: Omit<EmailTemplate, "id" | "created_at" | "updated_at">[] = [
    {
        name: "Bienvenida VIP",
        category: "bienvenida",
        subject: "¡Bienvenido al futuro, {nombre}! 🚀",
        preheader: "Tu acceso exclusivo está listo",
        body: [
            { id: "b1", type: "header", content: { text: "BIENVENIDO AL FUTURO,\n{nombre}", alignment: "center" } },
            { id: "b2", type: "text", content: { text: "Has dado el primer paso para revolucionar tu prospección digital. **Magic Funnel** es el motor de crecimiento que transformará tu negocio con embudos de alta conversión e Inteligencia Artificial." } },
            { id: "b3", type: "divider", content: {} },
            { id: "b4", type: "text", content: { text: "🚀 **Embudos de Elite:** Listos para prospectar por ti 24/7.\n🤖 **Poder IA:** Automatiza tus respuestas y cierra más ventas.\n🤝 **Comunidad Global:** Acceso a estrategias probadas." } },
            { id: "b5", type: "button", content: { text: "ACCEDER A MI PANEL", url: "https://magicfunnel.app/login", alignment: "center" } },
            { id: "b6", type: "text", content: { text: "Si tienes alguna pregunta, responde a este correo y te ayudaremos.\n\n— El equipo de Magic Funnel" }, styles: { fontSize: "13px", color: "#71717a" } },
        ],
        styles: { ...DEFAULT_STYLES },
    },
    {
        name: "Seguimiento Funnel",
        category: "seguimiento",
        subject: "Oye {nombre}, te falta un paso 👀",
        preheader: "No dejes ir esta oportunidad",
        body: [
            { id: "b1", type: "header", content: { text: "HOLA {nombre},", alignment: "left" } },
            { id: "b2", type: "text", content: { text: "Notamos que iniciaste el proceso pero no lo completaste. Sabemos que la vida es movida, así que aquí te dejamos el enlace directo para retomar donde quedaste." } },
            { id: "b3", type: "spacer", content: { height: "20" } },
            { id: "b4", type: "text", content: { text: "**Lo que te espera al final del camino:**\n✅ Acceso a tu embudo personalizado\n✅ Panel de métricas en tiempo real\n✅ Soporte humano + IA" } },
            { id: "b5", type: "button", content: { text: "RETOMAR MI PROCESO", url: "https://magicfunnel.app", alignment: "center" } },
            { id: "b6", type: "divider", content: {} },
            { id: "b7", type: "text", content: { text: "PD: Las plazas de este mes son limitadas. No pierdas la tuya." }, styles: { color: "#ef4444", fontWeight: "bold" } },
        ],
        styles: { ...DEFAULT_STYLES, primaryColor: "#f59e0b" },
    },
    {
        name: "Promoción Flash",
        category: "promocion",
        subject: "⚡ Solo hoy: {nombre}, oferta exclusiva",
        preheader: "Descuento especial para miembros",
        body: [
            { id: "b1", type: "header", content: { text: "OFERTA\nEXCLUSIVA", alignment: "center" } },
            { id: "b2", type: "text", content: { text: "Hola {nombre},\n\nPor ser parte de nuestra comunidad, tienes acceso a esta oferta especial que **expira en 24 horas**." }, styles: { textAlign: "center" } },
            { id: "b3", type: "spacer", content: { height: "16" } },
            { id: "b4", type: "text", content: { text: "🔥 **50% DE DESCUENTO**\nen tu próximo plan Pro" }, styles: { textAlign: "center", fontSize: "24px", fontWeight: "bold" } },
            { id: "b5", type: "spacer", content: { height: "16" } },
            { id: "b6", type: "button", content: { text: "ACTIVAR MI DESCUENTO", url: "https://magicfunnel.app/pricing", alignment: "center" } },
            { id: "b7", type: "text", content: { text: "Esta oferta es válida únicamente para las próximas 24 horas desde la recepción de este email." }, styles: { fontSize: "11px", color: "#52525b", textAlign: "center" } },
        ],
        styles: { ...DEFAULT_STYLES, primaryColor: "#ef4444" },
    },
    {
        name: "Notificación de Lead",
        category: "notificacion",
        subject: "🎯 Nuevo lead capturado: {nombre}",
        preheader: "Un nuevo prospecto acaba de registrarse",
        body: [
            { id: "b1", type: "header", content: { text: "NUEVO LEAD\nCAPTURADO", alignment: "center" } },
            { id: "b2", type: "text", content: { text: "Se ha registrado un nuevo prospecto en tu embudo:\n\n**Nombre:** {nombre}\n**Email:** {email}\n\nRevisa tu panel para más detalles y toma acción rápida." } },
            { id: "b3", type: "button", content: { text: "VER EN MI PANEL", url: "https://magicfunnel.app/admin/leads", alignment: "center" } },
        ],
        styles: { ...DEFAULT_STYLES, primaryColor: "#10b981" },
    },
    {
        name: "Template en Blanco",
        category: "personalizado",
        subject: "",
        preheader: "",
        body: [
            { id: "b1", type: "header", content: { text: "TU TÍTULO AQUÍ", alignment: "center" } },
            { id: "b2", type: "text", content: { text: "Escribe tu mensaje aquí..." } },
            { id: "b3", type: "button", content: { text: "LLAMADO A LA ACCIÓN", url: "https://", alignment: "center" } },
        ],
        styles: { ...DEFAULT_STYLES },
    },
]

// ─── Template to HTML compiler ───
export function compileTemplateToHtml(template: Pick<EmailTemplate, "body" | "styles" | "preheader">): string {
    const s = template.styles

    const renderBlock = (block: EmailBlock): string => {
        const blockStyles = block.styles || {}
        switch (block.type) {
            case "header": {
                const align = block.content.alignment || "center"
                const lines = block.content.text.split("\n")
                return `<tr><td style="padding: 32px 40px; text-align: ${align};">
                    <h1 style="font-size: 36px; line-height: 1.1; font-weight: 900; color: ${s.headingColor}; letter-spacing: -1px; margin: 0; font-style: italic;">
                        ${lines.map((l, i) => {
                    // Replace variables
                    let line = l.replace(/{(\w+)}/g, '<span style="color: ' + s.primaryColor + ';">{$1}</span>')
                    return i > 0 ? `<br/>${line}` : line
                }).join("")}
                    </h1>
                </td></tr>`
            }
            case "text": {
                const fontSize = blockStyles.fontSize || "16px"
                const color = blockStyles.color || s.textColor
                const textAlign = blockStyles.textAlign || "left"
                const fontWeight = blockStyles.fontWeight || "normal"
                let text = block.content.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff;">$1</strong>')
                    .replace(/{(\w+)}/g, '<span style="color: ' + s.primaryColor + '; font-weight: bold;">{$1}</span>')
                    .replace(/\n/g, "<br/>")
                return `<tr><td style="padding: 8px 40px; font-size: ${fontSize}; line-height: 26px; color: ${color}; text-align: ${textAlign}; font-weight: ${fontWeight};">
                    ${text}
                </td></tr>`
            }
            case "button": {
                const align = block.content.alignment || "center"
                return `<tr><td style="padding: 24px 40px; text-align: ${align};">
                    <a href="${block.content.url || "#"}" style="display: inline-block; background-color: ${s.primaryColor}; border-radius: ${s.borderRadius}; color: #ffffff; font-size: 16px; font-weight: 900; text-decoration: none; text-align: center; padding: 18px 40px; box-shadow: 0 10px 30px ${s.primaryColor}44; letter-spacing: 1px;">
                        ${block.content.text}
                    </a>
                </td></tr>`
            }
            case "divider":
                return `<tr><td style="padding: 16px 40px;"><hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 0;" /></td></tr>`
            case "spacer":
                return `<tr><td style="height: ${block.content.height || "20"}px;"></td></tr>`
            case "image":
                return `<tr><td style="padding: 16px 40px; text-align: center;">
                    <img src="${block.content.src || ""}" alt="${block.content.alt || ""}" style="max-width: 100%; border-radius: 12px;" />
                </td></tr>`
            default:
                return ""
        }
    }

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    ${template.preheader ? `<span style="display:none;font-size:1px;color:${s.backgroundColor};max-height:0px;overflow:hidden;">${template.preheader}</span>` : ""}
</head>
<body style="margin: 0; padding: 0; background-color: ${s.backgroundColor}; font-family: ${s.fontFamily};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${s.backgroundColor};">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <table role="presentation" width="${s.width}" cellspacing="0" cellpadding="0" border="0" style="max-width: ${s.width}; width: 100%;">
                    <!-- Content Card -->
                    <tr>
                        <td style="background-color: ${s.contentBg}; border-radius: ${s.borderRadius}; border: 1px solid rgba(255,255,255,0.05); overflow: hidden;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                ${template.body.map(renderBlock).join("\n")}
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 0; text-align: center;">
                            <p style="color: #52525b; font-size: 11px; letter-spacing: 1px; line-height: 18px; margin: 0;">
                                <strong>MAGIC FUNNEL</strong><br/>
                                LA TECNOLOGÍA AL SERVICIO DE LA LIBERTAD.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

// ─── Block Editor Component ───
function BlockEditor({
    block,
    onUpdate,
    onDelete,
    onMoveUp,
    onMoveDown,
    primaryColor,
}: {
    block: EmailBlock
    onUpdate: (block: EmailBlock) => void
    onDelete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    primaryColor: string
}) {
    const typeLabels: Record<string, string> = {
        header: "Encabezado",
        text: "Texto",
        button: "Botón",
        divider: "Separador",
        spacer: "Espacio",
        image: "Imagen",
    }

    const typeIcons: Record<string, React.ReactNode> = {
        header: <Heading1 className="w-3.5 h-3.5" />,
        text: <Type className="w-3.5 h-3.5" />,
        button: <Link2 className="w-3.5 h-3.5" />,
        divider: <Minus className="w-3.5 h-3.5" />,
        spacer: <span className="text-[10px]">↕</span>,
        image: <Image className="w-3.5 h-3.5" />,
    }

    return (
        <div className="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 hover:border-zinc-700/80 transition-all duration-200">
            {/* Block header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-zinc-800 text-zinc-400">
                        {typeIcons[block.type]}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">{typeLabels[block.type] || block.type}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={onMoveUp} className="h-6 w-6 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg">
                        <span className="text-[10px]">↑</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onMoveDown} className="h-6 w-6 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg">
                        <span className="text-[10px]">↓</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete} className="h-6 w-6 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                        <span className="text-[10px]">✕</span>
                    </Button>
                </div>
            </div>

            {/* Block content editor */}
            {(block.type === "header" || block.type === "text") && (
                <Textarea
                    value={block.content.text || ""}
                    onChange={(e) => onUpdate({ ...block, content: { ...block.content, text: e.target.value } })}
                    className="bg-zinc-950/50 border-zinc-800 text-sm min-h-[60px] resize-none"
                    placeholder={block.type === "header" ? "Título del email..." : "Contenido del bloque..."}
                />
            )}

            {block.type === "button" && (
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        value={block.content.text || ""}
                        onChange={(e) => onUpdate({ ...block, content: { ...block.content, text: e.target.value } })}
                        className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
                        placeholder="Texto del botón"
                    />
                    <Input
                        value={block.content.url || ""}
                        onChange={(e) => onUpdate({ ...block, content: { ...block.content, url: e.target.value } })}
                        className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
                        placeholder="URL destino"
                    />
                </div>
            )}

            {block.type === "image" && (
                <div className="grid gap-3">
                    <Input
                        value={block.content.src || ""}
                        onChange={(e) => onUpdate({ ...block, content: { ...block.content, src: e.target.value } })}
                        className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
                        placeholder="URL de la imagen"
                    />
                    <Input
                        value={block.content.alt || ""}
                        onChange={(e) => onUpdate({ ...block, content: { ...block.content, alt: e.target.value } })}
                        className="bg-zinc-950/50 border-zinc-800 text-xs h-9"
                        placeholder="Texto alternativo"
                    />
                </div>
            )}

            {block.type === "spacer" && (
                <Input
                    type="number"
                    value={block.content.height || "20"}
                    onChange={(e) => onUpdate({ ...block, content: { ...block.content, height: e.target.value } })}
                    className="bg-zinc-950/50 border-zinc-800 text-xs h-9 w-28"
                    placeholder="Altura en px"
                    min="4"
                    max="120"
                />
            )}

            {/* Variable insertion tags */}
            {(block.type === "header" || block.type === "text") && (
                <div className="flex gap-1.5 mt-2">
                    {["{nombre}", "{email}"].map(tag => (
                        <button
                            key={tag}
                            onClick={() => onUpdate({ ...block, content: { ...block.content, text: (block.content.text || "") + ` ${tag}` } })}
                            className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border transition-all"
                            style={{
                                borderColor: `${primaryColor}33`,
                                backgroundColor: `${primaryColor}11`,
                                color: primaryColor,
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main Email Template Builder ───
interface EmailTemplateBuilderProps {
    onComplete: (html: string, subject: string) => void
    onCancel: () => void
    initialHtml?: string
    initialSubject?: string
}

export function EmailTemplateBuilder({ onComplete, onCancel, initialSubject }: EmailTemplateBuilderProps) {
    const [step, setStep] = useState<"templates" | "editor">("templates")
    const [viewMode, setViewMode] = useState<"editor" | "preview" | "code">("editor")
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
    const [subject, setSubject] = useState(initialSubject || "")
    const [preheader, setPreheader] = useState("")
    const [blocks, setBlocks] = useState<EmailBlock[]>([])
    const [styles, setStyles] = useState<EmailStyles>({ ...DEFAULT_STYLES })
    const [copied, setCopied] = useState(false)

    // Compiled HTML
    const compiledHtml = useMemo(() => {
        return compileTemplateToHtml({ body: blocks, styles, preheader })
    }, [blocks, styles, preheader])

    // Personalized preview (replace variables with sample data)
    const previewHtml = useMemo(() => {
        return compiledHtml
            .replace(/{nombre}/g, "Carlos")
            .replace(/{email}/g, "carlos@ejemplo.com")
    }, [compiledHtml])

    const selectTemplate = (template: typeof PREDEFINED_TEMPLATES[0]) => {
        setSubject(template.subject)
        setPreheader(template.preheader)
        setBlocks([...template.body])
        setStyles({ ...template.styles })
        setStep("editor")
    }

    const addBlock = (type: EmailBlock["type"]) => {
        const defaults: Record<string, Record<string, string>> = {
            header: { text: "NUEVO TÍTULO", alignment: "center" },
            text: { text: "Escribe aquí tu contenido..." },
            button: { text: "LLAMADO A LA ACCIÓN", url: "https://", alignment: "center" },
            divider: {},
            spacer: { height: "20" },
            image: { src: "", alt: "Imagen" },
        }
        setBlocks(prev => [...prev, { id: `block-${Date.now()}`, type, content: defaults[type] || {} }])
    }

    const updateBlock = useCallback((index: number, updated: EmailBlock) => {
        setBlocks(prev => prev.map((b, i) => i === index ? updated : b))
    }, [])

    const deleteBlock = useCallback((index: number) => {
        setBlocks(prev => prev.filter((_, i) => i !== index))
    }, [])

    const moveBlock = useCallback((index: number, direction: "up" | "down") => {
        setBlocks(prev => {
            const arr = [...prev]
            const target = direction === "up" ? index - 1 : index + 1
            if (target < 0 || target >= arr.length) return arr
                ;[arr[index], arr[target]] = [arr[target], arr[index]]
            return arr
        })
    }, [])

    const handleCopyHtml = () => {
        navigator.clipboard.writeText(compiledHtml)
        setCopied(true)
        toast.success("HTML copiado al portapapeles")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleFinish = () => {
        onComplete(compiledHtml, subject)
    }

    // ─── Template Selection Screen ───
    if (step === "templates") {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white italic">ELIGE UNA PLANTILLA</h3>
                        <p className="text-sm text-zinc-500 mt-1">Selecciona una base y personalízala a tu gusto</p>
                    </div>
                    <Button variant="outline" onClick={onCancel} className="border-zinc-700 hover:bg-zinc-800 text-xs">
                        Cancelar
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PREDEFINED_TEMPLATES.map((tpl, i) => {
                        const categoryColors: Record<string, string> = {
                            bienvenida: "#8b5cf6",
                            seguimiento: "#f59e0b",
                            promocion: "#ef4444",
                            notificacion: "#10b981",
                            personalizado: "#6b7280",
                        }
                        const color = categoryColors[tpl.category] || "#8b5cf6"
                        return (
                            <button
                                key={i}
                                onClick={() => selectTemplate(tpl)}
                                className="group relative flex flex-col items-start p-5 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-600 transition-all duration-300 text-left h-full"
                            >
                                {/* Color accent */}
                                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />

                                <Badge className="mb-3 text-[9px] font-black uppercase tracking-widest border-0" style={{ backgroundColor: `${color}15`, color }}>
                                    {tpl.category}
                                </Badge>

                                <h4 className="text-sm font-bold text-white mb-2 group-hover:text-white transition-colors">{tpl.name}</h4>
                                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mb-3">{tpl.subject || "Sin asunto predefinido"}</p>

                                {/* Mini preview blocks */}
                                <div className="w-full mt-auto space-y-1.5 opacity-30 group-hover:opacity-50 transition-opacity">
                                    {tpl.body.slice(0, 3).map((block) => (
                                        <div key={block.id} className="rounded" style={{
                                            height: block.type === "header" ? "12px" : block.type === "button" ? "8px" : block.type === "divider" ? "1px" : "6px",
                                            width: block.type === "button" ? "60%" : block.type === "divider" ? "100%" : `${60 + Math.random() * 40}%`,
                                            backgroundColor: block.type === "button" ? color : block.type === "divider" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.15)",
                                            margin: block.type === "button" ? "0 auto" : undefined,
                                            borderRadius: "3px",
                                        }} />
                                    ))}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ─── Editor Screen ───
    return (
        <div className="space-y-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setStep("templates")} className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-black text-white italic">DISEÑAR EMAIL</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onCancel} className="h-9 border-zinc-700 hover:bg-zinc-800 text-xs font-bold uppercase tracking-widest">
                        Cancelar
                    </Button>
                    <Button onClick={handleFinish} className="h-9 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Usar este diseño
                    </Button>
                </div>
            </div>

            {/* Subject + Preheader */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
                <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Asunto del correo</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-zinc-950 border-zinc-800 h-10 text-sm" placeholder="Tu asunto aquí..." />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Preheader (texto de preview)</Label>
                    <Input value={preheader} onChange={(e) => setPreheader(e.target.value)} className="bg-zinc-950 border-zinc-800 h-10 text-sm" placeholder="Se muestra en la bandeja..." />
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-px">
                <div className="flex gap-1">
                    {[
                        { id: "editor", label: "Editor", icon: <Type className="w-3.5 h-3.5" /> },
                        { id: "preview", label: "Preview", icon: <Eye className="w-3.5 h-3.5" /> },
                        { id: "code", label: "HTML", icon: <Code2 className="w-3.5 h-3.5" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${viewMode === tab.id
                                ? "text-primary border-primary"
                                : "text-zinc-500 border-transparent hover:text-zinc-300"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {viewMode === "preview" && (
                    <div className="flex gap-1 pr-1">
                        <Button variant={previewDevice === "desktop" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setPreviewDevice("desktop")}>
                            <Monitor className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant={previewDevice === "mobile" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setPreviewDevice("mobile")}>
                            <Smartphone className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}

                {viewMode === "code" && (
                    <Button variant="ghost" size="sm" onClick={handleCopyHtml} className="h-7 text-[10px] gap-1.5">
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copiado" : "Copiar"}
                    </Button>
                )}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                {/* Main editor/preview area */}
                <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/50 overflow-hidden min-h-[400px]">
                    {viewMode === "editor" && (
                        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {blocks.map((block, i) => (
                                <BlockEditor
                                    key={block.id}
                                    block={block}
                                    onUpdate={(updated) => updateBlock(i, updated)}
                                    onDelete={() => deleteBlock(i)}
                                    onMoveUp={() => moveBlock(i, "up")}
                                    onMoveDown={() => moveBlock(i, "down")}
                                    primaryColor={styles.primaryColor}
                                />
                            ))}

                            {blocks.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 opacity-30">
                                    <Type className="h-12 w-12 mb-3" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Agrega bloques para empezar</p>
                                </div>
                            )}

                            {/* Add block buttons */}
                            <div className="flex flex-wrap gap-2 justify-center pt-4 border-t border-zinc-800/30">
                                {(["header", "text", "button", "image", "divider", "spacer"] as EmailBlock["type"][]).map(type => {
                                    const labels: Record<string, string> = { header: "Título", text: "Texto", button: "Botón", image: "Imagen", divider: "Línea", spacer: "Espacio" }
                                    return (
                                        <Button
                                            key={type}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addBlock(type)}
                                            className="h-8 text-[10px] font-bold uppercase tracking-widest border-zinc-800 bg-zinc-900/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary gap-1.5 rounded-lg transition-all"
                                        >
                                            + {labels[type]}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {viewMode === "preview" && (
                        <div className="flex justify-center p-6 bg-zinc-900/20">
                            <div
                                className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
                                style={{ width: previewDevice === "mobile" ? "375px" : "600px" }}
                            >
                                <iframe
                                    srcDoc={previewHtml}
                                    className="w-full border-0"
                                    style={{ height: "600px" }}
                                    title="Email Preview"
                                />
                            </div>
                        </div>
                    )}

                    {viewMode === "code" && (
                        <div className="p-4">
                            <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap break-all max-h-[500px] overflow-y-auto custom-scrollbar leading-relaxed">
                                {compiledHtml}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Sidebar – Style Controls */}
                {viewMode === "editor" && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Estilos Globales
                            </h4>

                            <div className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-bold text-zinc-600 uppercase">Color Primario</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={styles.primaryColor}
                                            onChange={(e) => setStyles(s => ({ ...s, primaryColor: e.target.value }))}
                                            className="h-8 w-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent"
                                        />
                                        <Input
                                            value={styles.primaryColor}
                                            onChange={(e) => setStyles(s => ({ ...s, primaryColor: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-bold text-zinc-600 uppercase">Fondo</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={styles.backgroundColor}
                                            onChange={(e) => setStyles(s => ({ ...s, backgroundColor: e.target.value }))}
                                            className="h-8 w-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent"
                                        />
                                        <Input
                                            value={styles.backgroundColor}
                                            onChange={(e) => setStyles(s => ({ ...s, backgroundColor: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-bold text-zinc-600 uppercase">Color de Encabezados</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={styles.headingColor}
                                            onChange={(e) => setStyles(s => ({ ...s, headingColor: e.target.value }))}
                                            className="h-8 w-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent"
                                        />
                                        <Input
                                            value={styles.headingColor}
                                            onChange={(e) => setStyles(s => ({ ...s, headingColor: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-bold text-zinc-600 uppercase">Color de Texto</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={styles.textColor}
                                            onChange={(e) => setStyles(s => ({ ...s, textColor: e.target.value }))}
                                            className="h-8 w-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent"
                                        />
                                        <Input
                                            value={styles.textColor}
                                            onChange={(e) => setStyles(s => ({ ...s, textColor: e.target.value }))}
                                            className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-bold text-zinc-600 uppercase">Border Radius</Label>
                                    <Select value={styles.borderRadius} onValueChange={(v) => setStyles(s => ({ ...s, borderRadius: v }))}>
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                            <SelectItem value="0px">Sin bordes</SelectItem>
                                            <SelectItem value="8px">Sutil (8px)</SelectItem>
                                            <SelectItem value="16px">Medio (16px)</SelectItem>
                                            <SelectItem value="24px">Grande (24px)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Variables disponibles</h4>
                            <div className="space-y-1.5 text-[10px]">
                                <div className="flex items-center gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{`{nombre}`}</code>
                                    <span className="text-zinc-600">Nombre del lead</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{`{email}`}</code>
                                    <span className="text-zinc-600">Email del lead</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
