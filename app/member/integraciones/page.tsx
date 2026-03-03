"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    MessageSquare,
    Calendar,
    Video,
    Plug,
    ExternalLink,
    Check,
    X,
    Loader2,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

type IntegrationProvider = "whatsapp" | "google" | "zoom"
type ConnectionStatus = "connected" | "disconnected" | "loading"

interface IntegrationInfo {
    provider: IntegrationProvider
    name: string
    description: string
    icon: React.ReactNode
    accentColor: string
    featureKey: "zoom_enabled" | "calendar_enabled" | "whatsapp_reminders_enabled"
}

export default function MemberIntegrationsPage() {
    const { user } = useAuth()
    const [statuses, setStatuses] = useState<Record<IntegrationProvider, ConnectionStatus>>({
        whatsapp: "loading",
        google: "loading",
        zoom: "loading",
    })

    const [communitySettings, setCommunitySettings] = useState<any>(null)
    const [loadingSettings, setLoadingSettings] = useState(true)

    const integrations: IntegrationInfo[] = [
        {
            provider: "whatsapp",
            name: "WhatsApp Reminders",
            description: "Envía recordatorios automáticos de citas por WhatsApp.",
            icon: <MessageSquare className="h-5 w-5 text-emerald-500" />,
            accentColor: "#22c55e",
            featureKey: "whatsapp_reminders_enabled"
        },
        {
            provider: "google",
            name: "Google Calendar",
            description: "Sincroniza tus citas con tu calendario personal de Google.",
            icon: <Calendar className="h-5 w-5 text-blue-500" />,
            accentColor: "#3b82f6",
            featureKey: "calendar_enabled"
        },
        {
            provider: "zoom",
            name: "Zoom Meetings",
            description: "Genera enlaces de reuniones de Zoom automáticamente para tus citas.",
            icon: <Video className="h-5 w-5 text-[#2D8CFF]" />,
            accentColor: "#2D8CFF",
            featureKey: "zoom_enabled"
        }
    ]

    useEffect(() => {
        async function fetchData() {
            if (!user?.communityId) return

            // Load community settings to see what's allowed
            try {
                const cRes = await fetch(`/api/communities?communityId=${user.communityId}`)
                const cData = await cRes.json()
                const community = cData.communities.find((c: any) => c.id === user.communityId)
                setCommunitySettings(community?.settings || {})
            } catch (err) {
                console.error("Error loading community settings:", err)
            } finally {
                setLoadingSettings(false)
            }

            // Check personal integration statuses
            for (const provider of ["whatsapp", "google", "zoom"] as IntegrationProvider[]) {
                if (provider === "whatsapp") {
                    setStatuses(prev => ({ ...prev, whatsapp: "disconnected" }))
                    continue
                }

                try {
                    const res = await fetch(`/api/integrations/${provider}?action=status`)
                    const data = await res.json()
                    setStatuses(prev => ({ ...prev, [provider]: data.connected ? "connected" : "disconnected" }))
                } catch {
                    setStatuses(prev => ({ ...prev, [provider]: "disconnected" }))
                }
            }
        }

        fetchData()
    }, [user])

    const handleConnect = async (provider: IntegrationProvider) => {
        if (provider === "whatsapp") {
            alert("Integración de WhatsApp próximamente disponible.")
            return
        }

        try {
            const res = await fetch(`/api/integrations/${provider}`)
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else if (data.error) {
                alert(data.error)
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

    if (loadingSettings) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Cargando integraciones...</p>
            </div>
        )
    }

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

            <div className="grid gap-6">
                {integrations.map((item) => {
                    const isEnabledByAdmin = communitySettings?.[item.featureKey]
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
                                        </div>
                                        <p className="max-w-md text-sm text-muted-foreground font-medium italic">
                                            {item.description}
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
