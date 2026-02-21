"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Loader2 } from "lucide-react"
import { resumeAudio } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  onAbandon?: () => void
  videoSrc?: string
}

export function DecisionVideo({
  onContinue,
  onAbandon,
  videoSrc = "/images/ultimo-video-reset.mov",
}: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoEnded, setVideoEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      const timer = setTimeout(() => setIsLoading(false), 2000)
      return () => clearTimeout(timer)
    }

    const handleCanPlay = () => setIsLoading(false)

    if (video.readyState >= 3) {
      setIsLoading(false)
      return
    }

    video.addEventListener("canplay", handleCanPlay)
    const timer = setTimeout(() => setIsLoading(false), 4000)

    return () => {
      video.removeEventListener("canplay", handleCanPlay)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100)
      }
    }

    const handleEnded = () => {
      setVideoEnded(true)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  const handlePlay = async () => {
    resumeAudio()
    if (videoRef.current) {
      try {
        videoRef.current.preload = "auto"
        videoRef.current.load()
        await videoRef.current.play()
        setIsPlaying(true)
      } catch {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-black">
      {/* Video Container */}
      <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          preload="metadata"
        >
          <source src={videoSrc} type="video/quicktime" />
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="h-10 w-10 animate-spin text-white/60" />
          </div>
        )}

        {/* Play Overlay */}
        {!isLoading && !isPlaying && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity duration-300"
            aria-label="Reproducir video"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 transition-transform hover:scale-110">
              <Play className="ml-1 h-8 w-8 text-white" fill="currentColor" />
            </div>
          </button>
        )}

        {/* Decision Buttons - appear when video ends */}
        {videoEnded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <div className="flex w-full max-w-xs flex-col gap-4 px-6">
              {/* Abandon button */}
              <button
                type="button"
                onClick={onAbandon || (() => window.history.back())}
                className="w-full rounded-full border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:text-white"
              >
                Abandonar
              </button>
              {/* Advance button */}
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-full px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #7c3aed 100%)",
                  boxShadow: "0 0 24px rgba(99, 102, 241, 0.35), 0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                Avanzar
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isPlaying && !videoEnded && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #4338ca, #6366f1)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
