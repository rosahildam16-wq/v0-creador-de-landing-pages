import { getIntegration } from "./integrations-db"
import { createAdminClient } from "./supabase/admin"

/**
 * Create a Zoom meeting for a booking.
 * Uses the calendar owner's Zoom tokens.
 */
export async function createZoomMeeting(params: {
    ownerEmail: string
    topic: string
    startTime: string // ISO string
    duration: number // minutes
    guestEmail?: string
}): Promise<{ join_url: string; meeting_id: string } | null> {
    try {
        // Find the owner's member_id from community_members
        const supabase = createAdminClient()
        if (!supabase) return null

        const { data: member } = await supabase
            .from("community_members")
            .select("member_id, username")
            .eq("email", params.ownerEmail)
            .maybeSingle()

        const memberId = member?.member_id || member?.username || params.ownerEmail
        const integration = await getIntegration(memberId, "zoom")

        if (!integration?.access_token) {
            console.log("[Zoom] No integration found for", params.ownerEmail)
            return null
        }

        // Check if token is expired and refresh
        let accessToken = integration.access_token
        if (integration.expiry_date && Date.now() > integration.expiry_date) {
            accessToken = await refreshZoomToken(memberId, integration.refresh_token)
            if (!accessToken) return null
        }

        // Create meeting
        const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                topic: params.topic,
                type: 2, // Scheduled meeting
                start_time: params.startTime,
                duration: params.duration,
                timezone: "America/Mexico_City",
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: true,
                    waiting_room: false,
                    auto_recording: "none",
                    meeting_invitees: params.guestEmail
                        ? [{ email: params.guestEmail }]
                        : [],
                },
            }),
        })

        if (!res.ok) {
            console.error("[Zoom] Meeting creation failed:", res.status, await res.text())
            return null
        }

        const meeting = await res.json()
        return {
            join_url: meeting.join_url,
            meeting_id: String(meeting.id),
        }
    } catch (err) {
        console.error("[Zoom] Error creating meeting:", err)
        return null
    }
}

/**
 * Refresh an expired Zoom access token.
 */
async function refreshZoomToken(memberId: string, refreshToken: string): Promise<string | null> {
    try {
        const clientId = process.env.ZOOM_CLIENT_ID
        const clientSecret = process.env.ZOOM_CLIENT_SECRET
        if (!clientId || !clientSecret || !refreshToken) return null

        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

        const res = await fetch("https://zoom.us/oauth/token", {
            method: "POST",
            headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        })

        if (!res.ok) {
            console.error("[Zoom] Token refresh failed:", res.status)
            return null
        }

        const tokens = await res.json()

        // Update stored tokens
        const { saveIntegration } = await import("./integrations-db")
        await saveIntegration(memberId, "zoom", {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: Date.now() + tokens.expires_in * 1000,
        })

        return tokens.access_token
    } catch (err) {
        console.error("[Zoom] Refresh error:", err)
        return null
    }
}
