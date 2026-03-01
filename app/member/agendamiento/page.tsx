"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMemberData } from "@/lib/team-data"
import {
    CalendarCheck,
    CalendarDays,
    Clock,
    Plus,
    Settings2,
    ExternalLink,
    Copy,
    Check,
    Video,
    User,
    MoreVertical,
    Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AgendamientoPage() {
    const { user } = useAuth()
    const [copied, setCopied] = useState(false)
    const [bookingUrl, setBookingUrl] = useState(`https://magicfunnel.app/book/${user?.username || "socio"}`)
    const [isEditingLink, setIsEditingLink] = useState(false)
    const [communitySettings, setCommunitySettings] = useState<any>(null)
    const [integrationsStatus, setIntegrationsStatus] = useState({ zoom: false, calendar: false })

    useEffect(() => {
        if (!user?.communityId) return

        async function loadConfig() {
            try {
                const res = await fetch(`/api/communities?communityId=${user?.communityId}`)
                const data = await res.json()
                const comm = data.communities.find((c: any) => c.id === user?.communityId)
                setCommunitySettings(comm?.settings || {})

                // Real integration check
                const [gRes, zRes] = await Promise.all([
                    fetch("/api/integrations/google?action=status"),
                    fetch("/api/integrations/zoom?action=status")
                ])
                const gData = await gRes.json()
                const zData = await zRes.json()

                setIntegrationsStatus({
                    calendar: gData.connected,
                    zoom: zData.connected
                })
            } catch (err) {
                console.error(err)
            }
        }
        loadConfig()
    }, [user])

    // Demo data for appointments
    const appointments = [
        {
            id: "1",
            name: "Carlos Mendoza",
            date: "Mañana, 10:30 AM",
            type: "Estrategia Reset",
            platform: "Google Meet",
            status: "confirmed"
        },
        {
            id: "2",
            name: "Laura Sofia",
            date: "Jueves, 3:00 PM",
            type: "Cierre de Venta",
            platform: "WhatsApp",
            status: "pending"
        }
    ]

    const handleCopy = () => {
        navigator.clipboard.writeText(bookingUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (communitySettings && communitySettings.agenda_enabled === false) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                    <CalendarDays className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground mb-4">
                    ESTA FUNCIÓN ESTÁ <span className="text-amber-500">RESTRINGIDA</span>
                </h2>
                <p className="max-w-md text-sm font-medium text-muted-foreground leading-relaxed balance mb-8">
                    Tu comunidad no tiene habilitado el módulo de Agenda. Por favor contacta al administrador de tu comunidad para solicitar el acceso.
                </p>
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-2xl border border-border/40">
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Admin Only</Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Community Permission Required</span>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            <CalendarCheck className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Citas</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl border-border/40" onClick={() => setIsEditingLink(!isEditingLink)}>
                            <Settings2 className="mr-2 h-4 w-4" /> Configurar Link
                        </Button>
                        <Button className="rounded-xl shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Cita
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground ml-13">
                    Configura tu disponibilidad y gestiona tus reuniones con prospectos calificados.
                </p>
            </div>

            {isEditingLink && (
                <Card className="border-primary/30 bg-primary/[0.02] rounded-3xl animate-in fade-in slide-in-from-top-4">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 className="text-sm font-bold">Vincular Servicio Externo</h3>
                                    <p className="text-[11px] text-muted-foreground font-medium">Puedes usar una URL de Calendly, GoHighLevel o tu propio sistema.</p>
                                </div>
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    <Globe className="mr-1 h-3 w-3" /> Sincronizado
                                </Badge>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={bookingUrl}
                                    onChange={(e) => setBookingUrl(e.target.value)}
                                    className="flex-1 bg-black/20 border border-border/40 rounded-xl px-4 py-2 text-xs focus:border-primary focus:outline-none transition-colors"
                                    placeholder="https://calendly.com/tu-usuario"
                                />
                                <Button className="rounded-xl" onClick={() => setIsEditingLink(false)}>Guardar Cambios</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quick Actions & Links */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card className="border-primary/20 bg-primary/5 rounded-3xl overflow-hidden relative group">
                        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />
                        <CardHeader className="pb-3 pt-6 px-6">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-primary" /> Mi Link de Agendamiento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            <p className="text-[11px] text-muted-foreground mb-4 font-medium uppercase tracking-wider">Úsalo en tus mensajes de cierre</p>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex-1 overflow-hidden rounded-xl border border-white/5 bg-black/40 px-3 py-2.5">
                                    <span className="text-[10px] font-mono text-primary/70 truncate block">
                                        {bookingUrl}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                                        copied
                                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                            : "border-white/5 bg-white/[0.05] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                    )}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>

                            <div className="grid gap-2">
                                <Button variant="outline" className="w-full justify-start rounded-xl text-xs h-10 border-white/5 bg-white/[0.02] hover:bg-white/[0.05]">
                                    <ExternalLink className="mr-2 h-3.5 w-3.5 text-primary" /> Ver Página Pública
                                </Button>
                                <Button variant="outline" className="w-full justify-start rounded-xl text-xs h-10 border-white/5 bg-white/[0.02] hover:bg-white/[0.05]">
                                    <Clock className="mr-2 h-3.5 w-3.5 text-amber-500" /> Mi Disponibilidad
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-card/40 rounded-3xl overflow-hidden">
                        <CardHeader className="p-6">
                            <CardTitle className="text-sm font-bold">Resumen de Actividad</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Citas este mes</span>
                                <span className="text-sm font-bold">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Tasa de asistencia</span>
                                <span className="text-sm font-bold text-emerald-400">85%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Plataforma favorita</span>
                                <span className="text-sm font-bold">Meet / WhatsApp</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Appointments List & Calendar Preview */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" /> Próximas Citas
                        </h2>
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                            2 pendientes hoy
                        </Badge>
                    </div>

                    <div className="grid gap-4">
                        {appointments.map((apt) => (
                            <Card key={apt.id} className="border-border/10 bg-card/30 rounded-3xl group hover:border-primary/20 transition-all">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
                                                    <User className="h-6 w-6 text-primary" />
                                                </div>
                                                {apt.status === "confirmed" && (
                                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                                                        <Check className="h-2.5 w-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground">{apt.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {apt.date}
                                                    </span>
                                                    <span className="text-[11px] text-primary flex items-center gap-1 font-bold">
                                                        <Video className="h-3 w-3" /> {apt.platform}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                "text-[10px] font-bold",
                                                apt.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            )}>
                                                {apt.status === "confirmed" ? "Confirmada" : "Pendiente"}
                                            </Badge>
                                            <button className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-muted-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Availability Preview Mockup */}
                    <Card className="border-border/20 bg-card/20 rounded-3xl flex-1 mt-4">
                        <CardHeader className="p-6">
                            <CardTitle className="text-sm font-bold">Configuración de Agendamiento</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6">
                            {(communitySettings?.zoom_enabled && !integrationsStatus.zoom) && (
                                <div className="flex items-center justify-between rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <Video className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">Zoom no conectado</p>
                                            <p className="text-[10px] text-muted-foreground">Tus citas no tendrán enlaces de reunión automáticos.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold border-amber-500/20 text-amber-500 hover:bg-amber-500/10" asChild>
                                        <a href="/member/integraciones">Conectar</a>
                                    </Button>
                                </div>
                            )}

                            {(communitySettings?.calendar_enabled && !integrationsStatus.calendar) && (
                                <div className="flex items-center justify-between rounded-2xl bg-blue-500/5 border border-blue-500/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">Calendario no sincronizado</p>
                                            <p className="text-[10px] text-muted-foreground">Las citas nuevas no aparecerán en tu Google Calendar.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold border-blue-500/20 text-blue-500 hover:bg-blue-500/10" asChild>
                                        <a href="/member/integraciones">Sincronizar</a>
                                    </Button>
                                </div>
                            )}

                            <div className="aspect-[21/9] w-full bg-black/20 rounded-2xl flex flex-col items-center justify-center gap-3 border border-dashed border-white/5">
                                <CalendarDays className="h-8 w-8 text-muted-foreground/20" />
                                <p className="text-[10px] text-muted-foreground/50 italic font-medium">Panel de Disponibilidad Semanal</p>
                                <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-primary/20 text-primary/60">
                                    Módulo Activo
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
