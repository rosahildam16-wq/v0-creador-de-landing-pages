"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  MessageSquare,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  CalendarCheck,
  UserPlus,
  CalendarX,
  CalendarClock,
} from "lucide-react"
import type { WorkflowRule } from "@/lib/workflow-data"
import {
  TRIGGER_LABELS,
  ACTION_TYPE_LABELS,
  DELAY_OPTIONS,
  getTemplateById,
} from "@/lib/workflow-data"

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  booking_created: <CalendarCheck className="h-4 w-4" />,
  lead_created: <UserPlus className="h-4 w-4" />,
  booking_canceled: <CalendarX className="h-4 w-4" />,
  booking_rescheduled: <CalendarClock className="h-4 w-4" />,
}

interface WorkflowCardProps {
  workflow: WorkflowRule
  onToggle: (id: string, enabled: boolean) => void
}

export function WorkflowCard({ workflow, onToggle }: WorkflowCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card
      className={`border-border/50 transition-all ${
        workflow.enabled ? "bg-card" : "bg-card/50 opacity-70"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                workflow.enabled
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {workflow.name}
                </span>
                {workflow.is_default && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]"
                  >
                    <Shield className="mr-1 h-2.5 w-2.5" />
                    Por defecto
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-border/50 text-[10px] text-muted-foreground"
                >
                  {TRIGGER_ICONS[workflow.trigger]}
                  <span className="ml-1">{TRIGGER_LABELS[workflow.trigger]}</span>
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {workflow.actions.length}{" "}
                  {workflow.actions.length === 1 ? "accion" : "acciones"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={workflow.enabled}
              onCheckedChange={(checked) => onToggle(workflow.id, checked)}
              disabled={workflow.is_default}
            />
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-2">
          <div className="flex flex-col gap-3">
            {/* Trigger */}
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
                {TRIGGER_ICONS[workflow.trigger]}
              </div>
              <span className="text-xs font-medium text-foreground">
                Cuando:{" "}
                <span className="text-muted-foreground">
                  {TRIGGER_LABELS[workflow.trigger]}
                </span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pl-3">
              {workflow.actions.map((action, idx) => {
                const template = getTemplateById(action.template_id)
                const delayLabel =
                  DELAY_OPTIONS.find((d) => d.value === action.delay_minutes)
                    ?.label ?? `${action.delay_minutes} min`

                return (
                  <div key={action.id} className="flex items-start gap-3">
                    {/* Connector line */}
                    <div className="flex flex-col items-center pt-1">
                      <div className="h-2.5 w-px bg-border" />
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-[10px] font-bold text-muted-foreground">
                        {idx + 1}
                      </div>
                      {idx < workflow.actions.length - 1 && (
                        <div className="h-full w-px bg-border" />
                      )}
                    </div>

                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/50 bg-secondary/10 px-3 py-2">
                      {action.type === "send_whatsapp" ? (
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                      )}
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {ACTION_TYPE_LABELS[action.type]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Plantilla: {template?.name ?? "Sin plantilla"}
                        </span>
                      </div>
                      {action.delay_minutes > 0 && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]"
                        >
                          <Clock className="mr-1 h-2.5 w-2.5" />
                          {delayLabel}
                        </Badge>
                      )}
                      {action.delay_minutes === 0 && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]"
                        >
                          Inmediato
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Updated info */}
            <p className="text-[10px] text-muted-foreground">
              Actualizado:{" "}
              {new Date(workflow.updated_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
