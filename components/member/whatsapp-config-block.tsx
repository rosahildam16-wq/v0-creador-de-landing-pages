"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_MESSAGES = [
  "Hola, acabo de completar el diagnóstico y quiero solicitar mi acceso prioritario a la Franquicia RESET.",
  "¡Hola! Vengo del sistema RESET, estoy listo para empezar mi transformación. ¿Me das el acceso?",
  "He terminado el proceso de RESET. Quiero hablar con un asesor para activar mi motor de ventas.",
]

type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error"

interface Props {
  /** Funnel id — only renders for "franquicia-reset" */
  embudoId: string
}

export function WhatsAppConfigBlock({ embudoId }: Props) {
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState(DEFAULT_MESSAGES[0])
  const [status, setStatus] = useState<SaveStatus>("loading")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load from DB on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (embudoId !== "franquicia-reset") return
    fetch("/api/member/whatsapp")
      .then((r) => r.json())
      .then((data) => {
        if (data.whatsapp_number) setPhone(data.whatsapp_number)
        if (data.whatsapp_message) setMessage(data.whatsapp_message)
        setStatus("idle")
      })
      .catch(() => setStatus("idle"))
  }, [embudoId])

  // ── Persist to DB ────────────────────────────────────────────────────────
  const persist = useCallback(async (num: string, msg: string) => {
    setStatus("saving")
    setErrorMsg(null)
    try {
      const res = await fetch("/api/member/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_number: num, whatsapp_message: msg }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Error al guardar")
      setStatus("saved")
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setStatus("idle"), 3000)
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message ?? "No se pudo guardar")
    }
  }, [])

  // ── Phone change: debounce 1.5 s ────────────────────────────────────────
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    setPhone(val)
    setStatus("idle")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length >= 7) {
      debounceRef.current = setTimeout(() => persist(val, message), 1500)
    }
  }

  // ── Message selection: save immediately ──────────────────────────────────
  const handleMessageSelect = (msg: string) => {
    setMessage(msg)
    persist(phone, msg)
  }

  if (embudoId !== "franquicia-reset") return null

  return (
    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-3 px-1">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Configuración de Contacto (WhatsApp)</h3>
      </div>
      <Card className="border-primary/20 bg-primary/5 overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-4">

          {/* Phone input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
              Tu número de WhatsApp (con código de país)
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={status === "loading" ? "Cargando…" : "Ej: 573123456789"}
              disabled={status === "loading"}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50 transition-all font-mono disabled:opacity-40"
              value={phone}
              onChange={handlePhoneChange}
            />
            {phone.length > 0 && phone.length < 7 && (
              <p className="text-[10px] text-amber-400/80 pl-1">Mínimo 7 dígitos con código de país</p>
            )}
          </div>

          {/* Message selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
              Mensaje de Bienvenida
            </label>
            <div className="grid gap-2">
              {DEFAULT_MESSAGES.map((msg, i) => {
                const isSelected = message === msg
                return (
                  <button
                    key={i}
                    disabled={status === "loading" || status === "saving"}
                    onClick={() => handleMessageSelect(msg)}
                    className={cn(
                      "text-left p-3 rounded-xl border text-xs transition-all duration-200 disabled:opacity-40",
                      isSelected
                        ? "border-primary/40 bg-primary/20 text-foreground"
                        : "border-white/5 bg-black/20 text-muted-foreground hover:bg-black/40"
                    )}
                  >
                    &quot;{msg}&quot;
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status badge */}
          <StatusBadge status={status} error={errorMsg} phone={phone} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status, error, phone }: { status: SaveStatus; error: string | null; phone: string }) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/20 border border-white/5 p-3">
        <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
        <p className="text-[10px] text-muted-foreground font-medium">Cargando configuración…</p>
      </div>
    )
  }

  if (status === "saving") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/20 border border-white/5 p-3">
        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
        <p className="text-[10px] text-primary/80 font-medium">Guardando…</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
        <p className="text-[10px] text-red-400 font-medium">
          {error ?? "Error al guardar. Intenta de nuevo."}
        </p>
      </div>
    )
  }

  if (status === "saved") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        <p className="text-[10px] text-emerald-500/80 font-medium">
          Número guardado correctamente. Tu fase final usará este número.
        </p>
      </div>
    )
  }

  // idle: show hint if no phone set yet
  if (!phone || phone.length < 7) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-[10px] text-amber-500/80 font-medium">
          Sin número configurado — tu botón final usará un número de respaldo. Ingresa tu número para personalizarlo.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
      <Check className="h-3.5 w-3.5 text-emerald-500" />
      <p className="text-[10px] text-emerald-500/80 font-medium">
        Configuración activa. Escribe para actualizar, el guardado es automático.
      </p>
    </div>
  )
}
