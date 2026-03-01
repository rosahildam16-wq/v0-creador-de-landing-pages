"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { MagicSupportAI } from "./magic-support-ai"
import { CookieConsent } from "@/components/legal/cookie-consent"
import { Suspense } from "react"
import { useAuth } from "@/lib/auth-context"

function OverlaysContent() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { isAuthenticated } = useAuth()

    // Comprehensive check for funnel routes
    const isFunnelRoute =
        pathname?.startsWith("/r/") ||
        pathname?.startsWith("/s/") ||
        pathname === "/funnel" ||
        pathname?.startsWith("/funnel/") ||
        searchParams?.has("embudo") ||
        pathname?.includes("nomada") ||
        pathname?.includes("reset")

    const isLoginRoute = pathname === "/login" || pathname === "/"

    if (isFunnelRoute || isLoginRoute || !isAuthenticated) return (
        <>
            <CookieConsent />
        </>
    )

    return (
        <>
            <CookieConsent />
            <MagicSupportAI />
        </>
    )
}

export function AppOverlays() {
    return (
        <Suspense fallback={null}>
            <OverlaysContent />
        </Suspense>
    )
}
