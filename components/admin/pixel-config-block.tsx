"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Target, CheckCircle2, XCircle, Eye, Loader2, ExternalLink } from "lucide-react"

interface Props {
    embudoId: string
    embudoNombre: string
}

export function PixelConfigBlock({ embudoId, embudoNombre }: Props) {
    const [pixelId, setPixelId] = useState("")
    const [pixelToken, setPixelToken] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showConfig, setShowConfig] = useState(false)

    // Load existing config for this embudo
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/pixel/config?embudo_id=${embudoId}`)
                const data = await res.json()
                if (data.pixel_id && data.embudo_id === embudoId) {
                    setPixelId(data.pixel_id)
                    setPixelToken(data.pixel_token || "")
                    setIsConnected(data.enabled)
                }
            } catch { }
            setLoading(false)
        }
        load()
    }, [embudoId])

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
                    pixel_id: pixelId.trim(),
                    pixel_token: pixelToken.trim(),
                    enabled: true,
                }),
            })
            const result = await res.json()
            if (res.ok && result.success) {
                setIsConnected(true)
                setShowConfig(false)
                alert("✅ Pixel configurado para este embudo. Los eventos se dispararán automáticamente.")
            } else {
                alert(`❌ Error: ${result.error || "Error desconocido"}${result.sql ? "\n\nEjecuta este SQL en Supabase:\n" + result.sql : ""}`)
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
        <Card className="border-border/50">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Target className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold">Meta Pixel</h3>
                                {isConnected ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                                        <CheckCircle2 className="h-3 w-3" /> Conectado
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                        <XCircle className="h-3 w-3" /> Desconectado
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isConnected
                                    ? `Pixel ${pixelId} activo — trackea Lead, CompleteRegistration y Contact`
                                    : "Conecta tu Pixel para trackear conversiones de este embudo"
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
                            <p className="text-xs text-blue-300/80 leading-relaxed">
                                <strong>Igual que en Hotmart:</strong> Coloca tu Pixel ID y automáticamente se trackean estos eventos en tu embudo:
                            </p>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                <div className="rounded-lg bg-black/30 p-2 text-center">
                                    <p className="text-[10px] font-bold text-blue-400">PageView</p>
                                    <p className="text-[9px] text-muted-foreground">Al entrar</p>
                                </div>
                                <div className="rounded-lg bg-black/30 p-2 text-center">
                                    <p className="text-[10px] font-bold text-emerald-400">Lead</p>
                                    <p className="text-[9px] text-muted-foreground">Al registrarse</p>
                                </div>
                                <div className="rounded-lg bg-black/30 p-2 text-center">
                                    <p className="text-[10px] font-bold text-purple-400">Contact</p>
                                    <p className="text-[9px] text-muted-foreground">WhatsApp CTA</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Identificador del conjunto de datos (ID)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: 1300015961977903"
                                    value={pixelId}
                                    onChange={(e) => setPixelId(e.target.value)}
                                    className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                />
                                <p className="text-[9px] text-muted-foreground/60">
                                    Copia el ID numérico de tu conjunto de datos en Meta.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Token de acceso (API de Conversiones)
                                </label>
                                <input
                                    type="password"
                                    placeholder="EAAPe..."
                                    value={pixelToken}
                                    onChange={(e) => setPixelToken(e.target.value)}
                                    className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                />
                                <p className="text-[9px] text-muted-foreground/60">
                                    El token que empieza por EAA... que generas en el Administrador de Eventos.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "💎 Guardar y Activar Pixel"}
                            </button>
                            {isConnected && (
                                <button
                                    onClick={handleDisconnect}
                                    disabled={saving}
                                    className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                                >
                                    Desconectar
                                </button>
                            )}
                            <a
                                href="https://business.facebook.com/events_manager"
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                            >
                                Abrir Events Manager <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                )}

                {isConnected && !showConfig && (
                    <div className="mt-3 flex items-center gap-4 border-t border-border/30 pt-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Eye className="h-3 w-3 text-blue-400" />
                            <span>3 eventos activos</span>
                        </div>
                        <div className="flex gap-1.5">
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">PageView</span>
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">Lead</span>
                            <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-400">Contact</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
