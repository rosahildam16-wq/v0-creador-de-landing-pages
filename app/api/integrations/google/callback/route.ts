import { NextResponse } from "next/server"
import { google } from "googleapis"
import { saveIntegration } from "@/lib/integrations-db"

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google/callback`
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // This is our memberId
  const error = searchParams.get("error")

  const redirectBase = "/member/integraciones"

  if (error) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?google=error&reason=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?google=error&reason=invalid_callback`, request.url)
    )
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const email = userInfo.data.email || ""

    // Persist to Supabase
    const saved = await saveIntegration(state, "google", {
      access_token: tokens.access_token || "",
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      email,
    })

    if (!saved) {
      // Table may not exist — trigger auto-migration and ask user to retry
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        await fetch(`${baseUrl}/api/admin/migrate-forms`, { method: "POST" })
      } catch {}
      return NextResponse.redirect(
        new URL(`${redirectBase}?google=error&reason=db_save_failed`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL(`${redirectBase}?google=success&email=${encodeURIComponent(email)}`, request.url)
    )
  } catch (err) {
    console.error("Google OAuth callback error:", err)
    return NextResponse.redirect(
      new URL(`${redirectBase}?google=error&reason=token_exchange_failed`, request.url)
    )
  }
}
