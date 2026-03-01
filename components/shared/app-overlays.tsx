"use client"

import { usePathname } from "next/navigation"
import { MagicSupportAI } from "./magic-support-ai"
import { CookieConsent } from "@/components/legal/cookie-consent"

export function AppOverlays() {
    const pathname = usePathname()

    // Routes where we DON'T want the support bot and cookie consent (high conversion funnels)
    const isFunnelRoute =
        pathname?.startsWith("/r/") ||
        pathname?.startsWith("/s/") ||
        pathname === "/funnel" ||
        pathname?.startsWith("/funnel/")

    if (isFunnelRoute) return null

    return (
        <>
            <CookieConsent />
            <MagicSupportAI />
        </>
    )
}
