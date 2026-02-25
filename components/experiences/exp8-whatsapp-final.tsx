"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Mic,
  Play,
  Pause,
  CheckCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { playMessageReceived, playVoiceNote } from "@/lib/sounds"

interface Props {
  onContinue: () => void
  title?: string
  customMessages?: Array<{
    id: string
    text: string
    sender: "agent" | "user"
    timestamp: string
  }>
}



function VoiceMessage({ duration, timeStr }: { duration: string; timeStr: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const voiceRef = useRef<{ stop: () => void } | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    voiceRef.current?.stop()
    voiceRef.current = null
    setIsPlaying(false)
    setProgress(0)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback()
      return
    }

    setIsPlaying(true)
    setProgress(0)

    const totalMs = 4500
    const stepMs = 50
    let elapsed = 0

    intervalRef.current = setInterval(() => {
      elapsed += stepMs
      setProgress(Math.min((elapsed / totalMs) * 100, 100))
      if (elapsed >= totalMs) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, stepMs)

    voiceRef.current = playVoiceNote(() => {
      setIsPlaying(false)
      setProgress(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    })
  }, [isPlaying, stopPlayback])

  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [stopPlayback])

  const bars = [14, 20, 10, 24, 12, 18, 8, 22, 16, 10, 20, 14, 24, 8, 18, 22, 10, 16, 20, 12, 14, 8, 22, 18, 10, 16, 24, 12, 20, 14]

  return (
    <div className="wa-bubble-incoming px-3 py-2" style={{ minWidth: "280px" }}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#00a884" }}>
          <span className="text-xs font-bold text-white">M</span>
        </div>

        {/* Play button */}
        <button
          onClick={togglePlay}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "#00a884" }}
          type="button"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 text-white" fill="white" />
          ) : (
            <Play className="h-4 w-4 text-white" fill="white" style={{ marginLeft: "2px" }} />
          )}
        </button>

        {/* Waveform */}
        <div className="flex flex-1 items-center gap-[2px]" style={{ height: "32px" }}>
          {bars.map((height, i) => {
            const barPosition = (i / bars.length) * 100
            const isActive = barPosition <= progress
            return (
              <div
                key={i}
                className="w-[3px] rounded-full transition-colors duration-150"
                style={{
                  height: `${height}px`,
                  backgroundColor: isActive ? "#00a884" : "#3b4a54",
                  flexShrink: 0,
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Duration and time */}
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "#8696a0" }}>
          {duration}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px]" style={{ color: "#8696a0" }}>
            {timeStr}
          </span>
          <CheckCheck className="h-[14px] w-[14px]" style={{ color: "#53bdeb" }} />
        </div>
      </div>
    </div>
  )
}

const defaultMessages: Array<{ id: string; text: string; sender: "agent" | "user"; timestamp: string }> = [
  { id: "1", text: "Lei lo que pusiste.", sender: "agent", timestamp: "10:00" },
  { id: "2", text: "Dejame ser claro: nadie promete seguridad absoluta.", sender: "agent", timestamp: "10:01" },
  { id: "3", text: "Pero quedarte donde estas... ¿eso si te la da?", sender: "agent", timestamp: "10:02" },
]

export function WhatsAppFinal({ onContinue, title = "Mejor amigo", customMessages }: Props) {
  const activeMessages = customMessages || defaultMessages
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showCTA, setShowCTA] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let currentDelay = 800

    activeMessages.forEach((msg, i) => {
      if (msg.sender === "user") {
        // User messages appear instantly in this simplified simulation
        const msgTimer = setTimeout(() => {
          setVisibleMessages((prev) => [...prev, i])
        }, currentDelay)
        timers.push(msgTimer)
        currentDelay += 500
      } else {
        const typingTimer = setTimeout(() => {
          setIsTyping(true)
        }, currentDelay)
        timers.push(typingTimer)

        currentDelay += 1500

        const msgTimer = setTimeout(() => {
          setIsTyping(false)
          setVisibleMessages((prev) => [...prev, i])
          playMessageReceived()
        }, currentDelay)
        timers.push(msgTimer)
        currentDelay += 800
      }
    })

    const ctaTimer = setTimeout(() => {
      setShowCTA(true)
    }, currentDelay + 1000)
    timers.push(ctaTimer)

    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [activeMessages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages, isTyping])

  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`

  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#0b141a" }}>
      {/* Header */}
      <header className="wa-header flex items-center gap-2 px-2 py-2" style={{ zIndex: 10 }}>
        <button className="p-1" type="button">
          <ArrowLeft className="h-5 w-5" style={{ color: "#aebac1" }} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "#2a3942" }}>
          <span className="text-sm font-semibold" style={{ color: "#aebac1" }}>{title[0].toUpperCase()}</span>
        </div>
        <div className="flex-1 pl-1">
          <p className="text-[15px] font-normal" style={{ color: "#e9edef" }}>{title}</p>
          <p className="text-[12px]" style={{ color: "#00a884" }}>en linea</p>
        </div>
        <div className="flex items-center gap-4 pr-1">
          <button type="button"><Video className="h-5 w-5" style={{ color: "#aebac1" }} /></button>
          <button type="button"><Phone className="h-5 w-5" style={{ color: "#aebac1" }} /></button>
          <button type="button"><MoreVertical className="h-5 w-5" style={{ color: "#aebac1" }} /></button>
        </div>
      </header>

      {/* Chat */}
      <div className="wa-chat-bg flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {/* Date chip */}
        <div className="my-2 flex justify-center">
          <span
            className="rounded-md px-3 py-1 text-[12px]"
            style={{ backgroundColor: "#182229", color: "#8696a0" }}
          >
            Hoy
          </span>
        </div>

        {visibleMessages.map((idx) => {
          const msg = activeMessages[idx]
          const isSent = msg.sender === "user"
          const isFirst = idx === 0 || activeMessages[idx - 1].sender !== msg.sender

          return (
            <div key={idx} className={`animate-fade-in mb-1 max-w-[85%] ${isSent ? "self-end" : "self-start"}`}>
              <div
                className={isFirst ? (isSent ? "wa-bubble-sent" : "wa-bubble-incoming") : ""}
                style={{
                  backgroundColor: isSent ? "#005c4b" : "#202c33",
                  borderRadius: isFirst
                    ? (isSent ? "8px 0 8px 8px" : "0 8px 8px 8px")
                    : "8px",
                  padding: "6px 8px 4px 9px",
                }}
              >
                <p className="text-[14.2px] leading-[19px] break-words" style={{ color: "#e9edef" }}>
                  {msg.text}
                  <span className="float-right ml-2 mt-1 flex items-center gap-1" style={{ lineHeight: "14px" }}>
                    <span className="text-[11px]" style={{ color: isSent ? "#6fbfa0" : "#8696a0" }}>{msg.timestamp}</span>
                    <CheckCheck className="h-[14px] w-[14px] inline-block" style={{ color: isSent ? "#53bdeb" : "#8696a0" }} />
                  </span>
                </p>
              </div>
            </div>
          )
        })}

        {/* Typing */}
        {isTyping && (
          <div className="mb-1 max-w-[85%] self-start">
            <div
              style={{
                backgroundColor: "#202c33",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <div className="flex items-center gap-[5px]">
                <div className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: "#8696a0", animation: "typing-dots 1.4s 0s infinite" }} />
                <div className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: "#8696a0", animation: "typing-dots 1.4s 0.2s infinite" }} />
                <div className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: "#8696a0", animation: "typing-dots 1.4s 0.4s infinite" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* CTA */}
      <div className="wa-input-bar px-2 py-2">
        {showCTA ? (
          <div className="animate-fade-in px-1">
            <Button
              onClick={onContinue}
              className="w-full rounded-lg py-6 text-[15px] font-semibold text-white"
              style={{ backgroundColor: "#00a884" }}
            >
              AVANZAR
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="wa-input-field flex flex-1 items-center gap-2 px-3 py-2">
              <Smile className="h-5 w-5 shrink-0" style={{ color: "#8696a0" }} />
              <span className="flex-1 text-[15px]" style={{ color: "#8696a0" }}>Mensaje</span>
              <Paperclip className="h-5 w-5 shrink-0" style={{ color: "#8696a0" }} />
              <Camera className="h-5 w-5 shrink-0" style={{ color: "#8696a0" }} />
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#00a884" }}>
              <Mic className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
