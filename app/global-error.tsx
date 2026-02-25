"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.log("[v0] GLOBAL error caught:", error.message, error.stack)
  }, [error])

  return (
    <html lang="es" className="dark">
      <body style={{ backgroundColor: "#05010d", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "24px", padding: "24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Algo salio mal</h2>
          <p style={{ fontSize: "14px", opacity: 0.6, maxWidth: "400px" }}>
            Error inesperado. Por favor intenta de nuevo.
          </p>
          <button
            onClick={reset}
            style={{ padding: "12px 24px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
