"use client"

import { useState, useEffect } from "react"
import { Play, Loader2 } from "lucide-react"
import { resumeAudio } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  onAbandon?: () => void
  videoSrc?: string
  /** Vimeo or YouTube embed URL - takes priority over videoSrc */
  embedUrl?: string
}

// PLACEHOLDER: Replace with your actual Vimeo/YouTube embed link
const DEFAULT_EMBED = "https://player.vimeo.com/video/REPLACE_WITH_YOUR_VIDEO_ID?autoplay=0&title=0&byline=0&portrait=0&dnt=1"

export function DecisionVideo({
  onContinue,
  onAbandon,
  videoSrc,
  embedUrl,
}: Props) {
  const src = embedUrl || DEFAULT_EMBED
  const isVimeo = src.includes("vimeo.com")
  const isEmbed = isVimeo || src.includes("youtube.com")

  const [isLoading, setIsLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  // Vimeo postMessage listener
  useEffect(() => {
    if (!isEmbed || !started) return
    let destroyed = false

    const handleMessage = (e: MessageEvent) => {
      if (destroyed) return

      if (isVimeo && e.origin === "https://player.vimeo.com") {
        let data: Record<string, unknown>
        try { data = typeof e.data === "string" ? JSON.parse(e.data) : e.data } catch { return }

        if (data.event === "ready") {
          const iframe = document.getElementById("exp8-vimeo") as HTMLIFrameElement
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ method: "addEventListener", value: "finish" }), "*")
            iframe.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: 1 }), "*")
            iframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*")
          }
          setIsLoading(false)
        }

        if (data.event === "finish") {
          if (!destroyed) setVideoEnded(true)
        }
      }
    }

    window.addEventListener("message", handleMessage)
    const loadTimer = setTimeout(() => setIsLoading(false), 4000)
    const finishTimer = setTimeout(() => { if (!destroyed) setVideoEnded(true) }, 300000)

    return () => {
      destroyed = true
      window.removeEventListener("message", handleMessage)
      clearTimeout(loadTimer)
      clearTimeout(finishTimer)
    }
  }, [isEmbed, isVimeo, started])

  // YouTube fallback
  useEffect(() => {
    if (!started || !isEmbed || isVimeo) return
    const t = setTimeout(() => setVideoEnded(true), 60000)
    return () => clearTimeout(t)
  }, [started, isEmbed, isVimeo])

  const handleStart = () => {
    resumeAudio()
    setStarted(true)
  }

  // EMBED MODE
  if (isEmbed) {
    const autoplaySrc = src.includes("?")
      ? src.replace("autoplay=0", "autoplay=1")
      : src + "?autoplay=1"

    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-black">
        <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden bg-black">
          {started ? (
            <iframe
              id="exp8-vimeo"
              src={autoplaySrc}
              title="Video de decision"
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
            />
          ) : null}

          {/* Loading */}
          {started && isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <Loader2 className="h-10 w-10 animate-spin text-white/60" />
            </div>
          )}

          {/* Play overlay */}
          {!started && (
            <button type="button" onClick={handleStart}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/60"
              aria-label="Reproducir video">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 hover:scale-110">
                <Play className="ml-1 h-8 w-8 text-white" fill="currentColor" />
              </div>
            </button>
          )}

          {/* Cover branding */}
          {started && !videoEnded && (
            <>
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-[3] h-14"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[3] h-14"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />
            </>
          )}

          {/* Decision Buttons */}
          {videoEnded && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
              <div className="flex w-full max-w-xs flex-col gap-4 px-6">
                <button type="button"
                  onClick={onAbandon || (() => window.history.back())}
                  className="w-full rounded-full border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:text-white">
                  Abandonar
                </button>
                <button type="button" onClick={onContinue}
                  className="w-full rounded-full px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03]"
                  style={{
                    background: "linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #7c3aed 100%)",
                    boxShadow: "0 0 24px rgba(99, 102, 241, 0.35), 0 4px 16px rgba(0,0,0,0.4)",
                  }}>
                  Avanzar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // LOCAL VIDEO MODE (legacy .mov/.mp4 support)
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-black">
      <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden bg-black">
        <video className="h-full w-full object-cover" playsInline preload="metadata"
          autoPlay={started}
          onEnded={() => setVideoEnded(true)}
          onCanPlay={() => setIsLoading(false)}>
          <source src={videoSrc} type="video/quicktime" />
          <source src={videoSrc} type="video/mp4" />
        </video>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="h-10 w-10 animate-spin text-white/60" />
          </div>
        )}

        {!started && !isLoading && (
          <button type="button" onClick={handleStart}
            className="absolute inset-0 flex items-center justify-center bg-black/60"
            aria-label="Reproducir video">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 hover:scale-110">
              <Play className="ml-1 h-8 w-8 text-white" fill="currentColor" />
            </div>
          </button>
        )}

        {videoEnded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <div className="flex w-full max-w-xs flex-col gap-4 px-6">
              <button type="button" onClick={onAbandon || (() => window.history.back())}
                className="w-full rounded-full border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white/80 backdrop-blur-md">
                Abandonar
              </button>
              <button type="button" onClick={onContinue}
                className="w-full rounded-full px-8 py-4 text-base font-bold text-white"
                style={{ background: "linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #7c3aed 100%)" }}>
                Avanzar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
