"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  LogOut,
  Zap,
  Clock,
  CalendarCheck,
  CalendarX,
  Shield,
  AlertTriangle,
} from "lucide-react"

type ConnectStatus = "loading" | "idle" | "connecting" | "connected" | "error"

export function IntegrationGoogleCalendar() {
  const [status, setStatus] = useState<ConnectStatus>("loading")
  const [connectedEmail, setConnectedEmail] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Check status on mount and after OAuth redirect
  useEffect(() => {
    // Check URL params from OAuth callback redirect
    const params = new URLSearchParams(window.location.search)
    const googleResult = params.get("google")

    if (googleResult === "success") {
      const email = params.get("email") || ""
      setConnectedEmail(decodeURIComponent(email))
      setStatus("connected")
      // Clean URL
      window.history.replaceState({}, "", "/admin/integraciones")
      return
    }

    if (googleResult === "error") {
      const reason = params.get("reason") || "Error desconocido"
      setErrorMsg(reason === "access_denied" ? "Acceso denegado. Debes autorizar los permisos." : `Error: ${reason}`)
      setStatus("error")
      window.history.replaceState({}, "", "/admin/integraciones")
      return
    }

    // Check current status via API
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/integrations/google?action=status")
      const data = await res.json()
      if (data.connected) {
        setConnectedEmail(data.email || "")
        setStatus("connected")
      } else {
        setStatus("idle")
      }
    } catch {
      setStatus("idle")
    }
  }

  const handleConnect = async () => {
    setStatus("connecting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/integrations/google")
      const data = await res.json()

      if (data.error) {
        setErrorMsg(data.error)
        setStatus("error")
        return
      }

      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url
      }
    } catch {
      setErrorMsg("No se pudo iniciar la conexion. Intenta de nuevo.")
      setStatus("error")
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch("/api/integrations/google", { method: "DELETE" })
    } catch {
      // Continue anyway
    }
    setStatus("idle")
    setConnectedEmail("")
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Google Calendar</h2>
            <p className="text-xs text-muted-foreground">Verificando conexion...</p>
          </div>
        </div>
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
          <Calendar className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Google Calendar</h2>
          <p className="text-xs text-muted-foreground">Sincroniza citas y reservas con tu calendario</p>
        </div>
        {status === "connected" && (
          <Badge variant="outline" className="ml-auto border-blue-500/30 bg-blue-500/10 text-blue-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
          </Badge>
        )}
      </div>

      {/* Connection Card */}
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          {status === "idle" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Conecta tu Google Calendar</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Haz clic para autorizar acceso. Si tienes tu cuenta de Google abierta en el navegador, se conecta al instante.
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary hover:shadow-md"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Conectar con Google
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                Requiere: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Vars
              </p>
            </>
          )}

          {status === "connecting" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Redirigiendo a Google...</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Se abrira la pantalla de autorizacion de Google.
                </p>
              </div>
            </>
          )}

          {status === "connected" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                <CheckCircle2 className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Google Calendar conectado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuenta: <span className="font-medium text-blue-400">{connectedEmail}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleConnect}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reconectar
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" /> Desconectar
                </button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Error al conectar</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{errorMsg}</p>
              </div>
              <button
                onClick={handleConnect}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary hover:shadow-md"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Reintentar conexion
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup guide if not connected */}
      {(status === "idle" || status === "error") && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Configuracion requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
              <SetupStep number={1}>
                Ve a{" "}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  Google Cloud Console
                </a>{" "}
                y crea un proyecto
              </SetupStep>
              <SetupStep number={2}>Habilita la API de Google Calendar</SetupStep>
              <SetupStep number={3}>Crea credenciales OAuth 2.0 (tipo Web Application)</SetupStep>
              <SetupStep number={4}>
                En Authorized Redirect URIs agrega:{" "}
                <code className="rounded bg-card px-1.5 py-0.5 text-[10px] text-foreground">
                  {typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.com"}/api/integrations/google/callback
                </code>
              </SetupStep>
              <SetupStep number={5}>Agrega GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en la seccion Vars del sidebar</SetupStep>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What it does */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-blue-500" />
            Que hace esta integracion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <FeatureItem icon={<CalendarCheck className="h-3.5 w-3.5 text-blue-500" />} title="Crea eventos automaticamente" desc="Cuando un lead agenda, se crea el evento en tu calendario" />
            <FeatureItem icon={<Clock className="h-3.5 w-3.5 text-blue-500" />} title="Disponibilidad en tiempo real" desc="Muestra solo los horarios donde estas libre" />
            <FeatureItem icon={<CalendarX className="h-3.5 w-3.5 text-blue-500" />} title="Cancelaciones sincronizadas" desc="Si cancelas en Google, se actualiza en el CRM" />
            <FeatureItem icon={<Shield className="h-3.5 w-3.5 text-blue-500" />} title="Recordatorios por email" desc="Google envia recordatorios antes de cada reunion" />
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-foreground">Conexion segura via OAuth 2.0</p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Nunca almacenamos tu contrasena. Solo pedimos los permisos necesarios para leer y crear eventos. Puedes revocar el acceso desde tu cuenta de Google en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-secondary/20 p-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-[10px] leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function SetupStep({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">{number}</span>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}
