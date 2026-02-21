"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type IntegrationStatus = "connected" | "disconnected" | "pending"

interface IntegrationCardProps {
  name: string
  description: string
  icon: React.ReactNode
  status: IntegrationStatus
  accentColor: string
  isSelected: boolean
  onClick: () => void
}

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  accentColor,
  isSelected,
  onClick,
}: IntegrationCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
    >
      <Card
        className={cn(
          "transition-all duration-200 hover:border-primary/20",
          isSelected && "border-primary/40 bg-primary/5"
        )}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            {icon}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{name}</span>
              <StatusBadge status={status} />
            </div>
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === "connected") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0">
        <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Conectado
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0">
        <AlertCircle className="mr-1 h-2.5 w-2.5" /> Pendiente
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-border/50 text-muted-foreground text-[10px] px-1.5 py-0">
      Desconectado
    </Badge>
  )
}
