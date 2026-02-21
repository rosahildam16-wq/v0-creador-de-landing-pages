"use client"

import { useState } from "react"
import { Link2, Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface PersonalLinkCardProps {
  memberId: string
}

export function PersonalLinkCard({ memberId }: PersonalLinkCardProps) {
  const [copied, setCopied] = useState(false)

  // Build the link using the current domain
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const personalLink = `${baseUrl}/funnel/${memberId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(personalLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement("input")
      input.value = personalLink
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Tu Link Personal</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Comparte este link para capturar leads automaticamente
        </p>

        {/* Link box */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-secondary/60 border border-border/50 px-4 py-3">
            <span className="text-sm text-foreground font-mono break-all">
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
        </div>
      </div>
    </div>
  )
}
