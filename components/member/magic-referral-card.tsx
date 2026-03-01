"use client"

import { useState } from "react"
import { Sparkles, Copy, Check, Share2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface MagicReferralCardProps {
    username: string
    displayName?: string
}

export function MagicReferralCard({ username, displayName }: MagicReferralCardProps) {
    const [copiedLink, setCopiedLink] = useState(false)
    const [copiedFull, setCopiedFull] = useState(false)

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const referralLink = `${baseUrl}/login?ref=${username}`

    const shareText = `🚀 ¡Hola! ${displayName ? `Soy ${displayName} y te` : "Te"} invito a unirte a mi equipo en *Magic Funnel*. 

Estamos usando Inteligencia Artificial para automatizar nuestras ventas y escalar nuestro negocio al siguiente nivel. 🪄✨

Regístrate aquí para empezar a trabajar juntos:
${referralLink}`

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink)
        } catch {
            const input = document.createElement("input")
            input.value = referralLink
            document.body.appendChild(input)
            input.select()
            document.execCommand("copy")
            document.body.removeChild(input)
        }
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
    }

    const handleCopyFull = async () => {
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
        setCopiedFull(true)
        setTimeout(() => setCopiedFull(false), 2000)
    }

    const handleShareWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
        window.open(url, '_blank')
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
                            onClick={handleCopyLink}
                            className={cn(
                                "flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border transition-all duration-300 md:flex-initial md:px-6",
                                copiedLink
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    : "border-white/5 bg-white/[0.03] text-violet-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                            )}
                        >
                            {copiedLink ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            <span className="text-xs font-bold uppercase tracking-wider">Copiar Link</span>
                        </button>

                        <button
                            onClick={handleShareWhatsApp}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/20 md:flex-initial md:px-6"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.049c0 2.123.554 4.197 1.611 6.041l-1.712 6.25 6.395-1.677c1.782.97 3.8 1.482 5.854 1.485h.005c6.634 0 12.044-5.412 12.048-12.05a11.82 11.82 0 00-3.522-8.421z" />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider">WhatsApp</span>
                        </button>

                        <button
                            onClick={handleCopyFull}
                            className={cn(
                                "hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 md:flex",
                                copiedFull
                                    ? "border-violet-500/40 bg-violet-500/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                    : "border-white/5 bg-white/[0.03] text-violet-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                            )}
                            title="Copiar Texto + Link"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
