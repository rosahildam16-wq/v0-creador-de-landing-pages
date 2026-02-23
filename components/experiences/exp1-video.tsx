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
const DEFAULT_EMBED = "https://player.vimeo.com/video/REPLACE_WITH_YOUR_VIDEO_ID?autoplay=0&title=0&byline=0&portrait=0&dnt=1"

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
    // Finish fallback (5 min)
    const finishTimer = setTimeout(() => {
      if (!destroyed) {
        setVideoEnded(true)
        setTimeout(() => onContinue(), 800)
      }
    }, 300000)

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
    if (!isEmbed) setIsPlaying(true)
  }

  // EMBED MODE
  if (isEmbed) {
    const autoplaySrc = src.includes("?")
      ? src.replace("autoplay=0", "autoplay=1")
      : src + "?autoplay=1"

    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background">
        <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden rounded-lg bg-black">
          {started ? (
            <iframe
              id="exp1-vimeo"
              src={autoplaySrc}
              title="Video"
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
            />
          ) : null}

          {/* Loading */}
          {started && isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          {/* Play overlay */}
          {!started && (
            <button
              type="button"
              onClick={handleStart}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 transition-opacity duration-300"
              aria-label="Reproducir video"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/20 transition-transform hover:scale-110">
                <Play className="ml-1 h-8 w-8 text-primary" fill="currentColor" />
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
        </div>
      </div>
    )
  }

  // LOCAL VIDEO MODE (legacy .mov/.mp4 support)
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background">
      <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden rounded-lg bg-secondary">
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
          onError={() => setIsLoading(false)}
          src={videoSrc}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc} type="video/quicktime" />
        </video>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !isPlaying && (
          <button type="button" onClick={handleStart}
            className="absolute inset-0 flex items-center justify-center bg-background/60"
            aria-label="Reproducir video">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/20 hover:scale-110">
              <Play className="ml-1 h-8 w-8 text-primary" fill="currentColor" />
            </div>
          </button>
        )}

        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
