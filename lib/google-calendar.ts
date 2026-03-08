import { google } from "googleapis"
import { getIntegration, saveIntegration } from "./integrations-db"
import { createAdminClient } from "./supabase/admin"

const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
]

function getOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) return null

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

/**
 * Get a configured OAuth2 client for a member.
 * Auto-refreshes the token if expired.
 */
async function getAuthClientForMember(memberId: string) {
    const oauth2Client = getOAuthClient()
    if (!oauth2Client) return null

    const integration = await getIntegration(memberId, "google")
    if (!integration?.access_token) return null

    oauth2Client.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
        expiry_date: integration.expiry_date,
    })

    // Handle token refresh
    oauth2Client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            await saveIntegration(memberId, "google", {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || integration.refresh_token,
                expiry_date: tokens.expiry_date ?? undefined,
                email: integration.email,
            })
        }
    })

    return oauth2Client
}

/**
 * Create a Google Calendar event with Google Meet link.
 * Returns the hangoutLink (Google Meet URL) and event ID.
 */
export async function createGoogleMeetEvent(params: {
    ownerEmail: string
    title: string
    startTime: string   // ISO string
    endTime: string     // ISO string
    timezone: string
    guestEmail: string
    guestName: string
    description?: string
}): Promise<{ hangoutLink: string; eventId: string } | null> {
    try {
        // Look up owner's member_id
        const supabase = createAdminClient()
        if (!supabase) return null

        const { data: member } = await supabase
            .from("community_members")
            .select("member_id, username")
            .eq("email", params.ownerEmail)
            .maybeSingle()

        const memberId = member?.member_id || member?.username || params.ownerEmail

        const authClient = await getAuthClientForMember(memberId)
        if (!authClient) {
            console.log("[GCal] No Google integration for", params.ownerEmail)
            return null
        }

        const calendar = google.calendar({ version: "v3", auth: authClient })

        const event = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            requestBody: {
                summary: params.title,
                description: params.description || `Cita agendada a través de Magic Funnel`,
                start: {
                    dateTime: params.startTime,
                    timeZone: params.timezone,
                },
                end: {
                    dateTime: params.endTime,
                    timeZone: params.timezone,
                },
                attendees: [
                    { email: params.ownerEmail },
                    { email: params.guestEmail, displayName: params.guestName },
                ],
                conferenceData: {
                    createRequest: {
                        requestId: `mf-${Date.now()}`,
                        conferenceSolutionKey: { type: "hangoutsMeet" },
                    },
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: "email", minutes: 1440 }, // 24h before
                        { method: "popup", minutes: 30 },
                    ],
                },
                guestsCanModifyEvent: false,
                guestsCanInviteOthers: false,
            },
        })

        const hangoutLink = event.data.hangoutLink
        const eventId = event.data.id

        if (!hangoutLink || !eventId) {
            console.error("[GCal] Event created but no hangoutLink returned")
            return null
        }

        return { hangoutLink, eventId }
    } catch (err: any) {
        console.error("[GCal] Error creating event:", err?.message || err)
        return null
    }
}

/**
 * Delete a Google Calendar event (e.g., when booking is cancelled).
 */
export async function deleteGoogleCalendarEvent(params: {
    ownerEmail: string
    eventId: string
}): Promise<boolean> {
    try {
        const supabase = createAdminClient()
        if (!supabase) return false

        const { data: member } = await supabase
            .from("community_members")
            .select("member_id, username")
            .eq("email", params.ownerEmail)
            .maybeSingle()

        const memberId = member?.member_id || member?.username || params.ownerEmail

        const authClient = await getAuthClientForMember(memberId)
        if (!authClient) return false

        const calendar = google.calendar({ version: "v3", auth: authClient })
        await calendar.events.delete({
            calendarId: "primary",
            eventId: params.eventId,
            sendUpdates: "all",
        })

        return true
    } catch (err: any) {
        console.error("[GCal] Error deleting event:", err?.message || err)
        return false
    }
}
