"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Target, CheckCircle2, XCircle, Eye, Loader2, ExternalLink, Info } from "lucide-react"

interface Props {
    embudoId: string
    embudoNombre: string
    memberId?: string // Defaults to 'admin'
}

export function PixelConfigBlock({ embudoId, embudoNombre, memberId = "admin" }: Props) {
    const [pixelId, setPixelId] = useState("")
    const [pixelToken, setPixelToken] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showConfig, setShowConfig] = useState(false)

    // Load existing config for this embudo and member
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const res = await fetch(`/api/pixel/config?embudo_id=${embudoId}&member_id=${memberId}`)
                const data = await res.json()

                // Only populate if the config belongs specifically to this member
                if (data.pixel_id && data.member_id === memberId) {
                    setPixelId(data.pixel_id)
                    setPixelToken(data.pixel_token || "")
                    setIsConnected(data.enabled)
                } else {
                    // Reset if it's a fallback or no config
                    setPixelId("")
                    setPixelToken("")
                    setIsConnected(false)
                }
            } catch { }
            setLoading(false)
        }
        load()
    }, [embudoId, memberId])

    const handleSave = async () => {
        if (!pixelId.trim()) {
            alert("Ingresa tu Pixel ID")
            return
        }
        setSaving(true)
        try {
            const res = await fetch("/api/pixel/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    embudo_id: embudoId,
                    member_id: memberId,
                    pixel_id: pixelId.trim(),
                    pixel_token: pixelToken.trim(),
                    enabled: true,
                }),
            })
            const result = await res.json()
            if (res.ok && result.success) {
                setIsConnected(true)
                setShowConfig(false)
                alert("✅ Pixel configurado correctamente. Los eventos se dispararán automáticamente en tus enlaces personales.")
            } else if (result.error?.includes("schema cache") || result.error?.includes("PGRST205")) {
                // Table exists but schema cache not refreshed — try setup endpoint
                await fetch("/api/pixel/setup").catch(() => { })
                // Wait a bit for schema to refresh, then retry once
                await new Promise(resolve => setTimeout(resolve, 2000))
                const retry = await fetch("/api/pixel/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        embudo_id: embudoId,
                        member_id: memberId,
                        pixel_id: pixelId.trim(),
                        pixel_token: pixelToken.trim(),
                        enabled: true,
                    }),
                })
                const retryResult = await retry.json()
                if (retry.ok && retryResult.success) {
                    setIsConnected(true)
                    setShowConfig(false)
                    alert("✅ Pixel configurado correctamente.")
                } else {
                    alert("⚠️ La base de datos necesita refrescar su caché. Por favor, espera 1 minuto y vuelve a intentarlo. Si el problema persiste, contacta al administrador.")
                }
            } else {
                alert(`❌ Error: ${result.error || "Error desconocido"}`)
            }
        } catch (e: any) {
            alert(`❌ Error: ${e.message}`)
        }
        setSaving(false)
    }

    const handleDisconnect = async () => {
        setSaving(true)
        try {
            await fetch("/api/pixel/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    embudo_id: embudoId,
                    member_id: memberId,
                    pixel_id: pixelId,
                    enabled: false,
                }),
            })
            setIsConnected(false)
        } catch { }
        setSaving(false)
    }

    if (loading) {
        return (
            <Card className="border-border/50">
                <CardContent className="flex items-center gap-3 p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Cargando configuración del Pixel...</span>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Target className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold">Meta Pixel Personal</h3>
                                {isConnected ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                                        <CheckCircle2 className="h-3 w-3" /> Conectado
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                        <XCircle className="h-3 w-3" /> Sin configurar
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isConnected
                                    ? `Pixel ${pixelId} activo para tus enlaces`
                                    : "Configura tu Pixel para trackear tus propias conversiones"
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        {showConfig ? "Cerrar" : isConnected ? "Editar" : "Configurar"}
                    </button>
                </div>

                {showConfig && (
                    <div className="mt-4 space-y-4 border-t border-border/30 pt-4">
                        <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                                <p className="text-xs text-blue-300/80 leading-relaxed">
                                    <strong>Efecto Hotmart:</strong> Al poner tu Pixel aquí, todos los eventos ocurridos en <u>tus enlaces de afiliado</u> se enviarán a tu cuenta de Meta. Si no pones nada, el sistema usará el Pixel del administrador.
                                </p>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                <div className="rounded-lg bg-black/30 p-2 text-center">
                                    <p className="text-[10px] font-bold text-blue-400">PageView</p>
                                    <p className="text-[9px] text-muted-foreground">Visita</p>
                                </div>
                                <div className="rounded-lg bg-black/30 p-2 text-center">
                                    <p className="text-[10px] font-bold text-emerald-400">Lead</p>
                                    <p className="text-[9px] text-muted-foreground">Registro</p>
                                </div>
                                <div className="rounded-lg bg-black/30 p-2 text-center">
                                    <p className="text-[10px] font-bold text-purple-400">Contact</p>
                                    <p className="text-[9px] text-muted-foreground">WhatsApp</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    ID del Conjunto de Datos (Meta Pixel)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: 1300015961977903"
                                    value={pixelId}
                                    onChange={(e) => setPixelId(e.target.value)}
                                    className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Token de Acceso (Opcional)
                                </label>
                                <input
                                    type="password"
                                    placeholder="EAAPe..."
                                    value={pixelToken}
                                    onChange={(e) => setPixelToken(e.target.value)}
                                    className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "🚀 Activar mi seguimiento"}
                            </button>
                            {isConnected && (
                                <button
                                    onClick={handleDisconnect}
                                    disabled={saving}
                                    className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                                >
                                    Eliminar
                                </button>
                            )}
                            <a
                                href="https://business.facebook.com/events_manager"
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                            >
                                Get Pixel ID <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

