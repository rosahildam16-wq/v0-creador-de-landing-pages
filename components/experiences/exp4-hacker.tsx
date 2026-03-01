"use client"

import { useState, useEffect } from "react"
import { playTerminalKey, playAccessGranted, startDrone, stopDrone } from "@/lib/sounds"

interface Props {
  onContinue: () => void
}

const sequence = [
  { delay: 0, text: "Inicializando acceso...", progress: 0 },
  { delay: 3000, text: "32% > Validando identidad", progress: 32 },
  { delay: 6000, text: "78% > Usuario reconocido", progress: 78 },
  { delay: 9000, text: "Acceso concedido > No todos llegan hasta aqu\u00ed", progress: 100 },
]

export function HackerTerminal({ onContinue }: Props) {
  const [visibleLines, setVisibleLines] = useState<number[]>([0])
  const [progress, setProgress] = useState(0)
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    startDrone()
    // Keystroke sounds for first line
    const keyTimers: ReturnType<typeof setTimeout>[] = []
    for (let k = 0; k < 8; k++) {
      keyTimers.push(setTimeout(() => playTerminalKey(), k * 80))
    }

    const timers: ReturnType<typeof setTimeout>[] = [...keyTimers]

    sequence.forEach((item, i) => {
      if (i === 0) return
      const timer = setTimeout(() => {
        setVisibleLines((prev) => [...prev, i])
        setProgress(item.progress)

        // Play keystrokes for each new line
        for (let k = 0; k < 6; k++) {
          keyTimers.push(setTimeout(() => playTerminalKey(), item.delay + k * 80))
        }

        if (i === sequence.length - 1) {
          setTimeout(() => playAccessGranted(), 300)
        }
      }, item.delay)
      timers.push(timer)
    })

    const finalTimer = setTimeout(() => {
      setComplete(true)
      stopDrone()
    }, 12000)
    timers.push(finalTimer)

    const autoTransition = setTimeout(() => {
      onContinue()
    }, 14000)
    timers.push(autoTransition)

    return () => {
      for (const t of timers) clearTimeout(t)
      for (const t of keyTimers) clearTimeout(t)
      stopDrone()
    }
  }, [onContinue])

  return (
    <div className="flex min-h-dvh flex-col bg-background p-6 font-mono">
      {/* Terminal Header */}
      <div className="mb-6 flex items-center gap-2 pt-8">
        <div className="h-3 w-3 rounded-full bg-destructive/80" />
        <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
        <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
        <span className="ml-3 text-xs text-muted-foreground">terminal</span>
      </div>

      {/* Terminal Body */}
      <div className="flex-1">
        <div className="flex flex-col gap-3">
          {visibleLines.map((lineIdx) => {
            const item = sequence[lineIdx]
            return (
              <div key={lineIdx} className="animate-fade-in">
                <span className="text-[#00FF41]/70">{">"} </span>
                <span
                  className={`text-sm ${lineIdx === sequence.length - 1 ? "font-semibold text-[#00FF41]" : "text-foreground/80"}`}
                >
                  {item.text}
                </span>
              </div>
            )
          })}

          {/* Blinking cursor */}
          {!complete && (
            <div className="mt-2">
              <span className="text-[#00FF41]/70">{">"} </span>
              <span className="animate-blink text-[#00FF41]">_</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">PROGRESO</span>
          <span className="text-xs text-[#00FF41]">{progress}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-[#00FF41] shadow-[0_0_10px_#00FF41] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
