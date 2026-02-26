"use client"

import { useState } from "react"
import { Sparkles, Copy, Check, Share2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface MagicReferralCardProps {
    username: string
    displayName?: string
}

export function MagicReferralCard({ username, displayName }: MagicReferralCardProps) {
    const [copied, setCopied] = useState(false)

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const referralLink = `${baseUrl}/login?ref=${username}`

    const shareText = `🚀 ¡Hola! ${displayName ? `Soy ${displayName} y te` : "Te"} invito a unirte a mi equipo en *Magic Funnel*. 

Estamos usando Inteligencia Artificial para automatizar nuestras ventas y escalar nuestro negocio al siguiente nivel. 🪄✨

Regístrate aquí para empezar a trabajar juntos:
${referralLink}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText)
        } catch {
            const input = document.createElement("textarea")
            input.value = shareText
            document.body.appendChild(input)
            input.select()
            document.execCommand("copy")
            document.body.removeChild(input)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Únete a mi equipo en Magic Funnel",
                    text: shareText,
                    url: referralLink,
                })
            } catch { /* cancelled */ }
        } else {
            handleCopy()
        }
    }

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 via-card/50 to-fuchsia-500/5 p-6 backdrop-blur-md transition-all hover:border-violet-500/40 hover:shadow-[0_0_40px_-15px_rgba(139,92,246,0.3)]">
            {/* Decorative Blur */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl transition-opacity group-hover:opacity-100" />
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-fuchsia-600/10 blur-3xl transition-opacity group-hover:opacity-100" />

            <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Socio Magic Funnel</h3>
                            <p className="text-[10px] uppercase tracking-wider text-violet-400/60 font-bold">Link de Invitación</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 border border-violet-500/20">
                        <Users className="h-3 w-3 text-violet-400" />
                        <span className="text-[10px] font-bold text-violet-400">CREA TU EQUIPO</span>
                    </div>
                </div>

                <p className="text-xs text-violet-200/40 leading-relaxed font-medium">
                    Usa este link para invitar a nuevos socios a tu red. Quedarán vinculados directamente a tu equipo dentro de Magic Funnel.
                </p>

                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5 backdrop-blur-sm">
                        <span className="text-[13px] font-mono text-violet-200/70 truncate block">
                            {referralLink}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
                                copied
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    : "border-white/5 bg-white/[0.03] text-violet-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                            )}
                        >
                            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-violet-300 transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
