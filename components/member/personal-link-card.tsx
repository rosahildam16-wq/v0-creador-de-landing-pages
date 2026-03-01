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
  const [copied, setCopied] = useState(false)
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
          title: currentFunnel?.nombre || "Mi embudo",
          text: shareText,
          url: personalLink,
        })
      } catch { /* cancelled */ }
    } else {
      handleCopy()
    }
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
              onClick={handleCopy}
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
                copied
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border-white/5 bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              )}
              aria-label="Copiar"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
            <button
              onClick={handleShare}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              aria-label="Compartir"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
