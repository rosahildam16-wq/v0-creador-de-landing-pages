"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Smile,
  Camera,
  Mic,
  CheckCheck,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { playMessageReceived } from "@/lib/sounds"

type MessageItem = {
  type: "text" | "audio"
  text: string
  sent: boolean
  audioSrc?: string
}

interface Props {
  onContinue: () => void
  contactName?: string
  customMessages?: MessageItem[]
}

const defaultMessages: MessageItem[] = [
  { type: "text", text: "Confirmado, si eres tu", sent: false },
  { type: "text", text: "Ya falta poco para entregarte la llave.", sent: false },
  {
    type: "text",
    text: "Ahora te voy a dar acceso a un perfil privado donde revelo todo, es una informacion que grabe en el 2026",
    sent: false,
  },
  {
    type: "text",
    text: "Alli es donde muestro como viajar por el mundo y generar ingresos mientras lo haces.",
    sent: false,
  },
  { type: "text", text: "Te voy a entregar la llave secreta para escapar del sistema", sent: false },
  {
    type: "text",
    text: "Por favor, no compartas este acceso. Esto no es para todo el mundo",
    sent: false,
  },
  { type: "text", text: "Entra ahora, no tenemos mucho tiempo\u2026", sent: false },
]

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onLoaded = () => setDuration(audio.duration)
    const onEnded = () => { setPlaying(false); setProgress(0) }
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("ended", onEnded)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause() } else { audio.play() }
    setPlaying(!playing)
  }

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, "0")}`
  }

  return (
    <div className="flex w-full items-center gap-2 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "#00a884" }}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
            <path d="M3 1.5v11l9-5.5z" />
          </svg>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="relative h-[3px] w-full rounded-full" style={{ backgroundColor: "#374045" }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: "#00a884" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[10px] w-[10px] rounded-full"
            style={{ left: `${progress}%`, backgroundColor: "#cfd4d6", transform: `translateX(-50%) translateY(-50%)` }}
          />
        </div>
        <span className="text-[11px]" style={{ color: "#8696a0" }}>
          {fmt(duration)}
        </span>
      </div>
    </div>
  )
}

export function WhatsAppHook({ onContinue, contactName = "Mejor amigo", customMessages }: Props) {
  const messages = customMessages || defaultMessages
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [isTyping, setIsTyping] = useState(true)
  const [showCTA, setShowCTA] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let currentDelay = 800

    messages.forEach((msg, i) => {
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

      // Si el mensaje actual es audio, esperar 10 segundos extra antes del siguiente
      if (msg.type === "audio") {
        currentDelay += 10000
      } else {
        currentDelay += 500
      }
    })

    const ctaTimer = setTimeout(() => {
      setShowCTA(true)
    }, currentDelay + 1000)
    timers.push(ctaTimer)

    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages, isTyping])

  const now = new Date()
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} p.m.`

  return (
    <div className="flex min-h-dvh flex-col" style={{ backgroundColor: "#0b141a" }}>
      {/* WhatsApp Header */}
      <header
        className="wa-header flex items-center gap-1.5 px-1 py-1.5"
        style={{ zIndex: 10 }}
      >
        <button className="flex items-center gap-0 p-0.5" type="button">
          <ArrowLeft className="h-5 w-5" style={{ color: "#aebac1" }} />
          <span className="text-[11px]" style={{ color: "#aebac1" }}>
            1.314
          </span>
        </button>

        {/* Profile picture */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ backgroundColor: "#2a3942" }}
        >
          <svg
            viewBox="0 0 36 36"
            className="h-full w-full"
            fill="none"
          >
            <circle cx="18" cy="14" r="6" fill="#6b7b8a" />
            <ellipse cx="18" cy="30" rx="10" ry="8" fill="#6b7b8a" />
          </svg>
        </div>

        <div className="flex-1 pl-0.5">
          <p
            className="text-[15px] font-medium leading-tight"
            style={{ color: "#e9edef" }}
          >
            {contactName}
          </p>
          <p className="text-[12px] leading-tight" style={{ color: "#8696a0" }}>
            Cuenta de empresa
          </p>
        </div>

        <div className="flex items-center gap-5 pr-2">
          <button type="button">
            <Phone className="h-[19px] w-[19px]" style={{ color: "#aebac1" }} />
          </button>
          <button type="button">
            <MoreVertical className="h-[19px] w-[19px]" style={{ color: "#aebac1" }} />
          </button>
        </div>
      </header>

      {/* Chat Body */}
      <div className="wa-chat-bg flex flex-1 flex-col gap-[3px] overflow-y-auto px-2.5 py-2">
        {/* Date chip */}
        <div className="my-2 flex justify-center">
          <span
            className="rounded-md px-3 py-[3px] text-[12px] font-medium"
            style={{ backgroundColor: "#182229", color: "#8696a0" }}
          >
            Hoy
          </span>
        </div>

        {visibleMessages.map((idx) => {
          const msg = messages[idx]
          const isSent = msg.sent
          const isFirstInGroup =
            idx === 0 || messages[idx - 1]?.sent !== msg.sent

          return (
            <div
              key={idx}
              className={`animate-fade-in mb-[2px] max-w-[80%] ${isSent ? "self-end" : "self-start"}`}
            >
              <div
                style={{
                  backgroundColor: isSent ? "#005c4b" : "#202c33",
                  borderRadius: isFirstInGroup
                    ? isSent
                      ? "8px 0 8px 8px"
                      : "0 8px 8px 8px"
                    : "8px",
                  padding: "5px 7px 3px 8px",
                  position: "relative",
                }}
              >
                {/* Tail for first message in group */}
                {isFirstInGroup && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      ...(isSent
                        ? {
                            right: -7,
                            width: 0,
                            height: 0,
                            borderTop: "0 solid transparent",
                            borderLeft: "8px solid #005c4b",
                            borderBottom: "8px solid transparent",
                          }
                        : {
                            left: -7,
                            width: 0,
                            height: 0,
                            borderTop: "0 solid transparent",
                            borderRight: "8px solid #202c33",
                            borderBottom: "8px solid transparent",
                          }),
                    }}
                  />
                )}

                {msg.type === "audio" && msg.audioSrc ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <AudioPlayer src={msg.audioSrc} />
                    </div>
                    <div className="flex justify-end">
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ lineHeight: "14px" }}
                      >
                        <span className="text-[11px]" style={{ color: isSent ? "#6fbfa0" : "#8696a0" }}>
                          {timeStr}
                        </span>
                        {isSent && (
                          <CheckCheck
                            className="inline-block h-[15px] w-[15px]"
                            style={{ color: "#53bdeb" }}
                          />
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p
                    className="break-words text-[14.2px] leading-[19px]"
                    style={{ color: "#e9edef" }}
                  >
                    {msg.text}
                    <span
                      className="float-right ml-2 mt-[3px] inline-flex items-center gap-1"
                      style={{ lineHeight: "14px" }}
                    >
                      <span className="text-[11px]" style={{ color: isSent ? "#6fbfa0" : "#8696a0" }}>
                        {timeStr}
                      </span>
                      {isSent && (
                        <CheckCheck
                          className="inline-block h-[15px] w-[15px]"
                          style={{ color: "#53bdeb" }}
                        />
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing Indicator */}
        {isTyping && visibleMessages.length < messages.length && (
          <div className="mb-[2px] max-w-[80%] self-start">
            <div
              style={{
                backgroundColor: "#202c33",
                borderRadius:
                  visibleMessages.length === 0 ? "0 8px 8px 8px" : "8px",
                padding: "10px 14px",
              }}
            >
              <div className="flex items-center gap-[5px]">
                <div
                  className="h-[7px] w-[7px] rounded-full"
                  style={{
                    backgroundColor: "#8696a0",
                    animation: "typing-dots 1.4s 0s infinite",
                  }}
                />
                <div
                  className="h-[7px] w-[7px] rounded-full"
                  style={{
                    backgroundColor: "#8696a0",
                    animation: "typing-dots 1.4s 0.2s infinite",
                  }}
                />
                <div
                  className="h-[7px] w-[7px] rounded-full"
                  style={{
                    backgroundColor: "#8696a0",
                    animation: "typing-dots 1.4s 0.4s infinite",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input Bar */}
      <div className="wa-input-bar px-1.5 py-1.5">
        {showCTA ? (
          <div className="animate-fade-in px-1">
            <Button
              onClick={onContinue}
              className="w-full rounded-lg py-6 text-[15px] font-semibold text-white"
              style={{ backgroundColor: "#00a884" }}
            >
              CONTINUAR
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button type="button" className="p-1">
              <Plus className="h-6 w-6" style={{ color: "#aebac1" }} />
            </button>

            <div className="wa-input-field flex flex-1 items-center gap-0.5 px-3 py-2">
              <Smile className="h-[22px] w-[22px] shrink-0" style={{ color: "#8696a0" }} />
              <span className="flex-1 text-[15px] pl-2" style={{ color: "#8696a0" }}>
                Mensaje
              </span>
              <Camera className="h-[22px] w-[22px] shrink-0 mr-1" style={{ color: "#8696a0" }} />
            </div>

            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#00a884" }}
            >
              <Mic className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
