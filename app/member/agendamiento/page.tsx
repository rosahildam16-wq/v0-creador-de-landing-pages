"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import useSWR, { mutate } from "swr"
import {
    CalendarCheck, CalendarDays, Clock, Plus, Copy, Check,
    Eye, Trash2, ToggleLeft,
    ToggleRight, Users, CalendarPlus, XCircle, Loader2,
    CheckCircle2, UserX, RefreshCw, ChevronDown, Phone, Video, MapPin, Link as LinkIcon
} from "lucide-react"
import Link from "next/link"
import { BOOKING_STATUS_CONFIG, LOCATION_TYPES, type BookingCalendar, type Booking } from "@/lib/booking"

const fetcher = (url: string) => fetch(url).then(r => r.json())

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}

function formatTime(iso: string, tz?: string) {
    return new Date(iso).toLocaleTimeString("es-MX", {
        hour: "2-digit", minute: "2-digit", hour12: true,
        timeZone: tz || "America/Mexico_City"
    })
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-MX", {
        weekday: "short", day: "numeric", month: "short"
    })
}

// Static status badge classes — Tailwind cannot purge dynamic class strings like bg-${color}-500
const STATUS_CLASSES: Record<string, string> = {
    confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    rescheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    no_show: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
}

type Tab = "calendars" | "appointments"

export default function BookingDashboard() {
    const { user } = useAuth()
    const [tab, setTab] = useState<Tab>("calendars")
    const [copied, setCopied] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDuration, setNewDuration] = useState(30)
    const [newLocation, setNewLocation] = useState("google_meet")
    const [view, setView] = useState<"today" | "week" | "month">("week")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const { data: calData, isLoading: calLoading } = useSWR("/api/booking/calendars", fetcher)
    const { data: aptData, isLoading: aptLoading } = useSWR(
        `/api/booking/appointments?view=${view}`, fetcher
    )

    const calendars: (BookingCalendar & { total_bookings: number; upcoming_bookings: number })[] = calData?.calendars || []
    const appointments: Booking[] = aptData?.appointments || []
    const stats = aptData?.stats || { total: 0, confirmed: 0, cancelled: 0, no_show: 0 }

    const handleCopy = (slug: string) => {
        const url = `${window.location.origin}/book/${slug}`
        navigator.clipboard.writeText(url)
        setCopied(slug)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleCreate = async () => {
        if (!newName.trim()) return
        setCreating(true)
        try {
            const res = await fetch("/api/booking/calendars", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, duration_minutes: newDuration, location_type: newLocation }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
            setShowNew(false)
            setNewName("")
            mutate("/api/booking/calendars")
        } catch (err: any) {
            alert(`Error al crear calendario: ${err.message || "Error desconocido"}`)
        } finally {
            setCreating(false)
        }
    }

    const handleToggle = async (id: string, active: boolean) => {
        await fetch(`/api/booking/calendars/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: !active }),
        })
        mutate("/api/booking/calendars")
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este calendario y todas sus citas?")) return
        await fetch(`/api/booking/calendars/${id}`, { method: "DELETE" })
        mutate("/api/booking/calendars")
    }

    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        setUpdatingId(bookingId)
        try {
            const res = await fetch(`/api/booking/appointments/${bookingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data?.error || "Error al actualizar")
            }
            mutate(`/api/booking/appointments?view=${view}`)
        } catch (err: any) {
            alert(err.message || "Error al cambiar estado")
        } finally {
            setUpdatingId(null)
        }
    }

    const getLocationIcon = (type: string) => {
        switch (type) {
            case "google_meet": case "zoom": return Video
            case "whatsapp": return Phone
            case "presencial": return MapPin
            default: return LinkIcon
        }
    }

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                        <CalendarCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Citas</h1>
                        <p className="text-xs text-muted-foreground">Crea, configura y gestiona tus agendamientos</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)]"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Calendario
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-border/30 bg-card/30 p-1 w-fit">
                {([
                    { key: "calendars", label: "Calendarios", icon: CalendarDays },
                    { key: "appointments", label: "Citas", icon: CalendarCheck },
                ] as const).map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                            tab === t.key
                                ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-500/20 text-white border border-violet-500/20 shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* New Calendar Modal */}
            {showNew && (
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                                <CalendarPlus className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Nuevo Calendario</h3>
                                <p className="text-[11px] text-muted-foreground">Configura tu link de agendamiento</p>
                            </div>
                        </div>
                        <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
                            <XCircle className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-3">
                            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Nombre del calendario</label>
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Ej. Llamada de Estrategia"
                                className="w-full rounded-xl border border-border/30 bg-card/50 px-4 py-3 text-sm focus:border-violet-500/30 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Duración</label>
                            <select
                                value={newDuration}
                                onChange={e => setNewDuration(Number(e.target.value))}
                                className="w-full rounded-xl border border-border/30 bg-card/50 px-4 py-3 text-sm focus:border-violet-500/30 focus:outline-none transition-all appearance-none"
                            >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>1 hora</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Ubicación</label>
                            <select
                                value={newLocation}
                                onChange={e => setNewLocation(e.target.value)}
                                className="w-full rounded-xl border border-border/30 bg-card/50 px-4 py-3 text-sm focus:border-violet-500/30 focus:outline-none transition-all appearance-none"
                            >
                                {LOCATION_TYPES.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleCreate}
                                disabled={creating || !newName.trim()}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] disabled:opacity-50"
                            >
                                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TAB: Calendars ═══ */}
            {tab === "calendars" && (
                <div className="space-y-4">
                    {calLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : calendars.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 border border-violet-500/20">
                                <CalendarDays className="h-10 w-10 text-violet-400/60" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Sin calendarios</h2>
                            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                                Crea tu primer calendario para compartir tu link de agendamiento con tus prospectos.
                            </p>
                            <button
                                onClick={() => setShowNew(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white"
                            >
                                <Plus className="h-4 w-4" /> Crear primer calendario
                            </button>
                        </div>
                    ) : (
                        calendars.map(cal => {
                            const LocIcon = getLocationIcon(cal.location_type)
                            const locLabel = LOCATION_TYPES.find(l => l.value === cal.location_type)?.label || cal.location_type

                            return (
                                <div key={cal.id} className="group relative overflow-hidden rounded-2xl border border-border/20 bg-card/30 transition-all duration-300 hover:border-violet-500/20 hover:bg-card/50">
                                    <div className={cn(
                                        "absolute inset-x-0 top-0 h-0.5 transition-colors",
                                        cal.active ? "bg-gradient-to-r from-violet-600 to-fuchsia-500" : "bg-white/[0.06]"
                                    )} />
                                    <div className="p-5 sm:p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className={cn(
                                                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                                                    cal.active ? "bg-violet-500/10 text-violet-400" : "bg-white/[0.03] text-muted-foreground"
                                                )}>
                                                    <CalendarDays className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-base font-bold text-foreground truncate">{cal.name}</h3>
                                                        <span className={cn(
                                                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                                                            cal.active
                                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                                : "bg-white/[0.04] text-muted-foreground border-white/[0.06]"
                                                        )}>
                                                            {cal.active ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cal.duration_minutes} min</span>
                                                        <span className="flex items-center gap-1"><LocIcon className="h-3 w-3" /> {locLabel}</span>
                                                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {cal.upcoming_bookings} próximas</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button onClick={() => handleToggle(cal.id, cal.active)} title={cal.active ? "Desactivar" : "Activar"} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors text-muted-foreground">
                                                    {cal.active ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5" />}
                                                </button>
                                                <button onClick={() => handleDelete(cal.id)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-black/20 px-3 py-2">
                                                    <span className="truncate text-[11px] font-mono text-violet-400/60">
                                                        {typeof window !== "undefined" ? `${window.location.origin}/book/${cal.slug}` : `/book/${cal.slug}`}
                                                    </span>
                                                    <button onClick={() => handleCopy(cal.slug)} className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all", copied === cal.slug ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.05] text-muted-foreground hover:text-violet-400")}>
                                                        {copied === cal.slug ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <Link href={`/book/${cal.slug}`} target="_blank" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all">
                                                <Eye className="h-3.5 w-3.5" /> Probar
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* ═══ TAB: Appointments ═══ */}
            {tab === "appointments" && (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-1 rounded-lg border border-border/20 bg-card/20 p-0.5">
                            {(["today", "week", "month"] as const).map(v => (
                                <button key={v} onClick={() => setView(v)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-all", view === v ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" : "text-muted-foreground hover:text-foreground")}>
                                    {v === "today" ? "Hoy" : v === "week" ? "Semana" : "Mes"}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-400" /> {stats.confirmed} confirmadas</span>
                            <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-400" /> {stats.cancelled} canceladas</span>
                            <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-400" /> {stats.no_show} no asistieron</span>
                        </div>
                    </div>

                    {aptLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <CalendarCheck className="h-12 w-12 text-muted-foreground/20 mb-4" />
                            <p className="text-sm text-muted-foreground">
                                No hay citas {view === "today" ? "para hoy" : view === "week" ? "esta semana" : "este mes"}.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {appointments.map((apt: any) => {
                                const statusCls = STATUS_CLASSES[apt.status] || STATUS_CLASSES.confirmed
                                const StatusIcon = apt.status === "confirmed" ? CheckCircle2
                                    : apt.status === "cancelled" ? XCircle
                                    : apt.status === "no_show" ? UserX
                                    : apt.status === "rescheduled" ? RefreshCw
                                    : CheckCircle2
                                const statusLabel = BOOKING_STATUS_CONFIG[apt.status as keyof typeof BOOKING_STATUS_CONFIG]?.label || apt.status
                                const isExpanded = expandedId === apt.id
                                const isUpdating = updatingId === apt.id

                                return (
                                    <div key={apt.id} className="rounded-2xl border border-border/20 bg-card/30 overflow-hidden transition-all hover:border-violet-500/15">
                                        <div className="p-4 sm:p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/10">
                                                        <span className="text-sm font-bold text-violet-400">
                                                            {apt.guest_name?.charAt(0)?.toUpperCase() || "?"}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-bold text-foreground truncate">{apt.guest_name}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                            <span>{formatDate(apt.start_time)}</span>
                                                            <span className="text-violet-400 font-medium">{formatTime(apt.start_time, apt.calendar?.timezone)}</span>
                                                            {apt.calendar?.name && <span className="text-muted-foreground/50">· {apt.calendar.name}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border", statusCls)}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusLabel}
                                                    </span>
                                                    <button onClick={() => setExpandedId(isExpanded ? null : apt.id)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors text-muted-foreground">
                                                        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                                                    </button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-4 pt-4 border-t border-border/20 space-y-3 animate-in fade-in duration-200">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div><span className="text-muted-foreground">Email: </span><span className="text-foreground">{apt.guest_email}</span></div>
                                                        {apt.guest_phone && <div><span className="text-muted-foreground">Tel: </span><span className="text-foreground">{apt.guest_phone}</span></div>}
                                                    </div>
                                                    {apt.status !== "cancelled" && apt.status !== "completed" && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {apt.status !== "confirmed" && (
                                                                <button onClick={() => handleStatusChange(apt.id, "confirmed")} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                                                                    <CheckCircle2 className="h-3 w-3" /> Confirmar
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleStatusChange(apt.id, "no_show")} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-gray-500/10 border border-gray-500/20 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-500/20 transition-colors disabled:opacity-50">
                                                                <UserX className="h-3 w-3" /> No asistió
                                                            </button>
                                                            <button onClick={() => handleStatusChange(apt.id, "completed")} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                                                <CheckCircle2 className="h-3 w-3" /> Completada
                                                            </button>
                                                            <button onClick={() => { if (confirm("¿Cancelar esta cita?")) handleStatusChange(apt.id, "cancelled") }} disabled={isUpdating} className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                                                <XCircle className="h-3 w-3" /> Cancelar
                                                            </button>
                                                            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
