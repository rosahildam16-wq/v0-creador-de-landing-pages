"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Phone, PhoneOff, MicOff, Volume2, User, Grid3X3 } from "lucide-react"
import {
  startRingtone,
  stopRingtone,
  playCallConnected,
  playCallEnd,
  startDrone,
  stopDrone,
} from "@/lib/sounds"
import { Button } from "@/components/ui/button"

interface Props {
  onContinue: () => void
  audioSrc?: string
  callerName?: string
}

type CallPhase = "incoming" | "connecting" | "active" | "ended"

export function CallInterface({ onContinue, audioSrc = "/audio/call-voice.mp3", callerName = "Mejor amigo" }: Props) {
  const [phase, setPhase] = useState<CallPhase>("incoming")
  const [seconds, setSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const maxSeconds = 360

  // Start ringtone on mount
  useEffect(() => {
    startRingtone()
    return () => {
      stopRingtone()
      stopDrone()
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause()
        voiceAudioRef.current = null
      }
    }
  }, [])

  // Timer for active call — 1 real second = 1 displayed second
  useEffect(() => {
    if (phase !== "active") return
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const formatTime = useCallback((s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }, [])

  const handleAnswer = () => {
    stopRingtone()
    setPhase("connecting")
    setTimeout(() => {
      playCallConnected()
      startDrone()
      setPhase("active")

      // Play voice audio once active
      const audio = new Audio(audioSrc)
      voiceAudioRef.current = audio
      audio.play().catch(() => { })
      audio.onended = () => {
        stopDrone()
        playCallEnd()
        setPhase("ended")
        // Auto-advance to next experience immediately after call ends
        setTimeout(() => {
          onContinue()
        }, 500)
      }
    }, 1500)
  }

  const handleDecline = () => {
    stopRingtone()
    stopDrone()
    playCallEnd()
    setPhase("ended")
    setTimeout(() => {
      onContinue()
    }, 500)
  }

  const handleHangUp = () => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause()
      voiceAudioRef.current = null
    }
    playCallEnd()
    stopDrone()
    setPhase("ended")
    setTimeout(() => {
      onContinue()
    }, 500)
  }

  // === INCOMING CALL (iPhone style) ===
  if (phase === "incoming") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-between bg-gradient-to-b from-[#1c1c1e] to-[#0a0a0a] px-6 py-12">
        {/* Top spacer */}
        <div />

        {/* Caller info */}
        <div className="flex flex-col items-center">
          {/* Avatar with pulse rings */}
          <div className="relative mb-8">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#2c2c2e]">
              <User className="h-14 w-14 text-[#8e8e93]" />
            </div>
            <div className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-[#34c759]/30" />
            <div
              className="animate-pulse-ring absolute -inset-3 rounded-full border border-[#34c759]/15"
              style={{ animationDelay: "0.7s" }}
            />
            <div
              className="animate-pulse-ring absolute -inset-6 rounded-full border border-[#34c759]/10"
              style={{ animationDelay: "1.4s" }}
            />
          </div>

          <p className="mb-1 text-lg font-light text-[#8e8e93]">Llamada entrante...</p>
          <h2 className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">
            {callerName}
          </h2>
          <p className="mt-2 text-sm text-[#8e8e93]">{"M\u00f3vil"}</p>
        </div>

        {/* Answer / Decline buttons (iPhone style) */}
        <div className="flex w-full max-w-xs items-center justify-between pb-8">
          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleDecline}
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#ff3b30] shadow-lg shadow-[#ff3b30]/30 transition-transform active:scale-95"
              aria-label="Rechazar llamada"
            >
              <PhoneOff className="h-8 w-8 text-[#f5f5f7]" />
            </button>
            <span className="text-xs text-[#8e8e93]">Rechazar</span>
          </div>

          {/* Answer */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleAnswer}
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#34c759] shadow-lg shadow-[#34c759]/30 transition-transform active:scale-95"
              aria-label="Aceptar llamada"
            >
              <Phone className="h-8 w-8 text-[#f5f5f7]" />
            </button>
            <span className="text-xs text-[#8e8e93]">Aceptar</span>
          </div>
        </div>
      </div>
    )
  }

  // === CONNECTING ===
  if (phase === "connecting") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#1c1c1e] to-[#0a0a0a] px-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#2c2c2e]">
          <User className="h-14 w-14 text-[#8e8e93]" />
        </div>
        <p className="mt-6 text-lg font-light text-[#8e8e93]">Conectando...</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#f5f5f7]">{callerName}</h2>
      </div>
    )
  }

  // === ACTIVE CALL (iPhone in-call style) ===
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between bg-gradient-to-b from-[#1c1c1e] to-[#0a0a0a] px-6 py-12">
      {/* Top: caller info + timer */}
      <div className="flex flex-col items-center pt-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2c2c2e]">
          <User className="h-10 w-10 text-[#8e8e93]" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#f5f5f7]">{callerName}</h2>
        <p className="mt-1 text-sm text-[#8e8e93]">
          {phase === "ended" ? "Llamada finalizada" : formatTime(seconds)}
        </p>

        {/* Sound wave */}
        {phase === "active" && !isMuted && (
          <div className="mt-8 flex items-end gap-1" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-[#34c759]/60"
                style={{
                  animation: `wave-animation 1.2s ease-in-out ${i * 0.08}s infinite`,
                  height: "8px",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-8 pb-8">
        {phase === "active" ? (
          <>
            {/* Control grid (iPhone style 3-column) */}
            <div className="grid grid-cols-3 gap-6">
              {/* Mute */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex h-[60px] w-[60px] items-center justify-center rounded-full transition-colors ${isMuted
                    ? "bg-[#f5f5f7] text-[#1c1c1e]"
                    : "bg-[#2c2c2e] text-[#f5f5f7]"
                    }`}
                  aria-label={isMuted ? "Activar micro" : "Silenciar"}
                >
                  <MicOff className="h-6 w-6" />
                </button>
                <span className="text-[11px] text-[#8e8e93]">
                  {isMuted ? "Silenciado" : "Silenciar"}
                </span>
              </div>

              {/* Speaker (decorative) */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#2c2c2e] text-[#f5f5f7]">
                  <Volume2 className="h-6 w-6" />
                </div>
                <span className="text-[11px] text-[#8e8e93]">Altavoz</span>
              </div>

              {/* Keypad */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#2c2c2e] text-[#f5f5f7]">
                  <Grid3X3 className="h-6 w-6" />
                </div>
                <span className="text-[11px] text-[#8e8e93]">Teclado</span>
              </div>
            </div>

            {/* Hang up */}
            <button
              type="button"
              onClick={handleHangUp}
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#ff3b30] shadow-lg shadow-[#ff3b30]/30 transition-transform active:scale-95"
              aria-label="Colgar"
            >
              <PhoneOff className="h-8 w-8 text-[#f5f5f7]" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
