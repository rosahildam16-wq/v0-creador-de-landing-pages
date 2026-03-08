"use client"

import { useState } from "react"
import { Send, Monitor, Smartphone, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

type EmailType = "skalia" | "general"
type ViewSize = "desktop" | "mobile"

export default function EmailPreviewPage() {
  const [type, setType] = useState<EmailType>("skalia")
  const [view, setView] = useState<ViewSize>("desktop")
  const [name, setName] = useState("María García")
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const previewUrl = `/api/email-preview?type=${type}&name=${encodeURIComponent(name)}`

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(
        `/api/test-mail?type=${type}&to=${encodeURIComponent(testEmail)}&name=${encodeURIComponent(name)}`
      )
      const data = await res.json()
      if (res.ok && data.result?.success) {
        setResult({ ok: true, msg: `Email enviado a ${testEmail}` })
      } else {
        setResult({ ok: false, msg: data.result?.error || data.error || "Error desconocido" })
      }
    } catch {
      setResult({ ok: false, msg: "Error de red al enviar" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Preview de Emails de Bienvenida</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualiza y prueba los templates antes de que lleguen a los usuarios.
        </p>
      </div>

      <div className="flex gap-6 flex-col xl:flex-row">
        {/* ── LEFT: Preview ── */}
        <div className="flex-1 min-w-0">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* Template tabs */}
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setType("skalia")}
                className={`px-5 py-2 text-sm font-semibold transition-colors ${
                  type === "skalia"
                    ? "bg-purple-600 text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                ✦ Skalia VIP
              </button>
              <button
                onClick={() => setType("general")}
                className={`px-5 py-2 text-sm font-semibold transition-colors ${
                  type === "general"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                General
              </button>
            </div>

            {/* View size + refresh */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setView("desktop")}
                  className={`px-3 py-2 transition-colors ${
                    view === "desktop" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vista escritorio"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("mobile")}
                  className={`px-3 py-2 transition-colors ${
                    view === "mobile" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vista móvil"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Abrir en nueva pestaña
              </a>
            </div>
          </div>

          {/* iframe container */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-3">
                <div className="rounded-lg bg-background/60 px-3 py-1 text-xs text-muted-foreground font-mono">
                  {type === "skalia"
                    ? "¡Bienvenido a la Élite! Skalia + Magic Funnel 🚀"
                    : "¡Bienvenido a Magic Funnel! 🚀"}
                </div>
              </div>
            </div>

            {/* Email iframe */}
            <div
              className="flex justify-center bg-zinc-200 dark:bg-zinc-800 py-6 px-4"
              style={{ minHeight: "600px" }}
            >
              <iframe
                key={`${type}-${name}`}
                src={previewUrl}
                style={{
                  width: view === "mobile" ? "390px" : "640px",
                  minHeight: "580px",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
                  background: "#fff",
                  transition: "width 0.3s ease",
                }}
                title="Email preview"
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Send test panel ── */}
        <div className="w-full xl:w-80 shrink-0 space-y-5">
          {/* Template info */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Información del template</h3>
            {type === "skalia" ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Template</span>
                  <span className="text-purple-400 font-medium">Skalia VIP</span>
                </div>
                <div className="flex justify-between">
                  <span>Asunto</span>
                  <span className="text-foreground text-xs text-right max-w-[140px] leading-snug">
                    ¡Bienvenido a la Élite! Skalia + Magic Funnel 🚀
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Activado por</span>
                  <span className="text-foreground font-mono text-xs">community_id = skalia-vip</span>
                </div>
                <div className="flex justify-between">
                  <span>o código</span>
                  <span className="text-foreground font-mono text-xs">DIAMANTECELION</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Template</span>
                  <span className="text-blue-400 font-medium">General</span>
                </div>
                <div className="flex justify-between">
                  <span>Asunto</span>
                  <span className="text-foreground text-xs text-right max-w-[140px] leading-snug">
                    ¡Bienvenido a Magic Funnel! 🚀
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Activado por</span>
                  <span className="text-foreground text-xs">cualquier otro registro</span>
                </div>
              </div>
            )}
          </div>

          {/* Personalización */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Personalizar preview</h3>
            <label className="block text-xs text-muted-foreground mb-1.5">Nombre de prueba</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="María García"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-muted-foreground mt-2">
              El preview se actualiza al cambiar los tabs.
            </p>
          </div>

          {/* Enviar email de prueba */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Enviar email de prueba</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Recibe el email real en tu bandeja para ver cómo se ve en tu cliente de correo.
            </p>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Tu email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !testEmail}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Send className="h-4 w-4" />
                {sending ? "Enviando…" : "Enviar email de prueba"}
              </button>
            </form>

            {result && (
              <div
                className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-xs ${
                  result.ok
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {result.ok ? (
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <span>{result.msg}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
