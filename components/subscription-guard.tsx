"use client"

import { type ReactNode } from "react"

/**
 * SubscriptionGuard - DESACTIVADO TEMPORALMENTE
 * Permite acceso total a todas las herramientas de la plataforma
 * para los miembros de la comunidad.
 */
export function SubscriptionGuard({ children }: { children: ReactNode }) {
  // Bypass total para permitir funcionamiento normal de todas las herramientas
  return <>{children}</>
}
