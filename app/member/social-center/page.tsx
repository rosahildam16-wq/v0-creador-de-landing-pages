"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { FeatureGate } from "@/components/feature-gate"
import {
    Globe,
    Copy,
    Eye,
    Sparkles,
    Palette,
    Share2,
    Plus,
    Trash2,
    Save,
    Image as ImageIcon,
    Type,
    Link,
    Instagram,
    Youtube,
    MessageCircle,
    ChevronUp,
    ChevronDown,
    Facebook,
    Linkedin,
    Twitter,
    Phone,
    ExternalLink,
    Rocket,
    FileText,
    ShoppingBag,
    Check,
} from "lucide-react"
import { toast } from "sonner"

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
)

const ICON_OPTIONS = [
    { id: "rocket", label: "Cohete", Icon: Rocket },
    { id: "external", label: "Enlace", Icon: ExternalLink },
    { id: "globe", label: "Web", Icon: Globe },
    { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
    { id: "instagram", label: "Instagram", Icon: Instagram },
    { id: "youtube", label: "YouTube", Icon: Youtube },
    { id: "phone", label: "Teléfono", Icon: Phone },
    { id: "form", label: "Formulario", Icon: FileText },
    { id: "shop", label: "Tienda", Icon: ShoppingBag },
]

const TEMPLATES = [
    { id: "glass_mesh", name: "Mesh", bg: "#05010d", orb: "rgba(139,92,246,0.35)" },
    { id: "dark_minimal", name: "Minimal", bg: "#0a0a0a", orb: "rgba(139,92,246,0.12)" },
    { id: "neon_glow", name: "Neon", bg: "#030309", orb: "rgba(139,92,246,0.55)" },
    { id: "aurora", name: "Aurora", bg: "#020d08", orb: "rgba(16,185,129,0.35)" },
    { id: "gradient_bold", name: "Bold", bg: "#0f0518", orb: "rgba(236,72,153,0.40)" },
]

const QUICK_LINKS = [
    { label: "WhatsApp", url: "https://wa.me/", icon: "whatsapp", highlight: true },
    { label: "Agenda una Cita", url: "https://", icon: "rocket", highlight: true },
    { label: "Mi Funnel", url: "https://", icon: "globe", highlight: false },
    { label: "Mi Formulario", url: "https://", icon: "form", highlight: false },
    { label: "Mi Tienda", url: "https://", icon: "shop", highlight: false },
]

interface SocialLink {
    label: string
    url: string
    icon: string
    highlight: boolean
}

interface SocialProfile {
    display_name: string
    tagline: string
    bio: string
    avatar_url: string
    links: SocialLink[]
    social_links: {
        instagram?: string
        tiktok?: string
        youtube?: string
        whatsapp?: string
        facebook?: string
        linkedin?: string
        twitter?: string
        telegram?: string
    }
    theme_config: {
        primary_color: string
        bg_style: string
        button_style: "glass" | "solid" | "outline"
        layout: "list" | "grid"
    }
}

const DEFAULT_PROFILE: SocialProfile = {
    display_name: "",
    tagline: "",
    bio: "Bienvenidos a mi ecosistema digital 🚀",
    avatar_url: "",
    links: [
        { label: "Mi Página Principal", url: "https://", icon: "rocket", highlight: true }
    ],
    social_links: {},
    theme_config: {
        primary_color: "#8b5cf6",
        bg_style: "glass_mesh",
        button_style: "glass",
        layout: "list"
    }
}

export default function SocialCenterEditor() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<SocialProfile>(DEFAULT_PROFILE)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<"content" | "design" | "social">("content")
    const [iconPickerOpen, setIconPickerOpen] = useState<number | null>(null)

    const username = user?.username || user?.memberId || "usuario"

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/member/social-profile")
                const data = await res.json()
                if (data.success && data.profile) {
                    setProfile({
                        ...DEFAULT_PROFILE,
                        ...data.profile,
                        tagline: data.profile.tagline || "",
                        avatar_url: data.profile.avatar_url || "",
                        theme_config: { ...DEFAULT_PROFILE.theme_config, ...data.profile.theme_config },
                        social_links: data.profile.social_links || {},
                    })
                } else {
                    setProfile(prev => ({ ...prev, display_name: user?.name || "" }))
                }
            } catch (err) {
                console.error("Error loading profile:", err)
            } finally {
                setLoading(false)
            }
        }
        if (user) loadProfile()
    }, [user])

    const saveProfile = async () => {
        setSaving(true)
        try {
            const res = await fetch("/api/member/social-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile)
            })
            const data = await res.json()
            if (data.success) {
                toast.success("¡Social Center guardado!")
            } else {
                throw new Error(data.error)
            }
        } catch (err: any) {
            toast.error(`Error: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    const copyLink = () => {
        const url = `${window.location.origin}/s/${username}`
        navigator.clipboard.writeText(url)
        toast.success("¡Enlace copiado!")
    }

    const addLink = (preset?: Partial<SocialLink>) => {
        setProfile(prev => ({
            ...prev,
            links: [...prev.links, {
                label: preset?.label || "Nuevo Link",
                url: preset?.url || "https://",
                icon: preset?.icon || "external",
                highlight: preset?.highlight ?? false
            }]
        }))
    }

    const removeLink = (index: number) => {
        setProfile(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }))
    }

    const updateLink = (index: number, field: keyof SocialLink, value: any) => {
        setProfile(prev => ({
            ...prev,
            links: prev.links.map((link, i) => i === index ? { ...link, [field]: value } : link)
        }))
    }

    const moveLink = (index: number, direction: "up" | "down") => {
        setProfile(prev => {
            const newLinks = [...prev.links]
            const target = direction === "up" ? index - 1 : index + 1
            if (target < 0 || target >= newLinks.length) return prev
            ;[newLinks[index], newLinks[target]] = [newLinks[target], newLinks[index]]
            return { ...prev, links: newLinks }
        })
    }

    const primary = profile.theme_config.primary_color
    const bgStyle = profile.theme_config.bg_style
    const tmpl = TEMPLATES.find(t => t.id === bgStyle) || TEMPLATES[0]

    // Preview link style
    const previewLinkClass = (highlight: boolean) => {
        const bs = profile.theme_config.button_style
        if (bs === "solid") {
            return highlight
                ? `w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase text-center border-0 text-white`
                : `w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase text-center border-0 text-white bg-white/15`
        }
        if (bs === "outline") {
            return highlight
                ? `w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase text-center border-2 bg-transparent text-white`
                : `w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase text-center border border-white/20 bg-transparent text-white/60`
        }
        // glass
        return highlight
            ? `w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase text-center border text-white`
            : `w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase text-center border border-white/5 bg-white/5 text-white/60`
    }

    const previewLinkStyle = (highlight: boolean): React.CSSProperties => {
        const bs = profile.theme_config.button_style
        if (bs === "solid" && highlight) return { backgroundColor: primary }
        if (bs === "outline" && highlight) return { borderColor: primary, color: primary }
        if (bs === "glass" && highlight) return {
            borderColor: `${primary}80`,
            backgroundColor: `${primary}1a`,
        }
        return {}
    }

    if (loading) return (
        <div className="p-8 text-center text-white/50 animate-pulse">Cargando editor...</div>
    )

    return (
        <FeatureGate
            feature="socialCenter"
            description="Tu tarjeta de presentación digital premium con links, redes sociales y tu identidad de marca personalizada."
        >
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border-b border-white/5">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                        <Globe className="h-6 w-6 text-primary" />
                        Magic Social Center
                    </h1>
                    <p className="text-xs text-muted-foreground">Tu tarjeta de presentación digital premium.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={copyLink}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                        <Copy className="h-4 w-4" />
                        Copiar
                    </button>
                    <a
                        href={`/s/${username}`}
                        target="_blank"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors"
                    >
                        <Eye className="h-4 w-4" />
                        Ver Público
                    </a>
                    <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-primary text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all disabled:opacity-50"
                    >
                        {saving ? "Guardando..." : (
                            <>
                                <Save className="h-4 w-4" />
                                Guardar
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar tabs */}
                <div className="flex md:flex-col h-auto md:h-full w-full md:w-16 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 overflow-x-auto md:overflow-y-auto">
                    {[
                        { id: "content", icon: <Type className="h-5 w-5" />, label: "Contenido" },
                        { id: "design", icon: <Palette className="h-5 w-5" />, label: "Diseño" },
                        { id: "social", icon: <Share2 className="h-5 w-5" />, label: "Redes" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center justify-center py-4 px-6 md:px-0 transition-all ${activeTab === tab.id ? "text-primary bg-primary/5" : "text-white/40 hover:text-white/60"}`}
                        >
                            {tab.icon}
                            <span className="text-[10px] font-bold mt-1 uppercase hidden md:block">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Editor Panel */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/10">
                    <div className="mx-auto max-w-2xl space-y-8 pb-10">

                        {/* ─── CONTENT TAB ─── */}
                        {activeTab === "content" && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                {/* Profile */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Perfil</h3>
                                    <div className="premium-card p-6 space-y-5">
                                        {/* Avatar + name row */}
                                        <div className="flex items-start gap-4">
                                            <div className="h-16 w-16 shrink-0 rounded-full bg-neutral-800 flex items-center justify-center border-2 border-white/10 overflow-hidden">
                                                {profile.avatar_url
                                                    ? <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                                    : <ImageIcon className="h-6 w-6 text-white/20" />
                                                }
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Tu Nombre o Marca"
                                                        value={profile.display_name}
                                                        onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                                                        className="w-full bg-transparent border-b border-white/10 py-1 text-lg font-bold text-white outline-none focus:border-primary transition-colors"
                                                    />
                                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Nombre público</p>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Tagline o cargo (opcional)"
                                                        value={profile.tagline}
                                                        onChange={e => setProfile(p => ({ ...p, tagline: e.target.value }))}
                                                        className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white/60 outline-none focus:border-primary transition-colors"
                                                    />
                                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Subtítulo</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Avatar URL */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 uppercase">URL del Avatar</label>
                                            <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5">
                                                <ImageIcon className="h-3 w-3 text-white/30 shrink-0" />
                                                <input
                                                    type="url"
                                                    value={profile.avatar_url}
                                                    onChange={e => setProfile(p => ({ ...p, avatar_url: e.target.value }))}
                                                    className="flex-1 bg-transparent border-none text-[11px] text-white/50 outline-none placeholder:text-white/10"
                                                    placeholder="https://tu-foto.com/imagen.jpg"
                                                />
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 uppercase">Biografía</label>
                                            <textarea
                                                value={profile.bio}
                                                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80 outline-none focus:border-primary/50 transition-colors h-20 resize-none"
                                                placeholder="Cuentales quién eres..."
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Links Builder */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Botones & Links</h3>
                                        <button
                                            onClick={() => addLink()}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:brightness-110"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Añadir
                                        </button>
                                    </div>

                                    {/* Quick add templates */}
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_LINKS.map(q => (
                                            <button
                                                key={q.label}
                                                onClick={() => addLink(q)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
                                            >
                                                <Plus className="h-2.5 w-2.5" />
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        {profile.links.map((link, i) => (
                                            <div key={i} className="premium-card p-4 flex gap-3 group">
                                                {/* Up/Down reorder */}
                                                <div className="flex flex-col gap-1 pt-1">
                                                    <button
                                                        onClick={() => moveLink(i, "up")}
                                                        disabled={i === 0}
                                                        className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors"
                                                    >
                                                        <ChevronUp className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveLink(i, "down")}
                                                        disabled={i === profile.links.length - 1}
                                                        className="p-0.5 text-white/20 hover:text-white/60 disabled:opacity-20 transition-colors"
                                                    >
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <div className="flex-1 space-y-2.5 min-w-0">
                                                    <div className="flex gap-3 items-center">
                                                        {/* Icon picker */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setIconPickerOpen(iconPickerOpen === i ? null : i)}
                                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 transition-colors text-xs"
                                                            >
                                                                {React.createElement(
                                                                    ICON_OPTIONS.find(o => o.id === link.icon)?.Icon || ExternalLink,
                                                                    { className: "h-3.5 w-3.5" }
                                                                )}
                                                            </button>
                                                            {iconPickerOpen === i && (
                                                                <div className="absolute left-0 top-10 z-50 bg-neutral-900 border border-white/10 rounded-xl p-2 grid grid-cols-3 gap-1 w-40 shadow-2xl">
                                                                    {ICON_OPTIONS.map(opt => (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => {
                                                                                updateLink(i, "icon", opt.id)
                                                                                setIconPickerOpen(null)
                                                                            }}
                                                                            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors text-[8px] ${link.icon === opt.id ? "bg-primary/20 text-primary" : "text-white/40 hover:bg-white/10 hover:text-white/70"}`}
                                                                        >
                                                                            <opt.Icon className="h-3.5 w-3.5" />
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <input
                                                            type="text"
                                                            value={link.label}
                                                            onChange={e => updateLink(i, "label", e.target.value)}
                                                            className="flex-1 bg-transparent border-b border-white/10 py-1 text-sm font-bold text-white outline-none focus:border-primary transition-colors"
                                                            placeholder="Título del botón"
                                                        />

                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className="text-[9px] font-bold text-white/20 uppercase">Destacar</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={link.highlight}
                                                                onChange={e => updateLink(i, "highlight", e.target.checked)}
                                                                className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5">
                                                        <Link className="h-3 w-3 text-white/30 shrink-0" />
                                                        <input
                                                            type="text"
                                                            value={link.url}
                                                            onChange={e => updateLink(i, "url", e.target.value)}
                                                            className="flex-1 bg-transparent border-none text-[11px] text-white/50 outline-none placeholder:text-white/10"
                                                            placeholder="https://susitio.com"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => removeLink(i)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-500 transition-all self-center"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* ─── DESIGN TAB ─── */}
                        {activeTab === "design" && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Estética & Colores</h3>
                                    <div className="premium-card p-6 space-y-6">
                                        {/* Color picker */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-white/40 uppercase">Color Principal</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={profile.theme_config.primary_color}
                                                    onChange={e => setProfile(p => ({ ...p, theme_config: { ...p.theme_config, primary_color: e.target.value } }))}
                                                    className="h-10 w-20 bg-transparent border-none cursor-pointer rounded-lg"
                                                />
                                                <span className="text-[11px] font-mono text-white/60">{profile.theme_config.primary_color}</span>
                                                {/* Preset colors */}
                                                <div className="flex gap-2 ml-2">
                                                    {["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"].map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => setProfile(p => ({ ...p, theme_config: { ...p.theme_config, primary_color: c } }))}
                                                            className="h-6 w-6 rounded-full border-2 transition-all"
                                                            style={{
                                                                backgroundColor: c,
                                                                borderColor: profile.theme_config.primary_color === c ? "#fff" : "transparent"
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual template picker */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-white/40 uppercase">Estilo de Fondo</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {TEMPLATES.map(tmpl => (
                                                    <button
                                                        key={tmpl.id}
                                                        onClick={() => setProfile(p => ({ ...p, theme_config: { ...p.theme_config, bg_style: tmpl.id } }))}
                                                        className={`relative flex flex-col items-center gap-1.5 rounded-xl overflow-hidden border-2 transition-all ${profile.theme_config.bg_style === tmpl.id ? "border-primary scale-105" : "border-white/10 hover:border-white/30"}`}
                                                    >
                                                        <div className="w-full h-12 relative overflow-hidden" style={{ backgroundColor: tmpl.bg }}>
                                                            <div className="absolute top-0 left-0 w-10 h-10 rounded-full blur-xl" style={{ backgroundColor: tmpl.orb }} />
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase pb-1.5 text-white/50">{tmpl.name}</span>
                                                        {profile.theme_config.bg_style === tmpl.id && (
                                                            <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                                                                <Check className="h-2 w-2 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Button style */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-white/40 uppercase">Estilo de Botones</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(["glass", "solid", "outline"] as const).map(style => (
                                                    <button
                                                        key={style}
                                                        onClick={() => setProfile(p => ({ ...p, theme_config: { ...p.theme_config, button_style: style } }))}
                                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${profile.theme_config.button_style === style
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-white/5 bg-white/5 text-white/40"}`}
                                                    >
                                                        {style === "glass" ? "Cristal" : style === "solid" ? "Sólido" : "Borde"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* ─── SOCIAL TAB ─── */}
                        {activeTab === "social" && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Redes Sociales</h3>
                                    <div className="premium-card p-6 space-y-4">
                                        {[
                                            { id: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, placeholder: "https://instagram.com/tu_usuario" },
                                            { id: "tiktok", label: "TikTok", icon: <TikTokIcon className="h-4 w-4" />, placeholder: "https://tiktok.com/@tu_usuario" },
                                            { id: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" />, placeholder: "https://youtube.com/@canal" },
                                            { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" />, placeholder: "https://wa.me/52XXXXXXXXXX" },
                                            { id: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" />, placeholder: "https://facebook.com/pagina" },
                                            { id: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, placeholder: "https://linkedin.com/in/usuario" },
                                            { id: "twitter", label: "Twitter / X", icon: <Twitter className="h-4 w-4" />, placeholder: "https://x.com/usuario" },
                                            { id: "telegram", label: "Telegram", icon: <Phone className="h-4 w-4" />, placeholder: "https://t.me/usuario" },
                                        ].map(social => (
                                            <div key={social.id} className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-white/40">{social.icon}</div>
                                                    <label className="text-[10px] font-bold text-white/40 uppercase">{social.label}</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={(profile.social_links as any)[social.id] || ""}
                                                    onChange={e => setProfile(p => ({
                                                        ...p,
                                                        social_links: { ...p.social_links, [social.id]: e.target.value }
                                                    }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80 outline-none focus:border-primary/50 transition-colors"
                                                    placeholder={social.placeholder}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── PREVIEW PANE ─── */}
                <div className="hidden lg:flex w-[400px] border-l border-white/5 bg-black/40 items-center justify-center p-8">
                    <div className="w-full max-w-[320px] aspect-[9/19] rounded-[3rem] border-[8px] border-neutral-900 bg-black shadow-2xl overflow-hidden relative">
                        {/* Phone content */}
                        <div
                            className="absolute inset-0 h-full w-full overflow-y-auto overflow-x-hidden flex flex-col items-center pt-10 px-4 pb-10 custom-scrollbar"
                            style={{ backgroundColor: tmpl.bg }}
                        >
                            {/* BG orb */}
                            <div
                                className="absolute top-0 left-0 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
                                style={{ backgroundColor: `${primary}35` }}
                            />

                            {/* Avatar */}
                            <div className="relative h-14 w-14 rounded-full border border-white/10 bg-neutral-800 mb-2 overflow-hidden shrink-0 z-10">
                                {profile.avatar_url
                                    ? <img src={profile.avatar_url} className="h-full w-full object-cover" alt="" />
                                    : <div className="h-full w-full flex items-center justify-center text-lg font-black text-white/20">
                                        {profile.display_name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                }
                            </div>

                            <h4 className="text-xs font-black text-white uppercase mb-0.5 z-10">{profile.display_name || "TU NOMBRE"}</h4>
                            {profile.tagline && (
                                <p className="text-[8px] font-bold uppercase mb-1 z-10" style={{ color: primary }}>{profile.tagline}</p>
                            )}
                            <p className="text-[8px] text-white/40 text-center mb-4 line-clamp-2 z-10">{profile.bio}</p>

                            <div className="w-full space-y-2 mt-2 z-10">
                                {profile.links.map((link, i) => (
                                    <div
                                        key={i}
                                        className={previewLinkClass(link.highlight)}
                                        style={previewLinkStyle(link.highlight)}
                                    >
                                        {link.label}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto pt-6 flex gap-3 z-10">
                                {profile.social_links.instagram && <Instagram className="h-3 w-3 text-white/50" />}
                                {profile.social_links.tiktok && <TikTokIcon className="h-3 w-3 text-white/50" />}
                                {profile.social_links.youtube && <Youtube className="h-3 w-3 text-white/50" />}
                                {profile.social_links.whatsapp && <MessageCircle className="h-3 w-3 text-white/50" />}
                                {profile.social_links.facebook && <Facebook className="h-3 w-3 text-white/50" />}
                                {profile.social_links.twitter && <Twitter className="h-3 w-3 text-white/50" />}
                            </div>
                        </div>

                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-neutral-900 rounded-b-2xl z-50 px-4 flex items-center justify-center">
                            <div className="h-1 w-8 rounded-full bg-white/10" />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 0px; }
                .premium-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 1.5rem;
                    transition: border-color 0.2s, background 0.2s;
                }
                .premium-card:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                }
            `}</style>
        </div>
        </FeatureGate>
    )
}
