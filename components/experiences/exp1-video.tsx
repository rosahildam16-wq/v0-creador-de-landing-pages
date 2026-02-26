"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Loader2 } from "lucide-react"
import { resumeAudio } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  videoSrc?: string
  /** Vimeo or YouTube embed URL - takes priority over videoSrc */
  embedUrl?: string
}

// Default video for the funnel
const DEFAULT_EMBED = "https://player.vimeo.com/video/1167958594?autoplay=1&muted=0&badge=0&autopause=0&player_id=0&app_id=58479&playsinline=1"

export function VideoPlayer({ onContinue, videoSrc, embedUrl }: Props) {
  const src = embedUrl || DEFAULT_EMBED
  const isVimeo = src.includes("vimeo.com")
  const isEmbed = isVimeo || src.includes("youtube.com")

  const [isLoading, setIsLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for video finish via postMessage
  useEffect(() => {
    if (!started) return

    const handleMessage = (event: MessageEvent) => {
      // Vimeo message handling
      if (isVimeo && event.origin === "https://player.vimeo.com") {
        let data
        try {
          data = typeof event.data === "string" ? JSON.parse(event.data) : event.data
        } catch { return }

        if (data.event === "ready") {
          setIsLoading(false)
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "addEventListener", value: "finish" }), "*")
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: 1 }), "*")
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "setMuted", value: false }), "*")
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*")
          }
        }

        if (data.event === "finish") {
          setVideoEnded(true)
          setTimeout(onContinue, 1000)
        }
      }
    };

    window.addEventListener("message", handleMessage)

    // Safety fallback: if video doesn't "finish", allow skip after 60s
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [started, isVimeo, onContinue])

  const handleStart = () => {
    resumeAudio()
    setStarted(true)
  }

  // Pre-process URL to ensure mobile-friendly params and HIDE ALL CONTROLS
  const finalSrc = src.includes("?")
    ? `${src}&badge=0&autopause=0&playsinline=1&controls=0&title=0&byline=0&portrait=0&dnt=1`
    : `${src}?badge=0&autopause=0&playsinline=1&controls=0&title=0&byline=0&portrait=0&dnt=1`

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-neutral-950">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#ffffff10_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md aspect-[9/16] bg-black shadow-2xl overflow-hidden">
        {started ? (
          <>
            <iframe
              ref={iframeRef}
              id="exp1-vimeo"
              src={finalSrc}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; playsinline"
              allowFullScreen
              style={{ pointerEvents: 'none', objectFit: 'cover' }}
            />
            {/* Click Shield */}
            <div className="absolute inset-0 z-[5] bg-transparent" />

            {/* Overlay Gradient for high-end look */}
            <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/40" />

            {/* Scanline Animation */}
            <div className="absolute inset-0 z-[3] pointer-events-none opacity-[0.03] overflow-hidden">
              <div className="w-full h-4 bg-white/20 animate-scanline shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>

            {isLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Conectando...</span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Thumbnail Placeholder or Background */}
            <div className="absolute inset-0 bg-neutral-900 opacity-50" />

            {/* Large Central Play Button */}
            <button
              onClick={handleStart}
              className="group relative z-30 flex flex-col items-center gap-6"
            >
              <div className="relative flex h-24 w-24 items-center justify-center">
                {/* Pulsing circles */}
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 duration-[2s]" />
                <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/10 duration-[3s]" />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-black/80 shadow-[0_0_40px_rgba(34,211,238,0.2)] backdrop-blur-xl transition-all duration-300 group-hover:scale-110 group-hover:border-primary">
                  <Play className="ml-1 h-8 w-8 text-primary" fill="currentColor" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[12px] font-bold uppercase tracking-[0.5em] text-primary/80">Iniciar Experiencia</span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-white/30">Toca para desbloquear</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 z-10">
        <p className="text-[8px] font-medium uppercase tracking-[0.4em] text-white/20">© SKALIA LATAM - MASTERCLASS PRO</p>
      </div>

      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scanline {
          animation: scanline 4s linear infinite;
        }
      `}</style>
    </div>
  )
}
