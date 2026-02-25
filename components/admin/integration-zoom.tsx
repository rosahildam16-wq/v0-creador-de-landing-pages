"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  RefreshCw,
  CheckCircle2,
  XCircle,
  LogOut,
  Zap,
  Users,
  Link2,
  MonitorPlay,
  Shield,
  AlertTriangle,
} from "lucide-react"

type ConnectStatus = "loading" | "idle" | "connecting" | "connected" | "error"

export function IntegrationZoom() {
  const [status, setStatus] = useState<ConnectStatus>("loading")
  const [connectedEmail, setConnectedEmail] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const zoomResult = params.get("zoom")

    if (zoomResult === "success") {
      const email = params.get("email") || ""
      setConnectedEmail(decodeURIComponent(email))
      setStatus("connected")
      window.history.replaceState({}, "", "/admin/integraciones")
      return
    }

    if (zoomResult === "error") {
      const reason = params.get("reason") || "Error desconocido"
      setErrorMsg(reason === "access_denied" ? "Acceso denegado. Debes autorizar los permisos." : `Error: ${reason}`)
      setStatus("error")
      window.history.replaceState({}, "", "/admin/integraciones")
      return
    }

    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/integrations/zoom?action=status")
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
      const res = await fetch("/api/integrations/zoom")
      const data = await res.json()

      if (data.error) {
        setErrorMsg(data.error)
        setStatus("error")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setErrorMsg("No se pudo iniciar la conexion. Intenta de nuevo.")
      setStatus("error")
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch("/api/integrations/zoom", { method: "DELETE" })
    } catch {
      // Continue
    }
    setStatus("idle")
    setConnectedEmail("")
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D8CFF]/10">
            <Video className="h-5 w-5 text-[#2D8CFF]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Zoom</h2>
            <p className="text-xs text-muted-foreground">Verificando conexion...</p>
          </div>
        </div>
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-[#2D8CFF]" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D8CFF]/10">
          <Video className="h-5 w-5 text-[#2D8CFF]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Zoom</h2>
          <p className="text-xs text-muted-foreground">Crea reuniones de Zoom automaticamente para tus citas</p>
        </div>
        {status === "connected" && (
          <Badge variant="outline" className="ml-auto border-[#2D8CFF]/30 bg-[#2D8CFF]/10 text-[#2D8CFF]">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
          </Badge>
        )}
      </div>

      {/* Connection Card */}
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          {status === "idle" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D8CFF]/10">
                <Video className="h-8 w-8 text-[#2D8CFF]" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Conecta tu cuenta de Zoom</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Haz clic para autorizar acceso. Si tienes tu cuenta de Zoom abierta en el navegador, se conecta al instante.
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="flex items-center gap-3 rounded-xl bg-[#2D8CFF] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#2D8CFF]/90 hover:shadow-md"
              >
                <Video className="h-5 w-5" />
                Conectar con Zoom
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                Requiere: ZOOM_CLIENT_ID y ZOOM_CLIENT_SECRET en Vars
              </p>
            </>
          )}

          {status === "connecting" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D8CFF]/10">
                <RefreshCw className="h-8 w-8 animate-spin text-[#2D8CFF]" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Redirigiendo a Zoom...</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Se abrira la pantalla de autorizacion de Zoom.
                </p>
              </div>
            </>
          )}

          {status === "connected" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D8CFF]/10">
                <CheckCircle2 className="h-8 w-8 text-[#2D8CFF]" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Zoom conectado</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuenta: <span className="font-medium text-[#2D8CFF]">{connectedEmail}</span>
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
                className="flex items-center gap-3 rounded-xl bg-[#2D8CFF] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#2D8CFF]/90 hover:shadow-md"
              >
                <Video className="h-5 w-5" />
                Reintentar conexion
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup guide */}
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
                <a href="https://marketplace.zoom.us/develop/create" target="_blank" rel="noopener noreferrer" className="text-[#2D8CFF] underline">
                  Zoom App Marketplace
                </a>{" "}
                y crea una app tipo OAuth
              </SetupStep>
              <SetupStep number={2}>Selecciona {"\"User-managed app\""} y completa la informacion basica</SetupStep>
              <SetupStep number={3}>
                En Redirect URL agrega:{" "}
                <code className="rounded bg-card px-1.5 py-0.5 text-[10px] text-foreground">
                  {typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.com"}/api/integrations/zoom/callback
                </code>
              </SetupStep>
              <SetupStep number={4}>En Scopes agrega: meeting:write:admin, user:read:admin</SetupStep>
              <SetupStep number={5}>Agrega ZOOM_CLIENT_ID y ZOOM_CLIENT_SECRET en la seccion Vars del sidebar</SetupStep>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What it does */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-[#2D8CFF]" />
            Que hace esta integracion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <FeatureItem icon={<Link2 className="h-3.5 w-3.5 text-[#2D8CFF]" />} title="Link automatico por cita" desc="Cada cita genera un link de Zoom unico" />
            <FeatureItem icon={<Users className="h-3.5 w-3.5 text-[#2D8CFF]" />} title="Envio al lead" desc="El link se envia por WhatsApp/email via workflow" />
            <FeatureItem icon={<MonitorPlay className="h-3.5 w-3.5 text-[#2D8CFF]" />} title="Grabacion automatica" desc="Graba las reuniones para seguimiento" />
            <FeatureItem icon={<Shield className="h-3.5 w-3.5 text-[#2D8CFF]" />} title="Sala de espera" desc="Controla quien entra a la reunion" />
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-foreground">Conexion segura via OAuth 2.0</p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Nunca almacenamos tu contrasena. Puedes revocar el acceso en cualquier momento desde tu cuenta de Zoom en zoom.us/profile.
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
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D8CFF]/10 text-[10px] font-bold text-[#2D8CFF]">{number}</span>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}
