"use client"

import { cn } from "@/lib/utils"

interface TemperatureBarProps {
  score: number
  className?: string
}

export function TemperatureBar({ score, className }: TemperatureBarProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Score de temperatura</span>
        <span className="font-mono font-semibold tabular-nums">{score}/100</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, hsl(210, 70%, 50%) 0%, hsl(45, 90%, 55%) 50%, hsl(0, 72%, 51%) 100%)`,
          }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-foreground shadow-sm transition-all duration-500"
          style={{ left: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Frio</span>
        <span>Tibio</span>
        <span>Caliente</span>
      </div>
    </div>
  )
}
