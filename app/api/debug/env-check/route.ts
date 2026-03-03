import { NextResponse } from "next/server"

/**
 * Temporary diagnostic endpoint to verify environment variables are loaded.
 * DELETE THIS FILE after verifying everything works.
 */
export async function GET(request: Request) {
    // Only allow with a secret query param for security
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key !== "mf_diag_2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        env: {
            ALIVIO_API_KEY: process.env.ALIVIO_API_KEY ? `SET (${process.env.ALIVIO_API_KEY.substring(0, 4)}...)` : "NOT SET",
            ALIVIO_WEBHOOK_SECRET: process.env.ALIVIO_WEBHOOK_SECRET ? "SET" : "NOT SET",
            ALIVIO_SECRET_KEY: process.env.ALIVIO_SECRET_KEY ? "SET" : "NOT SET",
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `SET (${process.env.GOOGLE_CLIENT_ID.substring(0, 8)}...)` : "NOT SET",
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET",
            GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "NOT SET",
            ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID ? `SET (${process.env.ZOOM_CLIENT_ID.substring(0, 6)}...)` : "NOT SET",
            ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET ? "SET" : "NOT SET",
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
        }
    })
}
