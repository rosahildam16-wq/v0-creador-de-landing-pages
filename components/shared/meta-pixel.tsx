"use client"

import { useEffect } from "react"
import Script from "next/script"

declare global {
    interface Window {
        fbq: (...args: any[]) => void
        _fbq: any
    }
}

interface MetaPixelProps {
    pixelId?: string
}

/**
 * Meta Pixel component.
 * Injects Facebook/Meta pixel script into the page.
 * Similar to how Hotmart handles pixel integration.
 * 
 * Usage:
 *   <MetaPixel pixelId="123456789" />
 * 
 * To track events:
 *   window.fbq?.('track', 'Lead', { content_name: 'funnel-xyz' })
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
    if (!pixelId) return null

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
                        fbq('init', '${pixelId}');
                        fbq('track', 'PageView');
                    `.trim()
                }}
            />
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    )
}

/**
 * Helper function to fire Meta Pixel events from anywhere.
 * Call this after a lead registers to track conversions.
 */
export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", eventName, params)
    }
}
