"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarX2, CheckCircle2, AlertCircle, Loader2, Clock, Calendar } from "lucide-react"
import Link from "next/link"

interface BookingInfo {
    id: string
    status: string
    guest_name: string
    start_time: string
    end_time: string
    calendar_name: string
    timezone: string
    allow_cancellation: boolean
}

function formatDate(iso: string, tz: string) {
    return new Date(iso).toLocaleDateString("es-MX", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        timeZone: tz,
    })
}

function formatTime(iso: string, tz: string) {
    return new Date(iso).toLocaleTimeString("es-MX", {
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz,
    })
}

function CancelBookingContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [booking, setBooking] = useState<BookingInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const [cancelled, setCancelled] = useState(false)
    const [reason, setReason] = useState("")

    useEffect(() => {
        if (!token) {
            setError("Token de cancelación no encontrado en la URL.")
            setLoading(false)
            return
        }
        fetch(`/api/booking/public/cancel?token=${encodeURIComponent(token)}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error)
                else setBooking(d.booking)
            })
            .catch(() => setError("No se pudo cargar la información de la cita."))
            .finally(() => setLoading(false))
    }, [token])

    const handleCancel = async () => {
        if (!token) return
        setCancelling(true)
        try {
            const res = await fetch("/api/booking/public/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, reason }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al cancelar")
            setCancelled(true)
        } catch (err: any) {
            setError(err.message || "Error al cancelar la cita")
        } finally {
            setCancelling(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <span className="text-sm font-semibold text-white/30 tracking-widest uppercase">Magic Funnel</span>
                </div>

                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    {/* Top accent */}
                    <div className="h-1 bg-gradient-to-r from-red-600 to-rose-500" />

                    <div className="p-8">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-white/40" />
                                <p className="text-sm text-white/40">Cargando información...</p>
                            </div>
                        ) : error && !cancelled ? (
                            <div className="flex flex-col items-center gap-4 py-8 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                                    <AlertCircle className="h-8 w-8 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Error</h2>
                                    <p className="text-sm text-white/50">{error}</p>
                                </div>
                                <Link href="/" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                                    Volver al inicio
                                </Link>
                            </div>
                        ) : cancelled ? (
                            <div className="flex flex-col items-center gap-4 py-8 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Cita cancelada</h2>
                                    <p className="text-sm text-white/50">
                                        Tu cita ha sido cancelada exitosamente. El organizador recibirá una notificación.
                                    </p>
                                </div>
                            </div>
                        ) : booking?.status === "cancelled" ? (
                            <div className="flex flex-col items-center gap-4 py-8 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-500/10">
                                    <CalendarX2 className="h-8 w-8 text-gray-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-1">Ya cancelada</h2>
                                    <p className="text-sm text-white/50">Esta cita ya fue cancelada anteriormente.</p>
                                </div>
                            </div>
                        ) : booking ? (
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                                        <CalendarX2 className="h-6 w-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white">Cancelar cita</h1>
                                        <p className="text-xs text-white/40">{booking.calendar_name}</p>
                                    </div>
                                </div>

                                {/* Booking details */}
                                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 mb-6 space-y-3">
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <Calendar className="h-4 w-4 text-white/30 shrink-0" />
                                        <span className="text-white/70 capitalize">
                                            {formatDate(booking.start_time, booking.timezone)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <Clock className="h-4 w-4 text-white/30 shrink-0" />
                                        <span className="text-white/70">
                                            {formatTime(booking.start_time, booking.timezone)} — {formatTime(booking.end_time, booking.timezone)}
                                        </span>
                                    </div>
                                    <div className="pt-1 border-t border-white/[0.05]">
                                        <span className="text-xs text-white/30">Agendado por: </span>
                                        <span className="text-xs text-white/60">{booking.guest_name}</span>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="mb-6">
                                    <label className="block text-xs font-semibold text-white/40 mb-2">
                                        Motivo de cancelación (opcional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Ej. Surgió un imprevisto..."
                                        rows={3}
                                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all resize-none"
                                    />
                                </div>

                                {error && (
                                    <p className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling || !booking.allow_cancellation}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 py-3.5 text-sm font-bold text-white transition-all"
                                >
                                    {cancelling ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Cancelando...</>
                                    ) : (
                                        <><CalendarX2 className="h-4 w-4" /> Confirmar cancelación</>
                                    )}
                                </button>

                                {!booking.allow_cancellation && (
                                    <p className="mt-3 text-center text-xs text-white/30">
                                        Este calendario no permite cancelaciones en línea. Contacta al organizador directamente.
                                    </p>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CancelBookingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/30" />
            </div>
        }>
            <CancelBookingContent />
        </Suspense>
    )
}
