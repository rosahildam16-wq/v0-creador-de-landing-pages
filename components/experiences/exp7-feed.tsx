"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Search,
  Home,
  Users,
  Plus,
  MessageSquare,
  User,
  Music,
  X,
  Rocket,
  ChevronRight,
} from "lucide-react"

import { playSwipe, playRestrictedAlert } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  firstVideoEmbed?: string
  customSlides?: VideoSlide[]
  customComments?: typeof comments
}

interface VideoSlide {
  image?: string
  videoEmbed?: string
  videoSrc?: string
  overlayText: string[]
  username: string
  caption: string
  music: string
  likes: string
  commentCount: string
  saves: string
  shares: string
}

const slides: VideoSlide[] = [
  {
    videoEmbed: "https://player.vimeo.com/video/1167997342?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&playsinline=1",
    overlayText: [],
    username: "Vamonos de viaje",
    caption: "",
    music: "",
    likes: "366.3 mil",
    commentCount: "359",
    saves: "22 mil",
    shares: "52.4 mil",
  },
  {
    videoEmbed: "https://player.vimeo.com/video/1168000494?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&playsinline=1",
    overlayText: [],
    username: "nomada.digital",
    caption: "#vidanomada #libertadfinanciera #viajes #fyp",
    music: "Sonido original - nomada.digital",
    likes: "214.7 mil",
    commentCount: "1,203",
    saves: "45 mil",
    shares: "31.2 mil",
  },
  {
    videoEmbed: "https://player.vimeo.com/video/1167999493?autoplay=1&muted=1&controls=0&title=0&byline=0&portrait=0&playsinline=1",
    overlayText: [],
    username: "escape.sistema",
    caption: "#emprendedor #viajarporelmundo #dinerodigital #fyp",
    music: "Money - Lisa",
    likes: "589.1 mil",
    commentCount: "2,847",
    saves: "67 mil",
    shares: "88.3 mil",
  },
  {
    image: "/images/tiktok-beach3.jpg",
    overlayText: ["No es suerte", "Es decisi\u00f3n"],
    username: "escape.sistema",
    caption: "#emprendedor #viajarporelmundo #dinerodigital #fyp",
    music: "Money - Lisa",
    likes: "589.1 mil",
    commentCount: "2,847",
    saves: "67 mil",
    shares: "88.3 mil",
  },
]

const comments = [
  { user: "maria_viajera23", text: "Yo quiero aprender a hacer esto! Como le hago?", likes: 1243 },
  { user: "carlos.mundo", text: "Llevo 2 a\u00f1os queriendo viajar pero no se como generar ingresos", likes: 892 },
  { user: "laura_libre", text: "Esto es real?? Yo necesito salir de la rutina ya!", likes: 2104 },
  { user: "andres_nomada", text: "Yo deje mi trabajo hace 6 meses y fue la mejor decision", likes: 3421 },
  { user: "sofi.dreams", text: "Me da miedo dejarlo todo pero tambien me da miedo quedarme igual", likes: 1567 },
  { user: "diego_travel", text: "Alguien que me explique como generar dinero viajando por favor", likes: 743 },
  { user: "vale.aventura", text: "Estoy en Bali trabajando remoto y es lo mejor que he hecho", likes: 4210 },
  { user: "juanpa_free", text: "El sistema nos tiene atrapados. Hay que buscar la salida", likes: 1890 },
  { user: "camila.nomad", text: "Quien mas siente que nacio para algo mas grande?", likes: 5632 },
  { user: "roberto_viajes", text: "Empece sin nada y ahora viajo 8 meses al a\u00f1o", likes: 2987 },
  { user: "ana.destino", text: "Necesito esa llave!! Como entro al grupo privado?", likes: 1345 },
  { user: "pedro_mundo", text: "Mis papas dicen que estoy loco pero yo se que es posible", likes: 876 },
]

const commentTimes = [
  "2h", "4h", "7h", "1h", "5h", "12h", "3h", "8h", "6h", "9h", "11h", "15h",
]

function formatLikes(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k"
  return n.toString()
}

export function TikTokFeed({ onContinue, firstVideoEmbed, customSlides, customComments }: Props) {
  const activeSlides = customSlides
    ? customSlides
    : firstVideoEmbed
      ? slides.map((s, i) => (i === 0 ? { ...s, videoEmbed: firstVideoEmbed } : s))
      : slides
  const activeComments = customComments || comments

  const [showComments, setShowComments] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [likedSlides, setLikedSlides] = useState<Record<number, boolean>>({})
  const [savedSlides, setSavedSlides] = useState<Record<number, boolean>>({})
  const [heartBurst, setHeartBurst] = useState<number | null>(null)
  const [videoFinished, setVideoFinished] = useState<Record<number, boolean>>({})
  const [videoPlaying, setVideoPlaying] = useState<Record<number, boolean>>({})
  const [showPlayIcon, setShowPlayIcon] = useState<Record<number, boolean>>({})
  const [swipeHint, setSwipeHint] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const lastTapRef = useRef(0)
  const touchStartYRef = useRef(0)
  const playIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentSlide = activeSlides[activeSlide]
  const currentSlideHasVideo = !!currentSlide?.videoEmbed || !!currentSlide?.videoSrc
  const isLast = activeSlide === activeSlides.length - 1
  const canAdvance = videoFinished[activeSlide] || !currentSlideHasVideo

  // Cleanup or other effects
  useEffect(() => {
    // playRestrictedAlert() // Removed to avoid confusion
  }, [])

  // Auto-play video (Vimeo or Local) when slide becomes active
  useEffect(() => {
    const slide = activeSlides[activeSlide]
    if (!slide) return

    // Local Video
    if (slide.videoSrc && videoRef.current) {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => console.error("TikTok local auto-play error:", error))
      }
    }

    // Vimeo Video
    if (slide.videoEmbed) {
      const iframe = document.getElementById(`vimeo-player-${activeSlide}`) as HTMLIFrameElement
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*")
        iframe.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: 1 }), "*")
      }
    }
  }, [activeSlide, activeSlides])

  // ── Toggle play/pause (Vimeo or Local) ──
  const togglePlay = useCallback((slideIndex: number) => {
    const slide = activeSlides[slideIndex]

    // Case 1: Local Video
    if (slide.videoSrc && slideIndex === activeSlide) {
      if (videoRef.current) {
        if (videoPlaying[slideIndex]) {
          videoRef.current.pause()
          setVideoPlaying((prev) => ({ ...prev, [slideIndex]: false }))
          setShowPlayIcon((prev) => ({ ...prev, [slideIndex]: true }))
        } else {
          videoRef.current.play()
          setVideoPlaying((prev) => ({ ...prev, [slideIndex]: true }))
          setShowPlayIcon((prev) => ({ ...prev, [slideIndex]: true }))
          if (playIconTimerRef.current) clearTimeout(playIconTimerRef.current)
          playIconTimerRef.current = setTimeout(() => {
            setShowPlayIcon((prev) => ({ ...prev, [slideIndex]: false }))
          }, 600)
        }
      }
      return
    }

    // Case 2: Vimeo
    const iframe = document.getElementById(`vimeo-player-${slideIndex}`) as HTMLIFrameElement
    if (!iframe?.contentWindow) return

    const isPlaying = videoPlaying[slideIndex]
    if (isPlaying) {
      iframe.contentWindow.postMessage(JSON.stringify({ method: "pause" }), "*")
      setVideoPlaying((prev) => ({ ...prev, [slideIndex]: false }))
      setShowPlayIcon((prev) => ({ ...prev, [slideIndex]: true }))
    } else {
      iframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*")
      iframe.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: 1 }), "*")
      setVideoPlaying((prev) => ({ ...prev, [slideIndex]: true }))
      // Show pause icon briefly then hide
      setShowPlayIcon((prev) => ({ ...prev, [slideIndex]: true }))
      if (playIconTimerRef.current) clearTimeout(playIconTimerRef.current)
      playIconTimerRef.current = setTimeout(() => {
        setShowPlayIcon((prev) => ({ ...prev, [slideIndex]: false }))
      }, 600)
    }
  }, [videoPlaying, activeSlide, activeSlides])

  // ── Vimeo / YouTube: listen for postMessage to detect video end ──
  useEffect(() => {
    if (!currentSlideHasVideo) return

    const slideIndex = activeSlide
    const isVimeo = currentSlide?.videoEmbed?.includes("vimeo.com")
    const isYouTube = currentSlide?.videoEmbed?.includes("youtube.com")

    if (!isVimeo && !isYouTube) return

    let destroyed = false

    const handleMessage = (e: MessageEvent) => {
      if (destroyed) return

      // Vimeo postMessage API
      if (isVimeo && e.origin === "https://player.vimeo.com") {
        let data: Record<string, any>
        try {
          data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
        } catch { return }

        // Setup listeners on ready OR on specific ping
        if (data.event === "ready" || data.method === "ping") {
          console.log("TikTokFeed: Vimeo Ready, setting up listeners for slide", slideIndex)
          const iframe = document.getElementById(`vimeo-player-${slideIndex}`) as HTMLIFrameElement
          if (iframe?.contentWindow) {
            const methods = ["addEventListener", "play", "pause", "finish", "ended"]
            methods.forEach(method => {
              iframe.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: method }), "*")
            })
            iframe.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: 1 }), "*")
            // Try to force play
            iframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*")
          }
        }

        if (data.event === "play" || data.method === "onPlay") {
          if (!destroyed) setVideoPlaying((prev) => ({ ...prev, [slideIndex]: true }))
        }

        if (data.event === "pause" || data.method === "onPause") {
          if (!destroyed) setVideoPlaying((prev) => ({ ...prev, [slideIndex]: false }))
        }

        if (data.event === "finish" || data.event === "ended" || data.method === "onFinish") {
          console.log("TikTokFeed: Vimeo Video Finished event received for slide", slideIndex)
          if (!destroyed) setVideoFinished((prev) => ({ ...prev, [slideIndex]: true }))
        }
      }

      // YouTube postMessage API
      if (isYouTube && typeof e.data === "string") {
        try {
          const data = JSON.parse(e.data)
          if (data?.event === "onStateChange" && (data?.info === 0)) {
            if (!destroyed) setVideoFinished((prev) => ({ ...prev, [slideIndex]: true }))
          }
        } catch { /* ignored */ }
      }
    }

    window.addEventListener("message", handleMessage)

    // Proactive setup: Send listeners very frequently for first 20s
    const setupInterval = setInterval(() => {
      const iframe = document.getElementById(`vimeo-player-${slideIndex}`) as HTMLIFrameElement
      if (iframe?.contentWindow && isVimeo) {
        const methods = ["addEventListener", "play", "pause", "finish", "ended", "onFinish"]
        methods.forEach(m => {
          iframe.contentWindow?.postMessage(JSON.stringify({ method: "addEventListener", value: m }), "*")
        })
        iframe.contentWindow.postMessage(JSON.stringify({ method: "play" }), "*")
      }
    }, 1000)

    const stopSetupT = setTimeout(() => clearInterval(setupInterval), 20000)

    return () => {
      destroyed = true
      window.removeEventListener("message", handleMessage)
      clearInterval(setupInterval)
      clearTimeout(stopSetupT)
    }
  }, [activeSlide, currentSlideHasVideo, currentSlide?.videoEmbed])

  // ── Go to next slide (programmatic, no scroll) ──
  const goNext = useCallback(() => {
    if (!canAdvance || transitioning) return
    if (isLast) {
      onContinue()
      return
    }
    setTransitioning(true)
    setActiveSlide((prev) => prev + 1)
    setTimeout(() => setTransitioning(false), 400)
  }, [canAdvance, transitioning, isLast, onContinue])

  // ── Show swipe hint when video ends ──
  useEffect(() => {
    setSwipeHint(false)
    if (currentSlideHasVideo) {
      if (videoFinished[activeSlide]) {
        setSwipeHint(true)
        // Auto-advance after 5 seconds if not swiped, unless it's the last slide
        if (!isLast) {
          const t = setTimeout(() => {
            goNext()
          }, 5000)
          return () => clearTimeout(t)
        }
      }
    } else {
      const t = setTimeout(() => setSwipeHint(true), 6000)
      return () => clearTimeout(t)
    }
  }, [activeSlide, currentSlideHasVideo, videoFinished, isLast, goNext])

  // ── Preload/Auto-advance ──
  useEffect(() => {
    // 1. Preload NEXT slide for Speed Lightning
    if (activeSlide < activeSlides.length - 1) {
      const nextSlide = activeSlides[activeSlide + 1]
      const nextVid = nextSlide.videoSrc || nextSlide.videoEmbed
      if (nextVid && typeof window !== "undefined") {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = (nextSlide.videoSrc) ? "video" : "document"
        link.href = nextVid
        document.head.appendChild(link)
      }
    }

    // 2. Auto-swipe logic (Last slide only or wait for user action)
    if (isLast && videoFinished[activeSlide]) {
      const t = setTimeout(() => {
        onContinue()
      }, 5000) // Longer delay on last slide to let them see the success screen
      return () => clearTimeout(t)
    }

    // NOTE: Removed automatic goNext() for intermediate slides 
    // to let users watch the full videos at their own pace.
  }, [isLast, activeSlide, videoFinished, onContinue, goNext, activeSlides])

  // ── Safety Fallbacks for "Unicorn" Resilience ──
  useEffect(() => {
    if (!currentSlideHasVideo) return
    const slideIndex = activeSlide

    // Safety fallback: 180s max to prevent getting truly stuck if connection fails
    // This is much safer than the previous short timers.
    const finishFallback = setTimeout(() => {
      if (!videoFinished[slideIndex]) {
        console.warn("TikTokFeed: Universal safety fallback triggered for slide", slideIndex)
        setVideoFinished((prev) => ({ ...prev, [slideIndex]: true }))
      }
    }, 60000)

    return () => clearTimeout(finishFallback)
  }, [activeSlide, currentSlideHasVideo, videoFinished])

  // ── Touch swipe detection ──
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartYRef.current - e.changedTouches[0].clientY
    if (diff > 60 && canAdvance) {
      goNext()
    }
  }, [goNext, canAdvance])

  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setLikedSlides((prev) => ({ ...prev, [activeSlide]: true }))
      setHeartBurst(activeSlide)
      setTimeout(() => setHeartBurst(null), 800)
    }
    lastTapRef.current = now
  }, [activeSlide])

  const toggleLike = (idx: number) => {
    setLikedSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const toggleSave = (idx: number) => {
    setSavedSlides((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const current = activeSlides[activeSlide]

  return (
    <div className="relative flex h-dvh w-full flex-col bg-black">
      {/* ── Top navigation bar ── */}
      <div
        className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 pb-2 pt-11"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)" }}
      >
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="12" height="9" rx="1.5" />
            <path d="M14 9l5-2.5v11L14 15V9z" />
          </svg>
          <span className="text-[11px] font-bold tracking-wide text-white">LIVE</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[14px] text-white/60">Explorar</span>
          <span className="relative text-[14px] text-white/60">
            Siguiendo
            <span className="absolute -right-1.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          <span className="relative text-[14px] font-bold text-white">
            Para ti
            <span className="absolute -bottom-1.5 left-1/2 h-[2px] w-7 -translate-x-1/2 rounded-full bg-white" />
          </span>
        </div>

        <Search className="h-5 w-5 text-white" />
      </div>

      {/* ── Single slide view (no scroll, touch-controlled) ── */}
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={handleDoubleTap}
      >
        {activeSlides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-transform duration-400 ease-out"
            style={{
              transform: i < activeSlide ? "translateY(-100%)" : i === activeSlide ? "translateY(0)" : "translateY(100%)",
              zIndex: i === activeSlide ? 10 : 0,
            }}
          >
            {/* Background image or video */}
            {slide.videoSrc ? (
              <video
                ref={i === activeSlide ? videoRef : null}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted={i !== activeSlide}
                onEnded={() => setVideoFinished((prev) => ({ ...prev, [i]: true }))}
                onPlay={() => setVideoPlaying((prev) => ({ ...prev, [i]: true }))}
                onPause={() => setVideoPlaying((prev) => ({ ...prev, [i]: false }))}
                preload="auto"
              >
                <source src={slide.videoSrc} type="video/mp4" />
                <source src={slide.videoSrc} type="video/quicktime" />
              </video>
            ) : slide.videoEmbed ? (
              <>
                {/* Load iframe for active slide and next slide for preloading */}
                {(i === activeSlide || i === activeSlide + 1) ? (
                  <iframe
                    id={`vimeo-player-${i}`}
                    src={slide.videoEmbed}
                    title="Video"
                    className="absolute inset-0 z-[2] h-full w-full border-0"
                    style={{ pointerEvents: "none" }}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 bg-black" />
                )}

                {/* Cover Vimeo branding: top-left strip */}
                <div className="pointer-events-none absolute left-0 right-0 top-0 z-[3] h-16"
                  style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
                />
                {/* Cover Vimeo branding: bottom-right strip */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[3] h-16"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
                />
              </>
            ) : (
              <img
                src={slide.image || "/placeholder.svg"}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            )}

            {/* Custom play/pause overlay button */}
            {i === activeSlide && currentSlideHasVideo && !videoFinished[i] && (
              <button
                type="button"
                className="absolute inset-0 z-[4] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay(i)
                }}
                aria-label={videoPlaying[i] ? "Pausar" : "Reproducir"}
              >
                {/* Show play icon when paused, or brief pause icon feedback */}
                {(!videoPlaying[i] || showPlayIcon[i]) && (
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-opacity ${videoPlaying[i] ? "opacity-0" : "opacity-100"}`}>
                    {videoPlaying[i] ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.5-7.36a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z" />
                      </svg>
                    )}
                  </div>
                )}
              </button>
            )}

            {/* When video ends, show finished overlay with notice - ONLY ON LAST SLIDE */}
            {videoFinished[i] && isLast && i === activeSlide && (
              <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="mb-6 flex animate-bounce flex-col items-center gap-2">
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">
                    <Rocket className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">FASE COMPLETADA</h3>
                <p className="text-base text-white/70 text-center px-10 leading-relaxed max-w-[320px]">
                  Has descubierto el sistema. Ahora es momento de entrar en acción y escalar tu negocio.
                </p>

                <div className="mt-10 flex flex-col items-center gap-5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onContinue() }}
                    className="flex items-center gap-3 rounded-full bg-primary px-10 py-4 text-base font-black text-white shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-transform hover:scale-105 active:scale-95"
                  >
                    ACCEDER A LA SOLUCIÓN
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] animate-pulse">Tranquilidad absoluta garantizada</p>
                </div>
              </div>
            )}

            {/* Double-tap heart animation */}
            {heartBurst === i && (
              <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
                <Heart className="h-24 w-24 animate-ping fill-red-500 text-red-500" />
              </div>
            )}

            {/* Center overlay text */}
            <div
              className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-0.5 px-12"
              style={{ top: "28%" }}
            >
              {slide.overlayText.map((line, j) => (
                <p
                  key={j}
                  className="text-center text-lg font-semibold text-white"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Right sidebar actions */}
            <div className="absolute bottom-12 right-2 z-20 flex flex-col items-center gap-2">
              {/* Profile pic */}
              <div className="relative mb-1">
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-neutral-800">
                  <img
                    src="/images/avatar_tiktok.jpg"
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-red-500">
                  <Plus className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </div>
              </div>

              {/* Like */}
              <button
                type="button"
                className="flex flex-col items-center"
                onClick={(e) => { e.stopPropagation(); toggleLike(i) }}
              >
                <Heart
                  className={`h-6 w-6 ${likedSlides[i] ? "fill-red-500 text-red-500" : "text-white"}`}
                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
                />
                <span className="text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                  {slide.likes}
                </span>
              </button>

              {/* Comments */}
              <button
                type="button"
                className="flex flex-col items-center"
                onClick={(e) => { e.stopPropagation(); setShowComments(true) }}
              >
                <MessageCircle
                  className="h-6 w-6 text-white"
                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
                />
                <span className="text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                  {slide.commentCount}
                </span>
              </button>

              {/* Bookmark */}
              <button
                type="button"
                className="flex flex-col items-center"
                onClick={(e) => { e.stopPropagation(); toggleSave(i) }}
              >
                <Bookmark
                  className={`h-6 w-6 ${savedSlides[i] ? "fill-yellow-400 text-yellow-400" : "text-white"}`}
                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
                />
                <span className="text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                  {slide.saves}
                </span>
              </button>

              {/* Share */}
              <button type="button" className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <Share2
                  className="h-6 w-6 text-white"
                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
                />
                <span className="text-[10px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                  {slide.shares}
                </span>
              </button>

              {/* Spinning disc */}
              <div className="h-8 w-8 rounded-lg border border-white/20 bg-neutral-800" />
            </div>

            {/* Bottom info - title (caption) only */}
            <div className="absolute bottom-10 left-3 right-16 z-20">
              {slide.caption && (
                <p
                  className="text-[15px] font-bold text-white"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
                >
                  {slide.caption}
                </p>
              )}
            </div>

            {/* Swipe up hint (clickeable) - on non-last slides */}
            {swipeHint && i === activeSlide && !isLast && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute inset-x-0 bottom-28 z-[40] flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700"
              >
                <div className="flex animate-bounce flex-col items-center gap-1">
                  <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow-lg">
                      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="rounded-full border border-white/20 bg-primary/80 px-6 py-2 text-xs font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md"
                  >
                    Desliza para continuar
                  </span>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Siguiente video disponible</p>
                </div>
              </button>
            )}

            {/* Continue button on last slide when video finishes */}
            {i === activeSlide && isLast && videoFinished[i] && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onContinue() }}
                className="absolute inset-x-0 bottom-28 z-30 flex flex-col items-center gap-3"
              >
                <div className="flex animate-bounce flex-col items-center gap-1">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow-lg">
                    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span
                  className="rounded-full border border-white/20 bg-primary/90 px-6 py-2.5 text-sm font-bold text-white shadow-lg backdrop-blur-md"
                >
                  Continuar
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Bottom navigation bar ── */}
      <div className="relative z-30 flex items-center justify-around bg-black px-2 pb-5 pt-2">
        <div className="flex flex-col items-center gap-0.5">
          <Home className="h-5 w-5 text-white" fill="white" />
          <span className="text-[10px] text-white">Inicio</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Users className="h-5 w-5 text-white/50" />
          <span className="text-[10px] text-white/50">Amigos</span>
        </div>
        <div className="flex h-8 w-12 items-center justify-center rounded-lg bg-white">
          <Plus className="h-5 w-5 text-black" strokeWidth={3} />
        </div>
        <div className="relative flex flex-col items-center gap-0.5">
          <MessageSquare className="h-5 w-5 text-white/50" />
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
            30
          </span>
          <span className="text-[10px] text-white/50">Mensajes</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <User className="h-5 w-5 text-white/50" />
          <span className="text-[10px] text-white/50">Perfil</span>
        </div>
      </div>

      {/* ── Comments Sheet ── */}
      {showComments && (
        <div className="absolute inset-0 z-50" onClick={() => setShowComments(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 flex max-h-[60dvh] flex-col rounded-t-2xl bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2">
              <div className="h-1 w-8 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm font-semibold text-white">
                {current?.commentCount || "359"} comentarios
              </span>
              <button type="button" onClick={() => setShowComments(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="h-px bg-white/10" />

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
              <div className="flex flex-col gap-5">
                {activeComments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-medium text-white/60">
                      {c.user[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/40">{c.user}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-white/90">{c.text}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[10px] text-white/30">{commentTimes[i]}</span>
                        <span className="text-[10px] text-white/30">Responder</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 pt-3">
                      <Heart className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-[9px] text-white/30">{formatLikes(c.likes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment input */}
            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-3 rounded-full bg-neutral-800 px-4 py-2.5">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-600 text-[10px] text-white/50">
                  U
                </div>
                <span className="text-sm text-white/30">Agrega un comentario...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
