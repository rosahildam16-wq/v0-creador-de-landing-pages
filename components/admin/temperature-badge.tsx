import { cn } from "@/lib/utils"
import type { Temperatura } from "@/lib/lead-scoring"
import { getTemperaturaBgClass } from "@/lib/lead-scoring"

interface TemperatureBadgeProps {
  temperatura: Temperatura
  score?: number
  className?: string
}

export function TemperatureBadge({ temperatura, score, className }: TemperatureBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        getTemperaturaBgClass(temperatura),
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          temperatura === "FRIO" && "bg-blue-400",
          temperatura === "TIBIO" && "bg-amber-400",
          temperatura === "CALIENTE" && "bg-red-400"
        )}
      />
      {temperatura}
      {score !== undefined && (
        <span className="opacity-70">{score}</span>
      )}
    </span>
  )
}
