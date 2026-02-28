/**
 * Magic Video Utility - Phase 3: Speed Lightning
 * Optimized for 100k+ global users
 */

export const VIDEO_CONFIG = {
    CDN_PREFIX: process.env.NEXT_PUBLIC_CDN_PREFIX || "",
}

/**
 * Normalizes a video URL to use the CDN if applicable.
 * For "Unicorn" growth, we move large videos out of /public and to a real CDN.
 */
export function getOptimizedVideoUrl(url: string): string {
    if (!url) return ""
    if (url.startsWith("http") || url.startsWith("blob:") || url.includes("vimeo")) {
        return url
    }

    // If it's a local path from /public, we can prefix it with a CDN if configured
    if (url.startsWith("/")) {
        return `${VIDEO_CONFIG.CDN_PREFIX}${url}`
    }

    return url
}

/**
 * Preloads a video asset to the browser cache for instant-play experience.
 */
export function preloadVideo(url: string) {
    if (typeof window === "undefined") return

    const link = document.createElement("link")
    link.rel = "preload"
    link.as = "video"
    link.href = getOptimizedVideoUrl(url)
    document.head.appendChild(link)
}

/**
 * Checks if a connection is 'slow' to adjust quality or behavior.
 */
export function isSlowConnection(): boolean {
    if (typeof navigator === "undefined") return false
    const conn = (navigator as any).connection
    if (conn) {
        if (conn.saveData) return true
        const effectiveType = conn.effectiveType
        return ["slow-2g", "2g", "3g"].includes(effectiveType)
    }
    return false
}
