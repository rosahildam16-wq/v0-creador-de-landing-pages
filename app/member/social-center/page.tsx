"use client"

import React from "react"
import { useAuth } from "@/lib/auth-context"
import { Globe, Copy, ExternalLink, Sparkles, Layout, Palette, Share2 } from "lucide-react"
import { toast } from "sonner"

export default function MemberSocialCenter() {
    const { user } = useAuth()
    const username = user?.username || user?.memberId || "usuario"
    const publicUrl = `https://magicfunnel.app/s/${username}`

    const copyLink = () => {
        navigator.clipboard.writeText(publicUrl)
        toast.success("¡Enlace copiado al portapapeles! 🚀")
    }

    return (
        <div className="flex flex-col gap-8 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                    <Globe className="h-8 w-8 text-primary" />
                    Magic Social Center
                </h1>
                <p className="text-muted-foreground">Gestiona tu tarjeta de presentación digital y marca personal.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* URL Card */}
                <div className="premium-card rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                                <Share2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Tu Enlace Público</h3>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">Listo para usar en Instagram/TikTok</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl bg-black/40 border border-white/10 p-4">
                            <span className="flex-1 truncate text-sm font-medium text-white/70">{publicUrl}</span>
                            <button
                                onClick={copyLink}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-primary"
                            >
                                <Copy className="h-5 w-5" />
                            </button>
                        </div>

                        <a
                            href={publicUrl}
                            target="_blank"
                            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-primary font-black text-white text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-transform hover:scale-[1.02] active:scale-95"
                        >
                            Ver mi Social Center
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {/* Coming Soon / Status Card */}
                <div className="premium-card rounded-3xl border border-primary/20 bg-primary/5 p-8 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />

                    <div className="relative flex flex-col h-full justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white uppercase tracking-tighter text-xl">Editor Visual</h3>
                                <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase border border-primary/30">
                                    Próximamente
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 opacity-60">
                                <Layout className="h-4 w-4 mt-0.5" />
                                <p className="text-xs text-white/70 italic">"Muy pronto podrás arrastrar y soltar tus propios botones personalizados."</p>
                            </div>
                            <div className="flex items-start gap-3 opacity-60">
                                <Palette className="h-4 w-4 mt-0.5" />
                                <p className="text-xs text-white/70 italic">"Personaliza colores, fondos y efectos de cristal a tu gusto."</p>
                            </div>
                        </div>

                        <button
                            disabled
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-white/20 text-xs uppercase tracking-widest cursor-not-allowed"
                        >
                            Personalizar (Bloqueado)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
