"use client"

import { useState, useEffect } from "react"
import { BarChart3, Settings2, Facebook, TrendingUp, DollarSign, Target, MousePointer2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import useSWR from "swr"

interface MetaInsights {
    impressions: string
    clicks: string
    spend: string
    reach: string
    cpc: string
    cpm: string
    ctr: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MetaAdsSection({ memberId }: { memberId: string }) {
    const [showConfig, setShowConfig] = useState(false)
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState({
        adAccountId: "",
        accessToken: "",
        pixelId: "",
    })

    const { data, error, mutate, isLoading } = useSWR(
        memberId ? `/api/meta/insights?memberId=${memberId}` : null,
        fetcher
    )

    const isConfigured = data?.configured

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch("/api/meta/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, ...config }),
            })
            if (res.ok) {
                toast.success("Configuración de Meta Ads guardada")
                setShowConfig(false)
                mutate()
            } else {
                toast.error("Error al guardar configuración")
            }
        } catch (err) {
            toast.error("Error de conexión")
        } finally {
            setLoading(false)
        }
    }

    if (isLoading) return (
        <div className="h-40 flex items-center justify-center rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
    )

    if (!isConfigured && !showConfig) {
        return (
            <Card className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm">
                <div className="flex flex-col items-center justify-center gap-4 text-center py-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Facebook className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Meta Ads no conectado</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            Conecta tu cuenta publicitaria para ver tus métricas de gasto y CPL aquí mismo.
                        </p>
                    </div>
                    <Button onClick={() => setShowConfig(true)} variant="outline" className="gap-2">
                        <Settings2 className="h-4 w-4" /> Conectar Meta Ads
                    </Button>
                </div>
            </Card>
        )
    }

    if (showConfig) {
        return (
            <Card className="rounded-2xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-primary" /> Configuración de Meta Ads
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)}>Cancelar</Button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="adAccountId">Ad Account ID</Label>
                        <Input
                            id="adAccountId"
                            placeholder="Ej: act_12345678"
                            value={config.adAccountId}
                            onChange={(e) => setConfig({ ...config, adAccountId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accessToken">User Access Token</Label>
                        <Input
                            id="accessToken"
                            type="password"
                            placeholder="Pega tu token de acceso aquí"
                            value={config.accessToken}
                            onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar Integración"}
                    </Button>
                </form>
            </Card>
        )
    }

    const insights: MetaInsights | null = data?.data

    return (
        <Card className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/50 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Métricas de Meta Ads</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Últimos 30 días</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowConfig(true)}>
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>

            {!insights ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 opacity-60">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm">Sin datos para mostrar todavía</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> Inversión
                            </span>
                            <span className="text-xl font-bold text-foreground">${parseFloat(insights.spend).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <MousePointer2 className="h-3 w-3" /> CPC
                            </span>
                            <span className="text-xl font-bold text-foreground">${parseFloat(insights.cpc).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Target className="h-3 w-3" /> Impresiones
                            </span>
                            <span className="text-xl font-bold text-foreground">{parseInt(insights.impressions).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-emerald-500" /> CTR
                            </span>
                            <span className="text-xl font-bold text-emerald-500">{parseFloat(insights.ctr).toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Decorative background logo */}
            <Facebook className="absolute -bottom-6 -right-6 h-24 w-24 text-blue-500/5 rotate-12" />
        </Card>
    )
}
