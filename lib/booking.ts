/**
 * Booking Module — Core Types & Helpers
 * Magic Funnel Appointment Scheduling System
 */

// ============ TYPES ============

export interface BookingCalendar {
    id: string
    owner_email: string
    slug: string
    name: string
    description: string | null
    type: "1:1" | "group"
    duration_minutes: number
    timezone: string
    location_type: string
    location_value: string | null
    max_bookings_per_day: number
    min_notice_hours: number
    buffer_before_minutes: number
    buffer_after_minutes: number
    max_group_size: number
    confirmation_message: string | null
    confirmation_cta_url: string | null
    confirmation_cta_label: string | null
    active: boolean
    created_at: string
    updated_at: string
    // Joined
    availability_rules?: AvailabilityRule[]
    booking_questions?: BookingQuestion[]
    blackout_dates?: BlackoutDate[]
}

export interface AvailabilityRule {
    id: string
    calendar_id: string
    day_of_week: number // 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time: string // "09:00"
    end_time: string // "17:00"
    active: boolean
}

export interface BlackoutDate {
    id: string
    calendar_id: string
    date: string // "2026-03-15"
    reason: string | null
}

export interface BookingQuestion {
    id: string
    calendar_id: string
    label: string
    type: "text" | "email" | "phone" | "select" | "textarea"
    placeholder: string | null
    required: boolean
    options: string[] | null
    sort_order: number
}

export interface Booking {
    id: string
    calendar_id: string
    start_time: string
    end_time: string
    status: "confirmed" | "cancelled" | "rescheduled" | "no_show" | "completed"
    guest_name: string
    guest_email: string
    guest_phone: string | null
    guest_answers: Record<string, string>
    cancel_token: string
    reschedule_token: string
    cancelled_at: string | null
    cancel_reason: string | null
    rescheduled_from: string | null
    notes: string | null
    created_at: string
    updated_at: string
    // Joined
    calendar?: BookingCalendar
}

export interface TimeSlot {
    time: string // "09:00"
    datetime: string // ISO string in UTC
    available: boolean
}

// ============ CONSTANTS ============

export const DAY_NAMES = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado"
] as const

export const DAY_NAMES_SHORT = [
    "Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"
] as const

export const DURATION_OPTIONS = [
    { value: 15, label: "15 minutos" },
    { value: 30, label: "30 minutos" },
    { value: 45, label: "45 minutos" },
    { value: 60, label: "1 hora" },
    { value: 90, label: "1.5 horas" },
    { value: 120, label: "2 horas" },
] as const

export const LOCATION_TYPES = [
    { value: "google_meet", label: "Google Meet", icon: "video" },
    { value: "zoom", label: "Zoom", icon: "video" },
    { value: "whatsapp", label: "WhatsApp", icon: "phone" },
    { value: "presencial", label: "Presencial", icon: "map-pin" },
    { value: "custom", label: "Link personalizado", icon: "link" },
] as const

export const BOOKING_STATUS_CONFIG = {
    confirmed: { label: "Confirmada", color: "emerald", icon: "check-circle" },
    cancelled: { label: "Cancelada", color: "red", icon: "x-circle" },
    rescheduled: { label: "Reprogramada", color: "amber", icon: "refresh-cw" },
    no_show: { label: "No asistió", color: "gray", icon: "user-x" },
    completed: { label: "Completada", color: "blue", icon: "check" },
} as const

// ============ SLOT GENERATION ============

/**
 * Generate available time slots for a specific date.
 */
export function generateSlots(params: {
    date: string // "2026-03-15"
    rules: AvailabilityRule[]
    existingBookings: { start_time: string; end_time: string }[]
    durationMinutes: number
    bufferBefore: number
    bufferAfter: number
    minNoticeHours: number
    maxBookingsPerDay: number
    timezone: string
}): TimeSlot[] {
    const {
        date, rules, existingBookings, durationMinutes,
        bufferBefore, bufferAfter, minNoticeHours, maxBookingsPerDay, timezone
    } = params

    // Get the day of week (0-6) for the given date in the calendar's timezone
    const targetDate = new Date(`${date}T12:00:00`)
    const dayOfWeek = targetDate.getDay()

    // Filter active rules for this day
    const dayRules = rules.filter(r => r.day_of_week === dayOfWeek && r.active)
    if (dayRules.length === 0) return []

    // Check if max bookings reached
    const confirmedBookings = existingBookings.length
    if (maxBookingsPerDay > 0 && confirmedBookings >= maxBookingsPerDay) return []

    const now = new Date()
    const minNoticeTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000)
    const slots: TimeSlot[] = []

    for (const rule of dayRules) {
        const [startH, startM] = rule.start_time.split(":").map(Number)
        const [endH, endM] = rule.end_time.split(":").map(Number)

        let currentMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM

        while (currentMinutes + durationMinutes <= endMinutes) {
            const slotH = Math.floor(currentMinutes / 60)
            const slotM = currentMinutes % 60
            const timeStr = `${slotH.toString().padStart(2, "0")}:${slotM.toString().padStart(2, "0")}`

            // Build datetime for this slot
            const slotDate = new Date(`${date}T${timeStr}:00`)
            const slotEnd = new Date(slotDate.getTime() + durationMinutes * 60 * 1000)

            // Check min notice
            const isAfterNotice = slotDate > minNoticeTime

            // Check overlap with existing bookings (including buffers)
            const slotStartWithBuffer = new Date(slotDate.getTime() - bufferBefore * 60 * 1000)
            const slotEndWithBuffer = new Date(slotEnd.getTime() + bufferAfter * 60 * 1000)

            const hasConflict = existingBookings.some(booking => {
                const bStart = new Date(booking.start_time)
                const bEnd = new Date(booking.end_time)
                return slotStartWithBuffer < bEnd && slotEndWithBuffer > bStart
            })

            slots.push({
                time: timeStr,
                datetime: slotDate.toISOString(),
                available: isAfterNotice && !hasConflict,
            })

            currentMinutes += durationMinutes + bufferAfter
        }
    }

    return slots
}

// ============ HELPERS ============

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
}

export function formatBookingTime(isoString: string, timezone?: string): string {
    const date = new Date(isoString)
    return date.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone || "America/Mexico_City",
    })
}

export function formatBookingDate(isoString: string, timezone?: string): string {
    const date = new Date(isoString)
    return date.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: timezone || "America/Mexico_City",
    })
}

export const DEFAULT_AVAILABILITY: Omit<AvailabilityRule, "id" | "calendar_id">[] = [
    { day_of_week: 1, start_time: "09:00", end_time: "17:00", active: true },
    { day_of_week: 2, start_time: "09:00", end_time: "17:00", active: true },
    { day_of_week: 3, start_time: "09:00", end_time: "17:00", active: true },
    { day_of_week: 4, start_time: "09:00", end_time: "17:00", active: true },
    { day_of_week: 5, start_time: "09:00", end_time: "17:00", active: true },
    { day_of_week: 6, start_time: "10:00", end_time: "14:00", active: false },
    { day_of_week: 0, start_time: "10:00", end_time: "14:00", active: false },
]
