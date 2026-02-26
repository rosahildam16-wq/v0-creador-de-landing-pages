"use client"

import { useState, useEffect, useMemo } from "react"
import { Link2, Check, Copy, ChevronDown, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { EMBUDOS } from "@/lib/embudos-config"
import { getTeamMemberById } from "@/lib/team-data"

interface PersonalLinkCardProps {
  memberId: string
}

const DEFAULT_FUNNEL = "franquicia-reset"

export function PersonalLinkCard({ memberId }: PersonalLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [selectedFunnel, setSelectedFunnel] = useState(DEFAULT_FUNNEL)
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

  // Use the memberId as the slug for the referral link
  const memberSlug = memberId

  // Build the personalized link
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const personalLink = `${baseUrl}/r/${memberSlug}/${selectedFunnel}`

  const handleCopy = async () => {
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentFunnel?.nombre || "Mi embudo",
          text: "Mira esto:",
          url: personalLink,
        })
      } catch { /* cancelled */ }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Tu Link de Referido</h3>
          </div>

          {/* Funnel selector */}
          {assignedFunnels.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: currentFunnel?.color }} />
                {currentFunnel?.nombre}
                <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-border/50 bg-card p-1 shadow-xl">
                    {assignedFunnels.map((funnel) => (
                      <button
                        key={funnel.id}
                        onClick={() => { setSelectedFunnel(funnel.id); setDropdownOpen(false) }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                          funnel.id === selectedFunnel
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-secondary/60"
                        )}
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: funnel.color }} />
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

        <p className="text-xs text-muted-foreground">
          Comparte este link para capturar leads con el embudo{" "}
          <span className="font-semibold text-primary">{currentFunnel?.nombre}</span>
        </p>

        {/* Link box */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border/50 bg-secondary/60 px-4 py-3">
            <span className="text-sm font-mono text-foreground break-all">
              {personalLink}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
              copied
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            aria-label="Copiar link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={handleShare}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
            aria-label="Compartir link"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
