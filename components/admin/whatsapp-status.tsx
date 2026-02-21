"use client"

import { cn } from "@/lib/utils"
import type { TipoEmbudo } from "@/lib/types"

interface WhatsAppStatusProps {
  tipoEmbudo: TipoEmbudo
  whatsappCitaEnviado: boolean
  compraCompletada: boolean
  className?: string
}

/**
 * Shows WhatsApp cita status or purchase completion depending on the funnel type.
 *
 * - Embudo tipo "cita":   green dot + "Enviado" / gray dot + "Pendiente"
 * - Embudo tipo "compra": green dot + "Comprado" / gray dot + "Sin compra"
 */
export function WhatsAppStatus({
  tipoEmbudo,
  whatsappCitaEnviado,
  compraCompletada,
  className,
}: WhatsAppStatusProps) {
  if (tipoEmbudo === "compra") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            compraCompletada ? "bg-emerald-500" : "bg-muted-foreground/30"
          )}
        />
        <span className="text-xs text-muted-foreground">
          {compraCompletada ? "Comprado" : "Sin compra"}
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          whatsappCitaEnviado ? "bg-emerald-500" : "bg-muted-foreground/30"
        )}
      />
      <span className="text-xs text-muted-foreground">
        {whatsappCitaEnviado ? "Enviado" : "Pendiente"}
      </span>
    </div>
  )
}
