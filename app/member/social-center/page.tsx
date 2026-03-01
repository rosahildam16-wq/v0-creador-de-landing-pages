"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
    Globe,
    Copy,
    ExternalLink,
    Sparkles,
    Layout,
    Palette,
    Share2,
    Plus,
    Trash2,
    GripVertical,
    Save,
    Image as ImageIcon,
    Type,
    Link,
    Instagram,
    Youtube,
    MessageCircle,
    Eye,
    ChevronDown,
    ChevronUp
} from "lucide-react"

const TiktokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
)
import { toast } from "sonner"

interface SocialLink {
    label: string
    url: string
    icon: string
    highlight: boolean
}

interface SocialProfile {
    display_name: string
    bio: string
    avatar_url: string
    links: SocialLink[]
    social_links: {
        instagram?: string
        tiktok?: string
        youtube?: string
        whatsapp?: string
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

    const username = user?.username || user?.memberId || "usuario"
    const publicUrl = `https://magicfunnel.app/s/${username}`

    // Fetch profile
    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/member/social-profile")
                const data = await res.json()
                if (data.success && data.profile) {
                    setProfile(data.profile)
                } else {
                    // Set initial name from user
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
                toast.success("¡Social Center guardado! 🥂")
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
        navigator.clipboard.writeText(publicUrl)
        toast.success("¡Enlace copiado! 🚀")
    }

    const addLink = () => {
        setProfile(prev => ({
            ...prev,
            links: [...prev.links, { label: "Nuevo Link", url: "https://", icon: "external", highlight: false }]
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

    if (loading) return <div className="p-8 text-center text-white/50 animate-pulse">Cargando editor...</div>

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500 overflow-hidden">
            {/* ── Header ── */}
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
                        href={publicUrl}
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
                {/* ── Editor Toolbar (Mobile tabs) ── */}
                <div className="flex md:flex-col h-auto md:h-full w-full md:w-16 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 overflow-x-auto md:overflow-y-auto">
                    {[
                        { id: "content", icon: <Type className="h-5 w-5" />, label: "Contenido" },
                        { id: "design", icon: <Palette className="h-5 w-5" />, label: "Diseño" },
                        { id: "social", icon: <Share2 className="h-5 w-5" />, label: "Redes" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center justify-center py-4 px-6 md:px-0 transition-all ${activeTab === tab.id ? "text-primary bg-primary/5" : "text-white/40 hover:text-white/60"
                                }`}
                        >
                            {tab.icon}
                            <span className="text-[10px] font-bold mt-1 uppercase hidden md:block">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Scrollable Editor Panel ── */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/10">
                    <div className="mx-auto max-w-2xl space-y-8 pb-10">
                        {activeTab === "content" && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                {/* Basic Info */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Perfil</h3>
                                    <div className="premium-card p-6 space-y-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center border-2 border-white/10 relative group overflow-hidden">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                                ) : <ImageIcon className="h-6 w-6 text-white/20" />}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                                    <span className="text-[10px] font-bold">Cambiar</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <input
                                                    type="text"
                                                    placeholder="Tu Nombre o Marca"
                                                    value={profile.display_name}
                                                    onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                                                    className="w-full bg-transparent border-b border-white/10 py-1 text-lg font-bold text-white outline-none focus:border-primary transition-colors"
                                                />
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest">Nombre público</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/60 uppercase">Biografía</label>
                                            <textarea
                                                value={profile.bio}
                                                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80 outline-none focus:border-primary/50 transition-colors h-24 resize-none"
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
                                            onClick={addLink}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:brightness-110"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Añadir Link
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {profile.links.map((link, i) => (
                                            <div key={i} className="premium-card p-4 flex gap-4 group">
                                                <div className="cursor-grab active:cursor-grabbing text-white/10 hover:text-white/30 pt-1">
                                                    <GripVertical className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex gap-4">
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                value={link.label}
                                                                onChange={e => updateLink(i, "label", e.target.value)}
                                                                className="w-full bg-transparent border-b border-white/10 py-1 text-sm font-bold text-white outline-none focus:border-primary transition-colors"
                                                                placeholder="Título del botón"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
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
                                                        <Link className="h-3 w-3 text-white/30" />
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

                        {activeTab === "design" && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                {/* Themes */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Estética & Colores</h3>
                                    <div className="premium-card p-6 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-white/40 uppercase">Color Primario</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={profile.theme_config.primary_color}
                                                        onChange={e => setProfile(p => ({ ...p, theme_config: { ...p.theme_config, primary_color: e.target.value } }))}
                                                        className="h-10 w-20 bg-transparent border-none cursor-pointer"
                                                    />
                                                    <span className="text-[11px] font-mono text-white/60">{profile.theme_config.primary_color}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-white/40 uppercase">Estilo Fondo</label>
                                                <select
                                                    value={profile.theme_config.bg_style}
                                                    onChange={e => setProfile(p => ({ ...p, theme_config: { ...p.theme_config, bg_style: e.target.value } }))}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                                                >
                                                    <option value="glass_mesh">Vidrio & Mesh</option>
                                                    <option value="dark_minimal">Oscuro Minimal</option>
                                                    <option value="neon_glow">Brillo Neon</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-white/40 uppercase">Estilo de Botones</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {["glass", "solid", "outline"].map(style => (
                                                    <button
                                                        key={style}
                                                        onClick={() => setProfile(p => ({ ...p, theme_config: { ...p.theme_config, button_style: style as any } }))}
                                                        className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${profile.theme_config.button_style === style
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-white/5 bg-white/5 text-white/40"
                                                            }`}
                                                    >
                                                        {style}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === "social" && (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                <section className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Redes Sociales</h3>
                                    <div className="premium-card p-6 space-y-4">
                                        {[
                                            { id: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
                                            { id: "tiktok", label: "TikTok", icon: <TiktokIcon className="h-4 w-4" /> },
                                            { id: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
                                            { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> }
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
                                                    placeholder={`URL de tu ${social.label}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Real-time Preview Pane (Desktop only) ── */}
                <div className="hidden lg:flex w-[400px] border-l border-white/5 bg-black/40 items-center justify-center p-8">
                    <div className="w-full max-w-[320px] aspect-[9/19] rounded-[3rem] border-[8px] border-neutral-900 bg-black shadow-2xl overflow-hidden relative">
                        {/* MOCK PREVIEW CONTENT */}
                        <div className="absolute inset-0 h-full w-full bg-[#05010d] overflow-y-auto overflow-x-hidden flex flex-col items-center pt-10 px-4 pb-10 custom-scrollbar">
                            <div className="h-16 w-16 rounded-full border border-white/10 bg-neutral-800 mb-3 overflow-hidden">
                                {profile.avatar_url && <img src={profile.avatar_url} className="h-full w-full object-cover" />}
                            </div>
                            <h4 className="text-xs font-black text-white uppercase mb-1">{profile.display_name || "TU NOMBRE"}</h4>
                            <p className="text-[9px] text-white/40 text-center mb-6 line-clamp-2">{profile.bio}</p>

                            <div className="w-full space-y-2 mt-4">
                                {profile.links.map((link, i) => (
                                    <div
                                        key={i}
                                        className={`w-full py-2.5 px-4 rounded-xl text-[9px] font-black uppercase text-center border transition-all ${link.highlight
                                            ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]"
                                            : "border-white/5 bg-white/5 text-white/60"
                                            }`}
                                    >
                                        {link.label}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto pt-8 flex gap-4 grayscale opacity-30">
                                {profile.social_links.instagram && <Instagram className="h-4 w-4 text-white" />}
                                {profile.social_links.tiktok && <TiktokIcon className="h-4 w-4 text-white" />}
                                {profile.social_links.youtube && <Youtube className="h-4 w-4 text-white" />}
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
                .custom-scrollbar::-webkit-scrollbar {
                    width: 0px;
                }
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
    )
}
