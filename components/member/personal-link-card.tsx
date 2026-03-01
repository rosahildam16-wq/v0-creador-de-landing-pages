"use client"

import { useState, useEffect, useMemo } from "react"
import { Link2, Check, Copy, ChevronDown, Share2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { EMBUDOS } from "@/lib/embudos-config"
import { getTeamMemberById } from "@/lib/team-data"
import { useAuth } from "@/lib/auth-context"

interface PersonalLinkCardProps {
  memberId: string
}

const DEFAULT_FUNNEL = "franquicia-reset"

export function PersonalLinkCard({ memberId }: PersonalLinkCardProps) {
  const { user } = useAuth()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedFull, setCopiedFull] = useState(false)
  const [selectedFunnel, setSelectedFunnel] = useState(DEFAULT_FUNNEL)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Preferred slug: user.username from session > prop memberId (which might be UUID)
  const finalSlug = user?.username || memberId

  // Get member's assigned funnels
  const member = getTeamMemberById(memberId)
  const assignedFunnelIds = member?.embudos_asignados ?? [DEFAULT_FUNNEL]

  const assignedFunnels = useMemo(
    () => EMBUDOS.filter((e) => assignedFunnelIds.includes(e.id)),
    [assignedFunnelIds]
  )

  // Ensure default is assigned, fall back to first assigned
  useEffect(() => {
    if (assignedFunnels.length > 0 && !assignedFunnels.find((f) => f.id === selectedFunnel)) {
      setSelectedFunnel(assignedFunnels[0].id)
    }
  }, [assignedFunnels, selectedFunnel])

  const currentFunnel = EMBUDOS.find((e) => e.id === selectedFunnel)

  // Build the personalized link (Always use window.location.origin for robustness)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "")
  const personalLink = `${baseUrl}/r/${finalSlug}/${selectedFunnel}`

  const shareText = currentFunnel?.persuasiveText
    ? `${currentFunnel.persuasiveText}\n${personalLink}`
    : `🚀 Mira el nuevo embudo: *${currentFunnel?.nombre}*\n${personalLink}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(personalLink)
    } catch {
      const input = document.createElement("input")
      input.value = personalLink
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
    <div className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/50 to-primary/5 p-5 backdrop-blur-md transition-all hover:border-primary/40">
      {/* Visual flare */}
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all" />

      <div className="relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Tu Motor de Ventas</h3>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold">Link de Referido</p>
            </div>
          </div>

          {/* Funnel selector */}
          {assignedFunnels.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/40 px-3 py-1.5 text-[10px] font-bold text-foreground transition-all hover:bg-secondary/60 active:scale-95"
              >
                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentFunnel?.color }} />
                {currentFunnel?.nombre}
                <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform duration-300", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-2xl border border-white/10 bg-black/80 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                    {assignedFunnels.map((funnel) => (
                      <button
                        key={funnel.id}
                        onClick={() => { setSelectedFunnel(funnel.id); setDropdownOpen(false) }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[11px] transition-all",
                          funnel.id === selectedFunnel
                            ? "bg-primary text-white font-bold"
                            : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: funnel.id === selectedFunnel ? '#fff' : funnel.color }} />
                        {funnel.nombre}
                        {funnel.id === selectedFunnel && <Check className="ml-auto h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-[90%]">
          Comparte este motor de alta conversión de <span className="font-bold text-primary">{currentFunnel?.nombre}</span> para capturar nuevos leads.
        </p>

        {/* Link box */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black/20 px-4 py-3.5 backdrop-blur-sm">
            <span className="text-[13px] font-mono text-primary/80 truncate block">
              {personalLink}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className={cn(
                "flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border transition-all duration-300 md:flex-initial md:px-6",
                copiedLink
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border-white/5 bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              )}
              aria-label="Copiar Link"
            >
              {copiedLink ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              <span className="text-xs font-bold uppercase tracking-wider">Copiar Link</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/20 md:flex-initial md:px-6"
              aria-label="Compartir en WhatsApp"
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
                  ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                  : "border-white/5 bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
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
