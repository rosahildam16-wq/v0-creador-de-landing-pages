"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Loader2, Sparkles, Zap, ChevronRight, X } from "lucide-react"
import { resumeAudio } from "@/lib/sounds"

// ─── Particle canvas background (Consistent with Reset) ───
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []
    const count = 30

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 1.2 + 0.5,
        alpha: Math.random() * 0.2 + 0.05,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 143, 17, ${p.alpha})`
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 opacity-40" />
}

interface Props {
  onContinue: () => void
  onAbandon?: () => void
  videoSrc?: string
  /** Vimeo or YouTube embed URL - takes priority over videoSrc */
  embedUrl?: string
}

// Video number 3 of TikTok experience in reset funnel
const DEFAULT_EMBED = "https://player.vimeo.com/video/1167999493?badge=0&autopause=0&player_id=0&app_id=58479"

export function DecisionVideo({
  onContinue,
  onAbandon,
  videoSrc,
  embedUrl,
}: Props) {
  const isEmbed = !!embedUrl || (!videoSrc && !!DEFAULT_EMBED)
  const src = embedUrl || (isEmbed ? DEFAULT_EMBED : "")
  const isVimeo = src.includes("vimeo.com")

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

    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-black overflow-hidden">
        <ParticleField />

        <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden bg-black shadow-[0_0_80px_rgba(0,143,17,0.1)] border-x border-white/5">
          {/* Click Shield - Blocks all interaction with the iframe */}
          {started && !videoEnded && (
            <div className="absolute inset-0 z-[5] bg-transparent cursor-default" />
          )}

          {started ? (
            <iframe
              id="exp8-vimeo"
              src={autoplaySrc}
              title="Video de decision"
              className="absolute inset-0 h-full w-full border-0"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              style={{ pointerEvents: 'none' }}
            />
          ) : null}

          {/* Loading */}
          {started && isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
            </div>
          )}

          {/* Play overlay */}
          {!started && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom duration-1000">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block mb-3">Protocolo Fase 08</span>
                <h2 className="text-3xl font-black italic uppercase text-white leading-none">EL MODELO <br /> <span className="text-primary italic-none">REPLICABLE</span></h2>
              </div>
              <button type="button" onClick={handleStart}
                className="group relative flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/20 bg-primary/5 transition-all hover:scale-110 active:scale-95"
                aria-label="Reproducir video">
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
                <Play className="ml-1 h-10 w-10 text-primary" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Cover branding */}
          {started && !videoEnded && (
            <>
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-[3] h-20"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)" }}>
                <div className="flex items-center justify-between px-6 pt-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Live System Capture</span>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary/40" />
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[3] h-20"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }} />
            </>
          )}

          {/* Decision Buttons */}
          {videoEnded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl px-10 text-center animate-in fade-in zoom-in duration-700">
              <div className="mb-10">
                <div className="mx-auto mb-6 h-1 w-10 bg-primary" />
                <h3 className="text-4xl font-black italic uppercase text-white leading-[0.85] tracking-tighter">EL MODELO <br /> <span className="text-primary italic-none">90% AUTOMATIZADO</span></h3>
                <p className="mt-6 text-sm font-medium text-neutral-400">¿Estás listo para resetear tu realidad con una Franquicia 100% Replicable?</p>
              </div>

              <div className="flex w-full flex-col gap-4">
                <button type="button" onClick={onContinue}
                  className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-primary px-6 py-5 text-lg font-black italic text-black shadow-[0_20px_40px_rgba(0,143,17,0.3)] transition-all hover:scale-[1.03] active:scale-[0.98]">
                  <span>VER MI FRANQUICIA</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/10">
                    <Zap className="h-5 w-5 fill-black" strokeWidth={3} />
                  </div>
                </button>

                <button type="button"
                  onClick={onAbandon || (() => window.history.back())}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 py-4 text-xs font-black uppercase tracking-widest text-neutral-500 transition-all hover:bg-white/10 hover:text-white">
                  <X className="h-3 w-3" />
                  ABANDONAR SESIÓN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // LOCAL VIDEO MODE
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (started && videoRef.current) {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Video play error:", error)
        })
      }
    }
  }, [started])

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-black">
      <ParticleField />
      <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden bg-black shadow-2xl border-x border-white/5">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          preload="auto"
          onEnded={() => setVideoEnded(true)}
          onCanPlay={() => setIsLoading(false)}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc} type="video/quicktime" />
        </video>

        {isLoading && started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          </div>
        )}

        {!started && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom duration-1000">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block mb-3">Protocolo Fase 08</span>
              <h2 className="text-3xl font-black italic uppercase text-white leading-none">ÚLTIMA <br /> DECISIÓN</h2>
            </div>
            <button type="button" onClick={handleStart}
              className="group relative flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/20 bg-primary/5 transition-all hover:scale-110 active:scale-95"
              aria-label="Reproducir video">
              <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
              <Play className="ml-1 h-10 w-10 text-primary" fill="currentColor" />
            </button>
          </div>
        )}

        {videoEnded && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl px-10 text-center animate-in fade-in zoom-in duration-700">
            <div className="mb-10">
              <div className="mx-auto mb-6 h-1 w-10 bg-primary" />
              <h3 className="text-4xl font-black italic uppercase text-white leading-[0.85] tracking-tighter">EL MOMENTO <br /> <span className="text-primary italic-none">ES AHORA</span></h3>
            </div>
            <div className="flex w-full flex-col gap-4">
              <button type="button" onClick={onContinue}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-primary px-6 py-5 text-lg font-black italic text-black shadow-[0_20px_40px_rgba(0,143,17,0.3)] transition-all hover:scale-[1.03] active:scale-95">
                <span>ACEPTAR DESAFÍO</span>
                <Zap className="h-5 w-5 fill-black" strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --primary: 127 100% 28%;
          --primary-foreground: 0 100% 100%;
        }
      `}} />
    </div>
  )
}


