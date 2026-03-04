"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ShieldAlert, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

/**
 * Shown at the top of every page when an admin is impersonating a user.
 * Detected via the _impersonating flag in the JWT session.
 *
 * Blocked during impersonation (enforced server-side):
 *   - change plan
 *   - edit payout
 *   - edit sponsor
 *   - view API keys
 *   - change roles
 *   - execute refunds
 */
export function ImpersonationBanner() {
  const { user } = useAuth()
  const router = useRouter()
  const [ending, setEnding] = useState(false)

  // Only render if session has the impersonation flag
  const isImpersonating = (user as Record<string, unknown> | null)?._impersonating === true
  const impersonatedBy  = (user as Record<string, unknown> | null)?._impersonatedBy as string | undefined

  if (!isImpersonating) return null

  async function handleEnd() {
    setEnding(true)
    try {
      const res = await fetch("/api/admin/impersonate/end", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Error al terminar impersonación")
        return
      }

      toast.success("Sesión de impersonación terminada")
      router.push(data.redirectTo ?? "/admin")
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setEnding(false)
    }
  }

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-between gap-3 border-b border-orange-500/30 bg-orange-500/10 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="h-4 w-4 shrink-0 text-orange-400" />
        <p className="text-sm font-semibold text-orange-300">
          Modo Admin: estás impersonando a{" "}
          <span className="font-bold text-orange-200">{user?.name ?? user?.email ?? "este usuario"}</span>
        </p>
        {impersonatedBy && (
          <span className="hidden text-xs text-orange-400/70 sm:inline">
            · iniciado por {impersonatedBy}
          </span>
        )}
        <span className="rounded-full bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 text-[10px] font-bold text-orange-300 uppercase tracking-wide">
          Acciones sensibles bloqueadas
        </span>
      </div>
      <button
        onClick={handleEnd}
        disabled={ending}
        className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
      >
        {ending ? (
          <><Loader2 className="h-3 w-3 animate-spin" />Terminando...</>
        ) : (
          <><X className="h-3 w-3" />Terminar impersonación</>
        )}
      </button>
    </div>
  )
}
