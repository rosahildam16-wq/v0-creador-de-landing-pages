"use client"

import { useEffect, useState } from "react"
import Script from "next/script"

declare global {
    interface Window {
        fbq: (...args: any[]) => void
        _fbq: any
    }
}

interface MetaPixelProps {
    pixelId?: string
    embudoId?: string
}

/**
 * Meta Pixel component — loads pixel per-funnel (like Hotmart).
 * Priority: 1) embudoId-specific config from DB  2) pixelId prop  3) env var
 */
export function MetaPixel({ pixelId, embudoId }: MetaPixelProps) {
    const [resolvedPixelId, setResolvedPixelId] = useState(pixelId || "")

    useEffect(() => {
        if (pixelId) {
            setResolvedPixelId(pixelId)
            return
        }

        // Auto-load from API based on embudoId
        const fetchPixel = async () => {
            try {
                const query = embudoId ? `embudo_id=${embudoId}` : "embudo_id=global"
                const res = await fetch(`/api/pixel/config?${query}`)
                const data = await res.json()
                if (data.pixel_id && data.enabled) {
                    setResolvedPixelId(data.pixel_id)
                }
            } catch {
                // Fallback to env
                const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID
                if (envPixel) setResolvedPixelId(envPixel)
            }
        }
        fetchPixel()
    }, [pixelId, embudoId])

    if (!resolvedPixelId) return null

    return (
        <>
            <Script
                id="meta-pixel-base"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${resolvedPixelId}');
                        fbq('track', 'PageView');
                    `.trim()
                }}
            />
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${resolvedPixelId}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    )
}

// ─── Pixel Event Helpers (call from anywhere) ───

/**
 * Track standard event. Use after lead registration.
 */
export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", eventName, params)
    }
}

/**
 * Track custom event. For funnel-specific events.
 */
export function trackMetaCustomEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("trackCustom", eventName, params)
    }
}

// ─── Pre-built Funnel Events (like Hotmart) ───

/**
 * Fire when someone registers as a lead in the quiz.
 * Standard "Lead" event — Meta optimizes for this.
 */
export function pixelTrackLead(embudoId: string) {
    trackMetaEvent("Lead", {
        content_name: embudoId,
        content_category: "funnel_registration",
    })
}

/**
 * Fire when someone completes the quiz/diagnostic.
 * Standard "CompleteRegistration" event.
 */
export function pixelTrackCompleteRegistration(embudoId: string) {
    trackMetaEvent("CompleteRegistration", {
        content_name: embudoId,
        content_category: "funnel_diagnostic",
    })
}

/**
 * Fire when someone clicks the WhatsApp CTA (final conversion).
 * Standard "Contact" event — Meta counts this as a conversion.
 */
export function pixelTrackContact(embudoId: string) {
    trackMetaEvent("Contact", {
        content_name: embudoId,
        content_category: "whatsapp_cta",
    })
}

/**
 * Fire when someone reaches the sales page.
 * Standard "ViewContent" event.
 */
export function pixelTrackViewContent(embudoId: string, stepName: string) {
    trackMetaEvent("ViewContent", {
        content_name: embudoId,
        content_category: stepName,
    })
}
