import { NextResponse } from "next/server"
import { saveIntegration } from "@/lib/integrations-db"

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${base}/api/integrations/zoom/callback`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // MemberId
  const error = searchParams.get("error")

  const redirectBase = "/member/integraciones"

  if (error) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?zoom=error&reason=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?zoom=error&reason=invalid_callback`, request.url)
    )
  }

  try {
    const clientId = process.env.ZOOM_CLIENT_ID!
    const clientSecret = process.env.ZOOM_CLIENT_SECRET!
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    const tokenRes = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(),
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL(`${redirectBase}?zoom=error&reason=token_exchange_failed`, request.url)
      )
    }

    const tokens = await tokenRes.json()

    const userRes = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    let email = ""
    if (userRes.ok) {
      const userData = await userRes.json()
      email = userData.email || ""
    }

    // Persist to Supabase
    await saveIntegration(state, "zoom", {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + tokens.expires_in * 1000,
      email,
    })

    return NextResponse.redirect(
      new URL(`${redirectBase}?zoom=success&email=${encodeURIComponent(email)}`, request.url)
    )
  } catch (err) {
    console.error("Zoom OAuth callback error:", err)
    return NextResponse.redirect(
      new URL(`${redirectBase}?zoom=error&reason=unknown`, request.url)
    )
  }
}
