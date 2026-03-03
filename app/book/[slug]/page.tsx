"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
    CalendarDays, Clock, ChevronLeft, ChevronRight,
    CheckCircle2, Loader2, MapPin, Video, Phone,
    Link as LinkIcon, User, Mail, MessageSquare,
    CalendarPlus, Copy, Check, ArrowRight, Sparkles
} from "lucide-react"
import { DAY_NAMES_SHORT, formatBookingDate, formatBookingTime, type TimeSlot, type BookingCalendar, type BookingQuestion } from "@/lib/booking"

type Step = "date" | "time" | "form" | "confirmed"

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}

const LOCATION_ICONS: Record<string, typeof Video> = {
    google_meet: Video,
    zoom: Video,
    whatsapp: Phone,
    presencial: MapPin,
    custom: LinkIcon,
}

const LOCATION_LABELS: Record<string, string> = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    whatsapp: "WhatsApp",
    presencial: "Presencial",
    custom: "Link personalizado",
}

export default function PublicBookingPage() {
    const params = useParams()
    const slug = params.slug as string

    const [step, setStep] = useState<Step>("date")
    const [calendar, setCalendar] = useState<BookingCalendar | null>(null)
    const [questions, setQuestions] = useState<BookingQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Date selection
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    // Time selection
    const [slots, setSlots] = useState<TimeSlot[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

    // Form
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)

    // Confirmation
    const [bookingResult, setBookingResult] = useState<any>(null)
    const [copied, setCopied] = useState(false)

    // Load calendar info
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/booking/public/${slug}`)
                if (!res.ok) throw new Error("Calendario no encontrado")
                const data = await res.json()
                setCalendar(data.calendar)
                setQuestions(data.calendar.booking_questions || [])
            } catch (err) {
                setError("Este calendario no existe o no está disponible.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [slug])

    // Load slots when date changes
    const loadSlots = useCallback(async (date: string) => {
        setSlotsLoading(true)
        setSlots([])
        try {
            const res = await fetch(`/api/booking/public/${slug}/slots?date=${date}`)
            const data = await res.json()
            setSlots(data.slots || [])
        } catch {
            setSlots([])
        } finally {
            setSlotsLoading(false)
        }
    }, [slug])

    useEffect(() => {
        if (selectedDate) loadSlots(selectedDate)
    }, [selectedDate, loadSlots])

    // Calendar rendering
    const today = new Date()
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthName = currentMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" })

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

    const isDateDisabled = (day: number) => {
        const d = new Date(year, month, day)
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        return d < todayStart
    }

    const formatDateStr = (day: number) => {
        return `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    }

    // Submit booking
    const handleSubmit = async () => {
        if (!selectedSlot || !calendar) return

        setSubmitting(true)
        try {
            const res = await fetch(`/api/booking/public/${slug}/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    datetime: selectedSlot.datetime,
                    guest_name: formData["Nombre completo"] || formData["nombre"] || "Invitado",
                    guest_email: formData["Email"] || formData["email"] || "",
                    guest_phone: formData["Teléfono"] || formData["telefono"] || null,
                    answers: formData,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setBookingResult(data)
            setStep("confirmed")
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error al reservar")
        } finally {
            setSubmitting(false)
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    <p className="text-sm text-violet-300/50">Cargando calendario...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !calendar) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-6">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20">
                        <CalendarDays className="h-10 w-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Calendario no disponible</h1>
                    <p className="text-sm text-violet-300/40">{error}</p>
                </div>
            </div>
        )
    }

    const LocationIcon = LOCATION_ICONS[calendar.location_type] || Video

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Subtle background gradients */}
            <div className="pointer-events-none fixed inset-0">
                <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.03] blur-[100px]" />
            </div>

            <div className="relative mx-auto max-w-2xl px-4 py-8 sm:py-16">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{calendar.name}</h1>
                    {calendar.description && (
                        <p className="mt-2 text-sm text-violet-300/40">{calendar.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-violet-300/30">
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {calendar.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                            <LocationIcon className="h-3.5 w-3.5" />
                            {LOCATION_LABELS[calendar.location_type]}
                        </span>
                    </div>
                </div>

                {/* Step indicator */}
                {step !== "confirmed" && (
                    <div className="mb-8 flex items-center justify-center gap-2">
                        {(["date", "time", "form"] as const).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-500",
                                    step === s ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white scale-110 shadow-lg shadow-violet-500/30" :
                                        (["date", "time", "form"].indexOf(step) > i) ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                            "bg-white/[0.04] text-violet-300/30 border border-white/[0.06]"
                                )}>
                                    {(["date", "time", "form"].indexOf(step) > i) ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                </div>
                                {i < 2 && (
                                    <div className={cn(
                                        "h-px w-8 sm:w-12 transition-colors duration-500",
                                        (["date", "time", "form"].indexOf(step) > i) ? "bg-emerald-500/30" : "bg-white/[0.06]"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Card container */}
                <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">

                    {/* ═══ STEP 1: Date ═══ */}
                    {step === "date" && (
                        <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-lg font-bold mb-6">Selecciona una fecha</h2>

                            {/* Month navigation */}
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-semibold capitalize">{monthName}</span>
                                <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {DAY_NAMES_SHORT.map(d => (
                                    <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-violet-300/30">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {/* Empty cells for first day offset */}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}

                                {/* Day cells */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1
                                    const dateStr = formatDateStr(day)
                                    const disabled = isDateDisabled(day)
                                    const selected = selectedDate === dateStr
                                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => !disabled && setSelectedDate(dateStr)}
                                            disabled={disabled}
                                            className={cn(
                                                "aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300",
                                                disabled && "text-white/[0.08] cursor-not-allowed",
                                                !disabled && !selected && "hover:bg-violet-500/10 hover:text-violet-300 text-white/60 cursor-pointer",
                                                selected && "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 scale-105",
                                                isToday && !selected && "ring-1 ring-violet-500/30 text-violet-400",
                                            )}
                                        >
                                            {day}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Continue button */}
                            {selectedDate && (
                                <button
                                    onClick={() => setStep("time")}
                                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3.5 text-sm font-semibold transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-300"
                                >
                                    Continuar
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* ═══ STEP 2: Time ═══ */}
                    {step === "time" && (
                        <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => { setStep("date"); setSelectedSlot(null) }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div>
                                    <h2 className="text-lg font-bold">Elige un horario</h2>
                                    <p className="text-xs text-violet-300/40 capitalize">
                                        {selectedDate && new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                                    </p>
                                </div>
                            </div>

                            {slotsLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                                    <p className="text-xs text-violet-300/40">Buscando horarios...</p>
                                </div>
                            ) : slots.filter(s => s.available).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                    <Clock className="h-10 w-10 text-violet-300/20" />
                                    <p className="text-sm text-violet-300/40">No hay horarios disponibles para esta fecha.</p>
                                    <button
                                        onClick={() => setStep("date")}
                                        className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                                    >
                                        ← Elegir otra fecha
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {slots.filter(s => s.available).map(slot => (
                                            <button
                                                key={slot.time}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={cn(
                                                    "rounded-xl py-3 text-sm font-medium transition-all duration-300",
                                                    selectedSlot?.time === slot.time
                                                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 scale-[1.02]"
                                                        : "border border-white/[0.06] bg-white/[0.02] text-white/70 hover:bg-violet-500/10 hover:border-violet-500/20 hover:text-white"
                                                )}
                                            >
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedSlot && (
                                        <button
                                            onClick={() => setStep("form")}
                                            className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3.5 text-sm font-semibold transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        >
                                            Continuar
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ═══ STEP 3: Form ═══ */}
                    {step === "form" && (
                        <div className="p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => setStep("time")}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div>
                                    <h2 className="text-lg font-bold">Completa tus datos</h2>
                                    <p className="text-xs text-violet-300/40">
                                        {selectedDate && new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                                        {" · "}
                                        {selectedSlot?.time}
                                    </p>
                                </div>
                            </div>

                            {/* Summary card */}
                            <div className="mb-6 rounded-2xl border border-violet-500/10 bg-violet-500/[0.03] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                                        <CalendarDays className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{calendar.name}</p>
                                        <p className="text-xs text-violet-300/40">
                                            {calendar.duration_minutes} min · {LOCATION_LABELS[calendar.location_type]}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form fields */}
                            <div className="space-y-4">
                                {questions.map(q => {
                                    const FIELD_ICONS: Record<string, typeof User> = {
                                        text: User,
                                        email: Mail,
                                        phone: Phone,
                                        textarea: MessageSquare,
                                        select: CheckCircle2,
                                    }
                                    const FieldIcon = FIELD_ICONS[q.type] || User

                                    return (
                                        <div key={q.id}>
                                            <label className="mb-1.5 block text-xs font-semibold text-violet-300/60">
                                                {q.label} {q.required && <span className="text-fuchsia-400">*</span>}
                                            </label>
                                            {q.type === "textarea" ? (
                                                <textarea
                                                    value={formData[q.label] || ""}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [q.label]: e.target.value }))}
                                                    placeholder={q.placeholder || ""}
                                                    rows={3}
                                                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-violet-500/30 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                                                />
                                            ) : q.type === "select" && q.options ? (
                                                <select
                                                    value={formData[q.label] || ""}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, [q.label]: e.target.value }))}
                                                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white focus:border-violet-500/30 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all appearance-none"
                                                >
                                                    <option value="">Selecciona...</option>
                                                    {q.options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="relative">
                                                    <FieldIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-300/20" />
                                                    <input
                                                        type={q.type === "email" ? "email" : q.type === "phone" ? "tel" : "text"}
                                                        value={formData[q.label] || ""}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, [q.label]: e.target.value }))}
                                                        placeholder={q.placeholder || q.label}
                                                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 focus:border-violet-500/30 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="mt-8 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 text-sm font-bold transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)] disabled:opacity-50"
                            >
                                {submitting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Reservando...</>
                                ) : (
                                    <><CheckCircle2 className="h-4 w-4" /> Confirmar reserva</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* ═══ STEP 4: Confirmed ═══ */}
                    {step === "confirmed" && bookingResult && (
                        <div className="p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-700">
                            {/* Success animation */}
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 animate-in zoom-in-50 duration-500">
                                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                            </div>

                            <h2 className="text-2xl font-bold mb-2">¡Reserva confirmada!</h2>
                            <p className="text-sm text-violet-300/40 mb-8">
                                {bookingResult.calendar?.confirmation_message || "Tu cita ha sido agendada exitosamente."}
                            </p>

                            {/* Booking details */}
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6 text-left">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <CalendarDays className="h-4 w-4 text-violet-400 shrink-0" />
                                        <span className="text-sm">
                                            {formatBookingDate(bookingResult.booking.start_time, bookingResult.calendar?.timezone)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-violet-400 shrink-0" />
                                        <span className="text-sm">
                                            {formatBookingTime(bookingResult.booking.start_time, bookingResult.calendar?.timezone)}
                                            {" — "}
                                            {formatBookingTime(bookingResult.booking.end_time, bookingResult.calendar?.timezone)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <LocationIcon className="h-4 w-4 text-violet-400 shrink-0" />
                                        <span className="text-sm">{LOCATION_LABELS[calendar.location_type]}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    onClick={() => {
                                        const start = new Date(bookingResult.booking.start_time)
                                        const end = new Date(bookingResult.booking.end_time)
                                        const title = encodeURIComponent(calendar.name)
                                        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`
                                        window.open(url, "_blank")
                                    }}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-sm font-medium hover:bg-white/[0.05] transition-all"
                                >
                                    <CalendarPlus className="h-4 w-4 text-violet-400" />
                                    Agregar a Google Calendar
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 text-sm font-medium hover:bg-white/[0.05] transition-all"
                                >
                                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-violet-400" />}
                                    {copied ? "¡Copiado!" : "Copiar link"}
                                </button>
                            </div>

                            {/* CTA if configured */}
                            {bookingResult.calendar?.confirmation_cta_url && (
                                <a
                                    href={bookingResult.calendar.confirmation_cta_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3.5 text-sm font-bold transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]"
                                >
                                    {bookingResult.calendar.confirmation_cta_label || "Siguiente paso"}
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Powered by */}
                <div className="mt-6 text-center">
                    <span className="text-[10px] text-violet-300/20 font-medium tracking-wider">
                        Powered by <span className="text-violet-400/40 font-bold">Magic Funnel</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
