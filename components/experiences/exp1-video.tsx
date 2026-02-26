"use client"

import { useState, useEffect } from "react"
import { Play, Loader2 } from "lucide-react"
import { resumeAudio } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  videoSrc?: string
  /** Vimeo or YouTube embed URL - takes priority over videoSrc */
  embedUrl?: string
}

// PLACEHOLDER: Replace this URL with your actual Vimeo/YouTube embed link
const DEFAULT_EMBED = "https://player.vimeo.com/video/1168000494?autoplay=1&muted=1&title=0&byline=0&portrait=0&dnt=1&keyboard=0&controls=0&playsinline=1"

export function VideoPlayer({ onContinue, videoSrc, embedUrl }: Props) {
  const src = embedUrl || DEFAULT_EMBED
  const isVimeo = src.includes("vimeo.com")
  const isEmbed = isVimeo || src.includes("youtube.com")

  const [isLoading, setIsLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  // For local video files (backwards compat)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoError, setVideoError] = useState(false)

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
          const iframe = document.getElementById("exp1-vimeo") as HTMLIFrameElement
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ method: "addEventListener", value: "finish" }), "*")
            iframe.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: 1 }), "*")
            iframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*")
          }
          setIsLoading(false)
        }

        if (data.event === "finish") {
          if (!destroyed) {
            setVideoEnded(true)
            setTimeout(() => onContinue(), 800)
          }
        }
      }
    }

    window.addEventListener("message", handleMessage)

    // Loading fallback
    const loadTimer = setTimeout(() => setIsLoading(false), 4000)
    // Finish fallback (10 min for longer videos)
    const finishTimer = setTimeout(() => {
      if (!destroyed) {
        setVideoEnded(true)
        setTimeout(() => onContinue(), 800)
      }
    }, 600000)

    return () => {
      destroyed = true
      window.removeEventListener("message", handleMessage)
      clearTimeout(loadTimer)
      clearTimeout(finishTimer)
    }
  }, [isEmbed, isVimeo, started, onContinue])

  // YouTube fallback: auto-continue after 60s since YT embed API is limited
  useEffect(() => {
    if (!started || !isEmbed || isVimeo) return
    const t = setTimeout(() => {
      setVideoEnded(true)
      setTimeout(() => onContinue(), 800)
    }, 60000)
    return () => clearTimeout(t)
  }, [started, isEmbed, isVimeo, onContinue])

  const handleStart = () => {
    resumeAudio()
    setStarted(true)
    if (!isEmbed) {
      setIsPlaying(true)
    } else if (isVimeo) {
      // Try to unmute once user interacts
      const iframe = document.getElementById("exp1-vimeo") as HTMLIFrameElement
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: 1 }), "*")
      }
    }
  }

  // EMBED MODE
  if (isEmbed) {
    let autoplaySrc = src
    if (src.includes("?")) {
      autoplaySrc = src.includes("autoplay=")
        ? src.replace(/autoplay=[01]/, "autoplay=1")
        : src + "&autoplay=1"
    } else {
      autoplaySrc = src + "?autoplay=1"
    }

    // Ensure controls are hidden and interaction is blocked at URL level
    if (!autoplaySrc.includes("controls=")) autoplaySrc += "&controls=0"
    if (!autoplaySrc.includes("keyboard=")) autoplaySrc += "&keyboard=0"
    if (!autoplaySrc.includes("pip=")) autoplaySrc += "&pip=0"
    if (!autoplaySrc.includes("playsinline=")) autoplaySrc += "&playsinline=1"
    // CRITICAL: Muted is required for mobile autoplay
    if (!autoplaySrc.includes("muted=")) autoplaySrc += "&muted=1"

    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background">
        <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden rounded-lg bg-black">
          {/* Click Shield - Blocks all interaction with the iframe */}
          {started && !videoEnded && (
            <div className="absolute inset-0 z-[5] bg-transparent cursor-default" />
          )}

          {/* Premium effects */}
          <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          <div className="pointer-events-none absolute inset-0 z-[2] opacity-[0.03] grayscale"
            style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

          {started ? (
            <iframe
              id="exp1-vimeo"
              src={src}
              title="Video"
              className="absolute inset-x-0 top-1/2 z-[1] h-full w-full -translate-y-1/2 border-0"
              style={{ minHeight: "100%", height: "100vh", objectFit: "cover", pointerEvents: 'none' }}
              allow="autoplay; fullscreen; picture-in-picture; playsinline"
              allowFullScreen
            />
          ) : null}

          {/* Scanline effect */}
          {started && (
            <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden opacity-[0.05]">
              <div className="h-2 w-full bg-gradient-to-b from-primary/20 to-transparent animate-scanline"
                style={{ top: '-10%' }} />
            </div>
          )}

          {/* Loading */}
          {started && isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40">Sincronizando</span>
              </div>
            </div>
          )}

          {/* Play overlay */}
          {!started && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={handleStart}
                className="group relative flex h-24 w-24 items-center justify-center transition-all duration-500 hover:scale-110"
                aria-label="Reproducir video"
              >
                {/* Pulsing rings */}
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 duration-[2s]" />
                <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/5 duration-[3s]" />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-background/80 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md transition-colors group-hover:border-primary/50 group-hover:bg-background/90">
                  <Play className="ml-1 h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" fill="currentColor" />
                </div>
              </button>
              <p className="mt-8 animate-pulse text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">Haz clic para iniciar</p>
            </div>
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
        </div>
      </div>
    )
  }

  // LOCAL VIDEO MODE (legacy .mov/.mp4 support)
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background">
      <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden rounded-lg bg-secondary">
        {!videoError ? (
          <video
            className="h-full w-full object-cover"
            playsInline
            preload="auto"
            autoPlay={isPlaying}
            onTimeUpdate={(e) => {
              const v = e.currentTarget
              if (v.duration) setProgress((v.currentTime / v.duration) * 100)
            }}
            onEnded={() => setTimeout(() => onContinue(), 800)}
            onCanPlay={() => setIsLoading(false)}
            onLoadedData={() => setIsLoading(false)}
            onError={(e) => {
              console.log("[v0] Video error:", e)
              setIsLoading(false)
              setVideoError(true)
            }}
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={videoSrc} type="video/quicktime" />
          </video>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">El video no pudo cargarse en este navegador.</p>
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              Continuar
            </button>
          </div>
        )}

        {isLoading && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !isPlaying && !videoError && (
          <button type="button" onClick={handleStart}
            className="absolute inset-0 flex items-center justify-center bg-background/60"
            aria-label="Reproducir video">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/20 hover:scale-110">
              <Play className="ml-1 h-8 w-8 text-primary" fill="currentColor" />
            </div>
          </button>
        )}

        {isPlaying && !videoError && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
