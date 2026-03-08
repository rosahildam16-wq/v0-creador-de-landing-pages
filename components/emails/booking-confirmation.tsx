import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Hr,
    Button,
} from "@react-email/components"
import * as React from "react"

interface BookingConfirmationEmailProps {
    guestName: string
    calendarName: string
    startTime: string       // formatted date string
    timeStr: string         // formatted time string
    endTimeStr: string      // formatted end time string
    durationMinutes: number
    locationType: string
    locationUrl?: string | null
    cancelUrl: string
    ownerEmail?: string
}

export const BookingConfirmationEmail = ({
    guestName,
    calendarName,
    startTime,
    timeStr,
    endTimeStr,
    durationMinutes,
    locationType,
    locationUrl,
    cancelUrl,
}: BookingConfirmationEmailProps) => {
    const locationLabel: Record<string, string> = {
        google_meet: "Google Meet",
        zoom: "Zoom",
        whatsapp: "WhatsApp",
        presencial: "Presencial",
        custom: "Enlace personalizado",
    }

    return (
        <Html>
            <Head />
            <Preview>✅ Cita confirmada: {calendarName} — {timeStr}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={headerLabel}>✦ Magic Funnel</Text>
                        <Heading style={h1}>¡Tu cita está confirmada!</Heading>
                        <Text style={subtitle}>
                            Hola {guestName}, todo está listo. Te esperamos.
                        </Text>
                    </Section>

                    {/* Booking details */}
                    <Section style={detailsBox}>
                        <Text style={detailsTitle}>{calendarName}</Text>
                        <Hr style={divider} />

                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                <tr>
                                    <td style={labelCell}>📅 Fecha</td>
                                    <td style={valueCell}>{startTime}</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>⏰ Hora</td>
                                    <td style={valueCell}>{timeStr} — {endTimeStr}</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>⏱ Duración</td>
                                    <td style={valueCell}>{durationMinutes} minutos</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>📍 Modalidad</td>
                                    <td style={valueCell}>{locationLabel[locationType] || locationType}</td>
                                </tr>
                                {locationUrl && (
                                    <tr>
                                        <td style={labelCell}>🔗 Enlace</td>
                                        <td style={valueCell}>
                                            <Link href={locationUrl} style={linkStyle}>
                                                Unirme a la reunión
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Section>

                    {/* CTA */}
                    {locationUrl && (
                        <Section style={{ textAlign: "center", marginTop: "24px" }}>
                            <Button href={locationUrl} style={button}>
                                Unirme a la reunión →
                            </Button>
                        </Section>
                    )}

                    <Hr style={divider} />

                    {/* Cancel link */}
                    <Section style={{ textAlign: "center" }}>
                        <Text style={footerText}>
                            ¿Necesitas cancelar?{" "}
                            <Link href={cancelUrl} style={cancelLink}>
                                Haz clic aquí para cancelar tu cita
                            </Link>
                        </Text>
                        <Text style={footerText}>
                            Powered by{" "}
                            <Link href="https://magicfunnel.app" style={linkStyle}>
                                Magic Funnel
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

export const BookingOwnerNotificationEmail = ({
    guestName,
    guestEmail,
    calendarName,
    startTime,
    timeStr,
    endTimeStr,
    durationMinutes,
    locationType,
    locationUrl,
}: Omit<BookingConfirmationEmailProps, "cancelUrl">) => {
    const locationLabel: Record<string, string> = {
        google_meet: "Google Meet",
        zoom: "Zoom",
        whatsapp: "WhatsApp",
        presencial: "Presencial",
        custom: "Enlace personalizado",
    }

    return (
        <Html>
            <Head />
            <Preview>📅 Nueva cita: {guestName} reservó {calendarName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={headerLabel}>✦ Magic Funnel</Text>
                        <Heading style={h1}>Nueva cita agendada</Heading>
                        <Text style={subtitle}>
                            {guestName} acaba de reservar una cita contigo.
                        </Text>
                    </Section>

                    <Section style={detailsBox}>
                        <Text style={detailsTitle}>{calendarName}</Text>
                        <Hr style={divider} />

                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                                <tr>
                                    <td style={labelCell}>👤 Nombre</td>
                                    <td style={valueCell}>{guestName}</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>📧 Email</td>
                                    <td style={valueCell}>{guestEmail}</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>📅 Fecha</td>
                                    <td style={valueCell}>{startTime}</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>⏰ Hora</td>
                                    <td style={valueCell}>{timeStr} — {endTimeStr}</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>⏱ Duración</td>
                                    <td style={valueCell}>{durationMinutes} minutos</td>
                                </tr>
                                <tr>
                                    <td style={labelCell}>📍 Modalidad</td>
                                    <td style={valueCell}>{locationLabel[locationType] || locationType}</td>
                                </tr>
                                {locationUrl && (
                                    <tr>
                                        <td style={labelCell}>🔗 Enlace</td>
                                        <td style={valueCell}>
                                            <Link href={locationUrl} style={linkStyle}>
                                                Abrir reunión
                                            </Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Section>

                    <Hr style={divider} />
                    <Text style={footerText}>
                        Powered by{" "}
                        <Link href="https://magicfunnel.app" style={linkStyle}>
                            Magic Funnel
                        </Link>
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

// ── Styles ──────────────────────────────────────────────

const main: React.CSSProperties = {
    backgroundColor: "#0f0a1a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#f8f5ff",
}

const container: React.CSSProperties = {
    margin: "0 auto",
    padding: "32px 16px",
    maxWidth: "560px",
}

const header: React.CSSProperties = {
    textAlign: "center",
    paddingBottom: "24px",
}

const headerLabel: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "4px",
    textTransform: "uppercase",
    color: "#a855f7",
    margin: "0 0 8px",
}

const h1: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#f8f5ff",
    margin: "0 0 8px",
}

const subtitle: React.CSSProperties = {
    fontSize: "15px",
    color: "#a78bfa",
    margin: "0",
}

const detailsBox: React.CSSProperties = {
    backgroundColor: "#1a0e2e",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: "16px",
    padding: "24px",
    marginTop: "24px",
}

const detailsTitle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8f5ff",
    margin: "0 0 12px",
}

const divider: React.CSSProperties = {
    borderColor: "rgba(139,92,246,0.15)",
    margin: "12px 0",
}

const labelCell: React.CSSProperties = {
    fontSize: "13px",
    color: "#a78bfa",
    paddingBottom: "10px",
    paddingRight: "16px",
    width: "100px",
    verticalAlign: "top",
}

const valueCell: React.CSSProperties = {
    fontSize: "14px",
    color: "#f8f5ff",
    fontWeight: "500",
    paddingBottom: "10px",
}

const button: React.CSSProperties = {
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    padding: "14px 32px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    display: "inline-block",
}

const linkStyle: React.CSSProperties = {
    color: "#a855f7",
    textDecoration: "underline",
}

const cancelLink: React.CSSProperties = {
    color: "#ef4444",
    textDecoration: "underline",
    fontSize: "12px",
}

const footerText: React.CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    textAlign: "center",
    margin: "8px 0",
}
