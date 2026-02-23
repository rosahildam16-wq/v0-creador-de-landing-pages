"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getLanding } from "@/lib/landing-builder-storage"
import type { LandingConfig } from "@/lib/landing-builder-types"
import { BlockRenderer } from "@/components/landing-builder/block-renderers"
import { ArrowLeft, Pencil } from "lucide-react"

export default function LandingPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [landing, setLanding] = useState<LandingConfig | null>(null)

  useEffect(() => {
    const data = getLanding(id)
    setLanding(data)
  }, [id])

  if (!landing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando preview...</p>
      </div>
    )
  }

  const fontClass =
    landing.theme.fontFamily === "serif"
      ? "font-serif"
      : landing.theme.fontFamily === "mono"
        ? "font-mono"
        : "font-sans"

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: landing.theme.backgroundColor }}>
      {/* Floating toolbar */}
      <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/30 bg-background/80 px-4 py-2 shadow-xl backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
        <div className="h-4 w-px bg-border/50" />
        <span className="px-2 text-xs font-medium text-foreground">{landing.name}</span>
        <div className="h-4 w-px bg-border/50" />
        <button
          onClick={() => router.push(`/admin/landing-builder/${id}`)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      </div>

      {/* Rendered landing */}
      <div className={fontClass}>
        {landing.blocks
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <BlockRenderer key={block.id} block={block} theme={landing.theme} />
          ))}
      </div>

      {landing.blocks.length === 0 && (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-muted-foreground" style={{ color: `${landing.theme.textColor}88` }}>
            Esta landing no tiene bloques aun.
          </p>
        </div>
      )}
    </div>
  )
}
