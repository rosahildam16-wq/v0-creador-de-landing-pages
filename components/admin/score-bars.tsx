"use client"

import { cn } from "@/lib/utils"
import type { Temperatura } from "@/lib/lead-scoring"

interface ScoreBarsProps {
  score: number
  temperatura: Temperatura
  className?: string
}

/**
 * Visual temperature indicator with colored bars (Korex-style).
 *
 * - FRIO      (score < 34)  -> 1 red bar     + label "FRIO"
 * - TIBIO     (34-66)       -> 2 orange bars  + label "TIBIO"
 * - CALIENTE  (>= 67)       -> 3 green bars   + label "CALIENTE"
 */
export function ScoreBars({ score, temperatura, className }: ScoreBarsProps) {
  const config = getConfig(temperatura)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "w-[6px] rounded-sm transition-colors",
              bar === 1 && "h-2.5",
              bar === 2 && "h-3.5",
              bar === 3 && "h-[18px]",
              bar <= config.activeBars ? config.activeColor : "bg-muted/40"
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "text-[10px] font-bold uppercase leading-none tracking-wide",
          config.textColor
        )}
      >
        {config.label}
      </span>
    </div>
  )
}

function getConfig(temperatura: Temperatura) {
  switch (temperatura) {
    case "FRIO":
      return {
        activeBars: 1,
        activeColor: "bg-red-500",
        textColor: "text-red-400",
        label: "FRIO",
      }
    case "TIBIO":
      return {
        activeBars: 2,
        activeColor: "bg-orange-500",
        textColor: "text-orange-400",
        label: "TIBIO",
      }
    case "CALIENTE":
      return {
        activeBars: 3,
        activeColor: "bg-red-500",
        textColor: "text-red-500",
        label: "CALIENTE",
      }
  }
}
