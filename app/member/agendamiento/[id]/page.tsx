"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ChevronLeft, Save, Loader2, Settings, Clock, MapPin,
    CalendarDays, Shield, MessageSquare, Plus, Trash2,
    ToggleLeft, ToggleRight, Globe, Video, Phone, Link as LinkIcon
} from "lucide-react"
import { ImageUploader } from "@/components/ui/image-uploader"
import { LOCATION_TYPES, DAY_NAMES, DURATION_OPTIONS, type BookingCalendar, type AvailabilityRule, type BlackoutDate, type BookingQuestion } from "@/lib/booking"

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ")
}

type Tab = "general" | "availability" | "location" | "advanced" | "confirmation"

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "general", label: "General", icon: Settings },
    { key: "availability", label: "Disponibilidad", icon: CalendarDays },
    { key: "location", label: "Ubicación", icon: MapPin },
    { key: "advanced", label: "Avanzado", icon: Shield },
    { key: "confirmation", label: "Confirmación", icon: MessageSquare },
]

const TIMEZONES = [
    "America/Mexico_City", "America/Monterrey", "America/Bogota",
    "America/Lima", "America/Santiago", "America/Buenos_Aires",
    "America/Caracas", "America/Guayaquil", "America/Asuncion",
    "America/New_York", "America/Los_Angeles", "Europe/Madrid",
]

const QUESTION_TYPES = [
    { value: "text", label: "Texto corto" },
    { value: "textarea", label: "Texto largo" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Teléfono" },
    { value: "select", label: "Selección" },
]

export default function CalendarSettingsPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>("general")

    // Calendar state
    const [cal, setCal] = useState<BookingCalendar & { host_image_url?: string; allow_cancellation?: boolean; allow_reschedule?: boolean } | null>(null)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [hostImageUrl, setHostImageUrl] = useState("")
    const [timezone, setTimezone] = useState("America/Mexico_City")
    const [active, setActive] = useState(true)
    const [durationMinutes, setDurationMinutes] = useState(30)
    const [locationType, setLocationType] = useState("google_meet")
    const [locationValue, setLocationValue] = useState("")
    const [bufferBefore, setBufferBefore] = useState(0)
    const [bufferAfter, setBufferAfter] = useState(0)
    const [minNoticeHours, setMinNoticeHours] = useState(1)
    const [maxBookingsPerDay, setMaxBookingsPerDay] = useState(0)
    const [allowCancellation, setAllowCancellation] = useState(true)
    const [allowReschedule, setAllowReschedule] = useState(false)
    const [confirmationMessage, setConfirmationMessage] = useState("")
    const [confirmationCtaUrl, setConfirmationCtaUrl] = useState("")
    const [confirmationCtaLabel, setConfirmationCtaLabel] = useState("")

    // Availability rules (indexed 0=Sun…6=Sat)
    const [availRules, setAvailRules] = useState<{
        day_of_week: number; start_time: string; end_time: string; active: boolean
    }[]>([
        { day_of_week: 0, start_time: "10:00", end_time: "14:00", active: false },
        { day_of_week: 1, start_time: "09:00", end_time: "17:00", active: true },
        { day_of_week: 2, start_time: "09:00", end_time: "17:00", active: true },
        { day_of_week: 3, start_time: "09:00", end_time: "17:00", active: true },
        { day_of_week: 4, start_time: "09:00", end_time: "17:00", active: true },
        { day_of_week: 5, start_time: "09:00", end_time: "17:00", active: true },
        { day_of_week: 6, start_time: "10:00", end_time: "14:00", active: false },
    ])

    // Blackout dates
    const [blackoutDates, setBlackoutDates] = useState<{ date: string; reason: string }[]>([])
    const [newBlackoutDate, setNewBlackoutDate] = useState("")
    const [newBlackoutReason, setNewBlackoutReason] = useState("")

    // Custom questions
    const [questions, setQuestions] = useState<{
        label: string; type: string; placeholder: string; required: boolean; options: string
    }[]>([])

    useEffect(() => {
        fetch(`/api/booking/calendars/${id}`)
            .then(r => r.json())
            .then(d => {
                if (!d.calendar) return
                const c = d.calendar
                setCal(c)
                setName(c.name || "")
                setDescription(c.description || "")
                setHostImageUrl((c as any).host_image_url || "")
                setTimezone(c.timezone || "America/Mexico_City")
                setActive(c.active)
                setDurationMinutes(c.duration_minutes || 30)
                setLocationType(c.location_type || "google_meet")
                setLocationValue(c.location_value || "")
                setBufferBefore(c.buffer_before_minutes || 0)
                setBufferAfter(c.buffer_after_minutes || 0)
                setMinNoticeHours(c.min_notice_hours || 1)
                setMaxBookingsPerDay(c.max_bookings_per_day || 0)
                setAllowCancellation((c as any).allow_cancellation !== false)
                setAllowReschedule(!!(c as any).allow_reschedule)
                setConfirmationMessage(c.confirmation_message || "")
                setConfirmationCtaUrl(c.confirmation_cta_url || "")
                setConfirmationCtaLabel(c.confirmation_cta_label || "")

                // Merge DB rules with defaults (day_of_week 0-6)
                if (c.availability_rules?.length) {
                    const byDay: Record<number, AvailabilityRule> = {}
                    for (const r of c.availability_rules) byDay[r.day_of_week] = r
                    setAvailRules(prev => prev.map(p => byDay[p.day_of_week]
                        ? { ...p, start_time: byDay[p.day_of_week].start_time, end_time: byDay[p.day_of_week].end_time, active: byDay[p.day_of_week].active }
                        : p
                    ))
                }

                if (c.blackout_dates?.length) {
                    setBlackoutDates(c.blackout_dates.map((b: BlackoutDate) => ({ date: b.date, reason: b.reason || "" })))
                }

                if (c.booking_questions?.length) {
                    setQuestions(c.booking_questions.map((q: BookingQuestion) => ({
                        label: q.label,
                        type: q.type,
                        placeholder: q.placeholder || "",
                        required: q.required,
                        options: Array.isArray(q.options) ? q.options.join(", ") : "",
                    })))
                }
            })
            .catch(() => setError("No se pudo cargar el calendario"))
            .finally(() => setLoading(false))
    }, [id])

    const handleSave = useCallback(async () => {
        setSaving(true)
        setError(null)
        try {
            const payload: any = {
                name,
                description: description || null,
                host_image_url: hostImageUrl || null,
                timezone,
                active,
                duration_minutes: durationMinutes,
                location_type: locationType,
                location_value: locationValue || null,
                buffer_before_minutes: bufferBefore,
                buffer_after_minutes: bufferAfter,
                min_notice_hours: minNoticeHours,
                max_bookings_per_day: maxBookingsPerDay,
                allow_cancellation: allowCancellation,
                allow_reschedule: allowReschedule,
                confirmation_message: confirmationMessage || null,
                confirmation_cta_url: confirmationCtaUrl || null,
                confirmation_cta_label: confirmationCtaLabel || null,
                availability_rules: availRules,
                blackout_dates: blackoutDates,
                booking_questions: questions.map((q, i) => ({
                    label: q.label,
                    type: q.type,
                    placeholder: q.placeholder || null,
                    required: q.required,
                    options: q.options ? q.options.split(",").map(s => s.trim()).filter(Boolean) : null,
                    sort_order: i,
                })),
            }

            const res = await fetch(`/api/booking/calendars/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || `Error ${res.status}`)

            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err: any) {
            setError(err.message || "Error al guardar")
        } finally {
            setSaving(false)
        }
    }, [
        id, name, description, hostImageUrl, timezone, active, durationMinutes,
        locationType, locationValue, bufferBefore, bufferAfter, minNoticeHours,
        maxBookingsPerDay, allowCancellation, allowReschedule, confirmationMessage,
        confirmationCtaUrl, confirmationCtaLabel, availRules, blackoutDates, questions,
    ])

    const addBlackout = () => {
        if (!newBlackoutDate) return
        setBlackoutDates(prev => [...prev, { date: newBlackoutDate, reason: newBlackoutReason }])
        setNewBlackoutDate("")
        setNewBlackoutReason("")
    }

    const addQuestion = () => {
        setQuestions(prev => [...prev, { label: "Nueva pregunta", type: "text", placeholder: "", required: false, options: "" }])
    }

    const getLocationIcon = (type: string) => {
        if (type === "google_meet" || type === "zoom") return Video
        if (type === "whatsapp") return Phone
        if (type === "presencial") return MapPin
        return LinkIcon
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 pb-20 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push("/member/agendamiento")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/30 bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-foreground truncate">{name || "Calendario"}</h1>
                    <p className="text-xs text-muted-foreground">Configuración del calendario</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                        saved
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)]",
                        saving && "opacity-70"
                    )}
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saved ? "¡Guardado!" : "Guardar"}
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-border/30 bg-card/30 p-1 scrollbar-none">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all shrink-0",
                            tab === t.key
                                ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-500/20 text-white border border-violet-500/20"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: General ── */}
            {tab === "general" && (
                <div className="space-y-5">
                    <Section title="Información básica">
                        <Field label="Nombre del calendario">
                            <input value={name} onChange={e => setName(e.target.value)}
                                className="w-full input-field" placeholder="Ej. Llamada de Estrategia" />
                        </Field>
                        <Field label="Descripción (opcional)">
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                className="w-full input-field resize-none" rows={2} placeholder="Describe brevemente para qué es esta cita..." />
                        </Field>
                        <ImageUploader
                            value={hostImageUrl}
                            onChange={setHostImageUrl}
                            bucket="calendar-assets"
                            pathPrefix={id}
                            shape="circle"
                            height="h-28"
                            label="Foto del anfitrión"
                        />
                    </Section>
                    <Section title="Configuración">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Duración">
                                <select value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="w-full input-field appearance-none">
                                    {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Zona horaria">
                                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full input-field appearance-none">
                                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border/20 bg-card/20 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-foreground">Estado del calendario</p>
                                <p className="text-xs text-muted-foreground">{active ? "Visible y aceptando citas" : "Oculto — no acepta nuevas citas"}</p>
                            </div>
                            <button onClick={() => setActive(v => !v)} className="transition-colors">
                                {active
                                    ? <ToggleRight className="h-7 w-7 text-emerald-400" />
                                    : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                            </button>
                        </div>
                    </Section>
                </div>
            )}

            {/* ── TAB: Availability ── */}
            {tab === "availability" && (
                <div className="space-y-5">
                    <Section title="Horarios disponibles" subtitle="Define qué días y horas los clientes pueden agendar.">
                        <div className="space-y-2">
                            {availRules.map((rule, idx) => (
                                <div key={rule.day_of_week}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                                        rule.active ? "border-violet-500/20 bg-violet-500/[0.03]" : "border-border/20 bg-card/20"
                                    )}
                                >
                                    <button onClick={() => setAvailRules(prev => prev.map((r, i) => i === idx ? { ...r, active: !r.active } : r))}>
                                        {rule.active
                                            ? <ToggleRight className="h-6 w-6 text-violet-400" />
                                            : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                                    </button>
                                    <span className={cn("w-20 text-sm font-semibold shrink-0", rule.active ? "text-foreground" : "text-muted-foreground")}>
                                        {DAY_NAMES[rule.day_of_week]}
                                    </span>
                                    {rule.active ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input type="time" value={rule.start_time}
                                                onChange={e => setAvailRules(prev => prev.map((r, i) => i === idx ? { ...r, start_time: e.target.value } : r))}
                                                className="input-field text-xs px-2 py-1.5 w-24" />
                                            <span className="text-muted-foreground text-xs">—</span>
                                            <input type="time" value={rule.end_time}
                                                onChange={e => setAvailRules(prev => prev.map((r, i) => i === idx ? { ...r, end_time: e.target.value } : r))}
                                                className="input-field text-xs px-2 py-1.5 w-24" />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/50">No disponible</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section title="Fechas bloqueadas" subtitle="Días en los que no aceptas citas (vacaciones, feriados, etc.)">
                        <div className="space-y-2 mb-3">
                            {blackoutDates.length === 0 && (
                                <p className="text-xs text-muted-foreground/60 py-2">Sin fechas bloqueadas.</p>
                            )}
                            {blackoutDates.map((bd, idx) => (
                                <div key={idx} className="flex items-center gap-2 rounded-xl border border-border/20 bg-card/20 px-3 py-2">
                                    <span className="text-sm font-mono text-violet-400">{bd.date}</span>
                                    <span className="flex-1 text-xs text-muted-foreground truncate">{bd.reason || "Sin motivo"}</span>
                                    <button onClick={() => setBlackoutDates(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-muted-foreground hover:text-red-400 transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="date" value={newBlackoutDate} onChange={e => setNewBlackoutDate(e.target.value)}
                                className="input-field text-sm px-3 py-2" />
                            <input value={newBlackoutReason} onChange={e => setNewBlackoutReason(e.target.value)}
                                placeholder="Motivo (opcional)" className="flex-1 input-field text-sm px-3 py-2" />
                            <button onClick={addBlackout} disabled={!newBlackoutDate}
                                className="flex items-center gap-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-40">
                                <Plus className="h-3.5 w-3.5" /> Agregar
                            </button>
                        </div>
                    </Section>
                </div>
            )}

            {/* ── TAB: Location ── */}
            {tab === "location" && (
                <Section title="Tipo de reunión" subtitle="¿Dónde o cómo se llevará a cabo la cita?">
                    <div className="grid gap-2">
                        {LOCATION_TYPES.map(lt => {
                            const Icon = getLocationIcon(lt.value)
                            const isSelected = locationType === lt.value
                            return (
                                <button
                                    key={lt.value}
                                    onClick={() => setLocationType(lt.value)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                                        isSelected
                                            ? "border-violet-500/30 bg-violet-500/[0.06] text-foreground"
                                            : "border-border/20 bg-card/20 text-muted-foreground hover:border-border/40"
                                    )}
                                >
                                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", isSelected ? "bg-violet-500/10 text-violet-400" : "bg-white/[0.03]")}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{lt.label}</p>
                                        <p className="text-xs opacity-60">
                                            {lt.value === "google_meet" && "Se crea automáticamente si tienes Google conectado"}
                                            {lt.value === "zoom" && "Se crea automáticamente si tienes Zoom conectado"}
                                            {lt.value === "whatsapp" && "Agrega tu número de WhatsApp"}
                                            {lt.value === "presencial" && "Agrega la dirección del lugar"}
                                            {lt.value === "custom" && "Agrega cualquier URL o dato"}
                                        </p>
                                    </div>
                                    {isSelected && <div className="ml-auto h-2 w-2 rounded-full bg-violet-400" />}
                                </button>
                            )
                        })}
                    </div>
                    {(locationType === "whatsapp" || locationType === "presencial" || locationType === "custom") && (
                        <div className="mt-4">
                            <Field label={
                                locationType === "whatsapp" ? "Número de WhatsApp" :
                                locationType === "presencial" ? "Dirección" : "Link personalizado"
                            }>
                                <input
                                    value={locationValue}
                                    onChange={e => setLocationValue(e.target.value)}
                                    placeholder={
                                        locationType === "whatsapp" ? "+52 55 1234 5678" :
                                        locationType === "presencial" ? "Av. Insurgentes 123, CDMX" : "https://..."
                                    }
                                    className="w-full input-field"
                                />
                            </Field>
                        </div>
                    )}
                </Section>
            )}

            {/* ── TAB: Advanced ── */}
            {tab === "advanced" && (
                <div className="space-y-5">
                    <Section title="Tiempo de espera y buffers">
                        <div className="grid sm:grid-cols-3 gap-4">
                            <Field label="Aviso mínimo (horas)">
                                <input type="number" min={0} max={168} value={minNoticeHours}
                                    onChange={e => setMinNoticeHours(Number(e.target.value))}
                                    className="w-full input-field" />
                                <p className="mt-1 text-[10px] text-muted-foreground/60">Tiempo mínimo antes de una cita</p>
                            </Field>
                            <Field label="Buffer antes (min)">
                                <input type="number" min={0} max={120} step={5} value={bufferBefore}
                                    onChange={e => setBufferBefore(Number(e.target.value))}
                                    className="w-full input-field" />
                                <p className="mt-1 text-[10px] text-muted-foreground/60">Tiempo libre antes de cada cita</p>
                            </Field>
                            <Field label="Buffer después (min)">
                                <input type="number" min={0} max={120} step={5} value={bufferAfter}
                                    onChange={e => setBufferAfter(Number(e.target.value))}
                                    className="w-full input-field" />
                                <p className="mt-1 text-[10px] text-muted-foreground/60">Tiempo libre después de cada cita</p>
                            </Field>
                        </div>
                        <Field label="Máximo de citas por día (0 = sin límite)">
                            <input type="number" min={0} max={50} value={maxBookingsPerDay}
                                onChange={e => setMaxBookingsPerDay(Number(e.target.value))}
                                className="w-full input-field" />
                        </Field>
                    </Section>

                    <Section title="Cancelaciones y reprogramaciones">
                        {[
                            { label: "Permitir cancelaciones en línea", desc: "Los clientes pueden cancelar desde el link del email", value: allowCancellation, set: setAllowCancellation },
                            { label: "Permitir reprogramar en línea", desc: "Los clientes pueden cambiar la fecha/hora", value: allowReschedule, set: setAllowReschedule },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/20 bg-card/20 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                                <button onClick={() => item.set(v => !v)} className="transition-colors">
                                    {item.value
                                        ? <ToggleRight className="h-7 w-7 text-emerald-400" />
                                        : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                                </button>
                            </div>
                        ))}
                    </Section>
                </div>
            )}

            {/* ── TAB: Confirmation ── */}
            {tab === "confirmation" && (
                <div className="space-y-5">
                    <Section title="Mensaje de confirmación" subtitle="Qué ve el cliente después de agendar.">
                        <Field label="Mensaje">
                            <textarea value={confirmationMessage} onChange={e => setConfirmationMessage(e.target.value)}
                                className="w-full input-field resize-none" rows={3}
                                placeholder="¡Gracias! Te confirmo la cita y nos vemos pronto." />
                        </Field>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="URL del botón (CTA)">
                                <input value={confirmationCtaUrl} onChange={e => setConfirmationCtaUrl(e.target.value)}
                                    className="w-full input-field" placeholder="https://..." />
                            </Field>
                            <Field label="Texto del botón">
                                <input value={confirmationCtaLabel} onChange={e => setConfirmationCtaLabel(e.target.value)}
                                    className="w-full input-field" placeholder="Ver recursos" />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Preguntas personalizadas" subtitle="Preguntas adicionales que aparecen en el formulario de agendamiento.">
                        <div className="space-y-3 mb-3">
                            {questions.length === 0 && (
                                <p className="text-xs text-muted-foreground/60 py-2">Sin preguntas adicionales. Solo se pedirán nombre, email y teléfono.</p>
                            )}
                            {questions.map((q, idx) => (
                                <div key={idx} className="rounded-xl border border-border/20 bg-card/20 p-4 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 space-y-2">
                                            <input value={q.label} onChange={e => setQuestions(prev => prev.map((pq, i) => i === idx ? { ...pq, label: e.target.value } : pq))}
                                                className="w-full input-field text-sm" placeholder="Pregunta..." />
                                            <div className="grid grid-cols-2 gap-2">
                                                <select value={q.type} onChange={e => setQuestions(prev => prev.map((pq, i) => i === idx ? { ...pq, type: e.target.value } : pq))}
                                                    className="input-field text-xs py-1.5 appearance-none">
                                                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </select>
                                                <input value={q.placeholder} onChange={e => setQuestions(prev => prev.map((pq, i) => i === idx ? { ...pq, placeholder: e.target.value } : pq))}
                                                    className="input-field text-xs py-1.5" placeholder="Placeholder..." />
                                            </div>
                                            {q.type === "select" && (
                                                <input value={q.options} onChange={e => setQuestions(prev => prev.map((pq, i) => i === idx ? { ...pq, options: e.target.value } : pq))}
                                                    className="w-full input-field text-xs" placeholder="Opción 1, Opción 2, Opción 3" />
                                            )}
                                        </div>
                                        <button onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))}
                                            className="mt-1 text-muted-foreground hover:text-red-400 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={q.required} onChange={e => setQuestions(prev => prev.map((pq, i) => i === idx ? { ...pq, required: e.target.checked } : pq))}
                                            className="rounded" />
                                        <span className="text-xs text-muted-foreground">Respuesta obligatoria</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <button onClick={addQuestion}
                            className="flex items-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/[0.03] px-4 py-3 text-sm font-medium text-violet-400/70 hover:text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/[0.06] transition-all w-full">
                            <Plus className="h-4 w-4" /> Agregar pregunta
                        </button>
                    </Section>
                </div>
            )}
        </div>
    )
}

// ── Small helper components ──

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border/20 bg-card/20 p-5 space-y-4">
            <div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {children}
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground">{label}</label>
            {children}
        </div>
    )
}
