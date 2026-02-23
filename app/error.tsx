"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log("[v0] Global error caught:", error.message, error.stack)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
          <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Algo salio mal</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error.message || "Ha ocurrido un error inesperado. Por favor intenta de nuevo."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
