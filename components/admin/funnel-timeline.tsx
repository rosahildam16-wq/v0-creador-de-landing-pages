import { cn } from "@/lib/utils"
import { FUNNEL_STEPS, type Lead } from "@/lib/types"
import { Check, X } from "lucide-react"

interface FunnelTimelineProps {
  lead: Lead
  className?: string
}

function stepCompleted(lead: Lead, step: number): boolean {
  return lead.etapa_maxima_alcanzada >= step
}

function stepDetail(lead: Lead, step: number): string {
  switch (step) {
    case 1: return `Video visto al ${lead.video_visto_pct}%`
    case 2: return lead.llamada_contestada ? "Llamada contestada" : "No contesto"
    case 3: return lead.quiz_completado ? "Quiz completado" : "Quiz no completado"
    case 4: return lead.terminal_completado ? "Terminal completado" : "No completado"
    case 5: return lead.whatsapp_leido ? "WhatsApp leido" : "No leido"
    case 6: return lead.login_completado ? "Login exitoso" : "No hizo login"
    case 7: return lead.feed_visto ? "Feed visualizado" : "No vio feed"
    case 8: return lead.sales_page_vista ? "Sales page vista" : "No vio sales page"
    default: return ""
  }
}

export function FunnelTimeline({ lead, className }: FunnelTimelineProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {FUNNEL_STEPS.map((step, i) => {
        const completed = stepCompleted(lead, step.step)
        const isLast = i === FUNNEL_STEPS.length - 1
        const isCurrent = lead.etapa_maxima_alcanzada === step.step

        return (
          <div key={step.step} className="flex gap-3">
            {/* Vertical line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  completed
                    ? "border-emerald-500/50 bg-emerald-500/15"
                    : "border-border bg-secondary",
                  isCurrent && "border-amber-500/50 bg-amber-500/15 ring-2 ring-amber-500/20"
                )}
              >
                {completed ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <X className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[24px]",
                    completed ? "bg-emerald-500/30" : "bg-border"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("flex flex-col gap-0.5 pb-4", isLast && "pb-0")}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    completed ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Etapa {step.step}: {step.label}
                </span>
                {isCurrent && (
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    ACTUAL
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {stepDetail(lead, step.step)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
