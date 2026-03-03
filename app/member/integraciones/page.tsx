"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    MessageSquare,
    Calendar,
    Video,
    Plug,
    Check,
    Loader2,
    AlertCircle,
    ExternalLink,
    Settings
} from "lucide-react"

type IntegrationProvider = "whatsapp" | "google" | "zoom"
type ConnectionStatus = "connected" | "disconnected" | "loading" | "config_needed"

interface IntegrationInfo {
    provider: IntegrationProvider
    name: string
    description: string
    icon: React.ReactNode
    accentColor: string
}

export default function MemberIntegrationsPage() {
    const { user } = useAuth()
    const [statuses, setStatuses] = useState<Record<IntegrationProvider, ConnectionStatus>>({
        whatsapp: "loading",
        google: "loading",
        zoom: "loading",
    })
    const [configErrors, setConfigErrors] = useState<Record<string, string>>({})
    const [loadingSettings, setLoadingSettings] = useState(true)

    const integrations: IntegrationInfo[] = [
        {
            provider: "whatsapp",
            name: "WhatsApp Reminders",
            description: "Envía recordatorios automáticos de citas por WhatsApp.",
            icon: <MessageSquare className="h-5 w-5 text-emerald-500" />,
            accentColor: "#22c55e",
        },
        {
            provider: "google",
            name: "Google Calendar",
            description: "Sincroniza tus citas con tu calendario personal de Google.",
            icon: <Calendar className="h-5 w-5 text-blue-500" />,
            accentColor: "#3b82f6",
        },
        {
            provider: "zoom",
            name: "Zoom Meetings",
            description: "Genera enlaces de reuniones de Zoom automáticamente para tus citas.",
            icon: <Video className="h-5 w-5 text-[#2D8CFF]" />,
            accentColor: "#2D8CFF",
        }
    ]

    useEffect(() => {
        async function fetchData() {
            setLoadingSettings(false)

            for (const provider of ["whatsapp", "google", "zoom"] as IntegrationProvider[]) {
                if (provider === "whatsapp") {
                    setStatuses(prev => ({ ...prev, whatsapp: "disconnected" }))
                    continue
                }

                try {
                    const res = await fetch(`/api/integrations/${provider}?action=status`)
                    const data = await res.json()
                    if (data.connected) {
                        setStatuses(prev => ({ ...prev, [provider]: "connected" }))
                    } else if (data.error && data.error.includes("Variables")) {
                        setStatuses(prev => ({ ...prev, [provider]: "config_needed" }))
                        setConfigErrors(prev => ({ ...prev, [provider]: data.error }))
                    } else {
                        setStatuses(prev => ({ ...prev, [provider]: "disconnected" }))
                    }
                } catch {
                    setStatuses(prev => ({ ...prev, [provider]: "disconnected" }))
                }
            }
        }

        fetchData()
    }, [user])

    const handleConnect = async (provider: IntegrationProvider) => {
        if (provider === "whatsapp") return

        try {
            const res = await fetch(`/api/integrations/${provider}`)
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else if (data.error) {
                if (data.error.includes("Variables")) {
                    setStatuses(prev => ({ ...prev, [provider]: "config_needed" }))
                    setConfigErrors(prev => ({ ...prev, [provider]: data.error }))
                } else {
                    alert(data.error)
                }
            }
        } catch (err) {
            console.error(err)
            alert("Error al iniciar conexión")
        }
    }

    const handleDisconnect = async (provider: IntegrationProvider) => {
        if (!confirm(`¿Estás seguro de desconectar ${provider}?`)) return

        try {
            const res = await fetch(`/api/integrations/${provider}`, { method: "DELETE" })
            if (res.ok) {
                setStatuses(prev => ({ ...prev, [provider]: "disconnected" }))
            }
        } catch (err) {
            console.error(err)
        }
    }

    const isAdmin = user?.role === "super_admin"

    if (loadingSettings) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Cargando integraciones...</p>
            </div>
        )
    }

    const needsConfig = Object.values(statuses).some(s => s === "config_needed")

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <Plug className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Integraciones</h1>
                </div>
                <p className="text-sm text-muted-foreground ml-13">
                    Conecta tus cuentas personales para automatizar tus citas y recordatorios.
                </p>
            </div>

            {/* Admin Setup Guide */}
            {needsConfig && isAdmin && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-amber-400" />
                        <h3 className="font-bold text-foreground">Configuración requerida</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Para habilitar las integraciones, necesitas crear credenciales OAuth en Google y Zoom, y agregarlas como variables de entorno en Vercel.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {statuses.google === "config_needed" && (
                            <div className="rounded-xl border border-border/30 bg-card/50 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-semibold text-foreground">Google Calendar</span>
                                </div>
                                <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                                    <li>Ve a Google Cloud Console</li>
                                    <li>Crea un proyecto &quot;Magic Funnel&quot;</li>
                                    <li>Habilita Google Calendar API</li>
                                    <li>Crea credenciales OAuth 2.0</li>
                                    <li>Redirect URI: <code className="text-primary text-[10px]">https://magicfunnel.app/api/integrations/google/callback</code></li>
                                </ol>
                                <a
                                    href="https://console.cloud.google.com/apis/credentials"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Google Console
                                </a>
                            </div>
                        )}
                        {statuses.zoom === "config_needed" && (
                            <div className="rounded-xl border border-border/30 bg-card/50 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4 text-[#2D8CFF]" />
                                    <span className="text-sm font-semibold text-foreground">Zoom Meetings</span>
                                </div>
                                <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                                    <li>Ve a Zoom App Marketplace</li>
                                    <li>Develop → Build App → OAuth</li>
                                    <li>Nombre: &quot;Magic Funnel&quot;</li>
                                    <li>Copia Client ID y Secret</li>
                                    <li>Redirect URL: <code className="text-primary text-[10px]">https://magicfunnel.app/api/integrations/zoom/callback</code></li>
                                </ol>
                                <a
                                    href="https://marketplace.zoom.us/develop/create"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D8CFF]/10 border border-[#2D8CFF]/20 px-3 py-1.5 text-xs font-semibold text-[#2D8CFF] hover:bg-[#2D8CFF]/20 transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Zoom Marketplace
                                </a>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                        Variables para Vercel: <code className="text-primary/80">GOOGLE_CLIENT_ID</code>, <code className="text-primary/80">GOOGLE_CLIENT_SECRET</code>, <code className="text-primary/80">ZOOM_CLIENT_ID</code>, <code className="text-primary/80">ZOOM_CLIENT_SECRET</code>
                    </p>
                </div>
            )}

            <div className="grid gap-6">
                {integrations.map((item) => {
                    const status = statuses[item.provider]

                    return (
                        <Card
                            key={item.provider}
                            className="group relative overflow-hidden rounded-3xl border border-border/30 bg-card/40 backdrop-blur-sm transition-all hover:border-border/60"
                        >
                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.03] transition-opacity group-hover:opacity-[0.05]" style={{ backgroundColor: item.accentColor }} />

                            <CardContent className="flex flex-col p-6 sm:flex-row sm:items-center sm:justify-between gap-6">
                                <div className="flex items-start gap-4 sm:items-center">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-foreground shadow-inner">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-foreground">{item.name}</h3>
                                            {status === "config_needed" && (
                                                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                                                    <AlertCircle className="h-2.5 w-2.5" />
                                                    Config
                                                </span>
                                            )}
                                        </div>
                                        <p className="max-w-md text-sm text-muted-foreground font-medium italic">
                                            {status === "config_needed" && !isAdmin
                                                ? "Próximamente disponible. Tu administrador está configurando esta integración."
                                                : item.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:items-end">
                                    {status === "loading" ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    ) : status === "connected" ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 border border-emerald-500/20">
                                                <Check className="h-3.5 w-3.5" /> CONECTADO
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-lg text-xs text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDisconnect(item.provider)}
                                            >
                                                Desconectar
                                            </Button>
                                        </div>
                                    ) : status === "config_needed" ? (
                                        <Button
                                            className="rounded-xl px-8 opacity-50 cursor-not-allowed"
                                            disabled
                                        >
                                            Pendiente de config
                                        </Button>
                                    ) : item.provider === "whatsapp" ? (
                                        <Button
                                            className="rounded-xl px-8 opacity-60"
                                            disabled
                                        >
                                            Próximamente
                                        </Button>
                                    ) : (
                                        <Button
                                            className="rounded-xl px-8 shadow-lg shadow-primary/20"
                                            onClick={() => handleConnect(item.provider)}
                                        >
                                            Conectar {item.name.split(" ")[0]}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
