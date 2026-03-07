import { getResend } from "./resend"
import { BookingConfirmationEmail, BookingOwnerNotificationEmail } from "@/components/emails/booking-confirmation"
import * as React from "react"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://magicfunnel.app"
const FROM = "Magic Funnel <notificaciones@magicfunnel.app>"

function formatDate(isoString: string, timezone: string): string {
    return new Date(isoString).toLocaleDateString("es-MX", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        timeZone: timezone,
    })
}

function formatTime(isoString: string, timezone: string): string {
    return new Date(isoString).toLocaleTimeString("es-MX", {
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: timezone,
    })
}

export interface BookingEmailData {
    bookingId: string
    cancelToken: string
    guestName: string
    guestEmail: string
    ownerEmail: string
    calendarName: string
    startTime: string
    endTime: string
    durationMinutes: number
    timezone: string
    locationType: string
    locationUrl: string | null
}

export async function sendBookingConfirmationEmails(data: BookingEmailData): Promise<void> {
    const resend = await getResend()

    const startFormatted = formatDate(data.startTime, data.timezone)
    const timeStr = formatTime(data.startTime, data.timezone)
    const endTimeStr = formatTime(data.endTime, data.timezone)
    const cancelUrl = `${BASE_URL}/api/booking/public/cancel?token=${data.cancelToken}`

    // Email to guest
    const guestResult = await resend.emails.send({
        from: FROM,
        to: [data.guestEmail],
        subject: `✅ Cita confirmada: ${data.calendarName}`,
        react: React.createElement(BookingConfirmationEmail, {
            guestName: data.guestName,
            calendarName: data.calendarName,
            startTime: startFormatted,
            timeStr,
            endTimeStr,
            durationMinutes: data.durationMinutes,
            locationType: data.locationType,
            locationUrl: data.locationUrl,
            cancelUrl,
        }),
    })

    if (guestResult.error) {
        console.error("[BookingEmails] Error sending guest confirmation:", guestResult.error)
    }

    // Email to owner
    const ownerResult = await resend.emails.send({
        from: FROM,
        to: [data.ownerEmail],
        subject: `📅 Nueva cita: ${data.guestName} — ${data.calendarName}`,
        react: React.createElement(BookingOwnerNotificationEmail, {
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            calendarName: data.calendarName,
            startTime: startFormatted,
            timeStr,
            endTimeStr,
            durationMinutes: data.durationMinutes,
            locationType: data.locationType,
            locationUrl: data.locationUrl,
        }),
    })

    if (ownerResult.error) {
        console.error("[BookingEmails] Error sending owner notification:", ownerResult.error)
    }
}
