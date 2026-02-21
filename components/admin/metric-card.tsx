import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  className?: string
}

export function MetricCard({ title, value, change, changeType = "neutral", icon: Icon, className }: MetricCardProps) {
  return (
    <Card className={cn("group", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {change && (
              <span
                className={cn(
                  "text-xs font-medium",
                  changeType === "positive" && "text-emerald-400",
                  changeType === "negative" && "text-red-400",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </span>
            )}
          </div>
          <div className="icon-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
