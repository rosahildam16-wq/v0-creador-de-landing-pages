"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Loader2 } from "lucide-react"
import { resumeAudio } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  videoSrc?: string
}

export function VideoPlayer({ onContinue, videoSrc = "/images/nomada-3.mov" }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      const timer = setTimeout(() => setIsLoading(false), 2000)
      return () => clearTimeout(timer)
    }

    const handleCanPlay = () => setIsLoading(false)

    // If already ready
    if (video.readyState >= 3) {
      setIsLoading(false)
      return
    }

    video.addEventListener("canplay", handleCanPlay)
    // Fallback: max 4s loading
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
      // Auto-transition directly to the call - no button
      setTimeout(() => {
        onContinue()
      }, 800)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onContinue])

  const handlePlay = async () => {
    resumeAudio()
    if (videoRef.current) {
      try {
        // Start loading full video on demand
        videoRef.current.preload = "auto"
        videoRef.current.load()
        await videoRef.current.play()
        setIsPlaying(true)
      } catch {
        // Fallback: try playing directly
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background">
      {/* Video Container */}
      <div className="relative aspect-[9/16] w-full max-w-md overflow-hidden rounded-lg bg-secondary">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          preload="metadata"
        >
          <source
            src={videoSrc}
            type="video/quicktime"
          />
          <source
            src={videoSrc}
            type="video/mp4"
          />
        </video>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {/* Play Overlay */}
        {!isLoading && !isPlaying && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-background/60 transition-opacity duration-300"
            aria-label="Reproducir video"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/20 transition-transform hover:scale-110">
              <Play className="ml-1 h-8 w-8 text-primary" fill="currentColor" />
            </div>
          </button>
        )}

        {/* Progress Bar */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
