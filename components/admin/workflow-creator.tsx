"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Zap,
  MessageSquare,
  Mail,
  Clock,
  CalendarCheck,
  UserPlus,
  CalendarX,
  CalendarClock,
  ArrowDown,
  Check,
} from "lucide-react"
import type {
  WorkflowTrigger,
  WorkflowActionType,
  DelayOption,
  WorkflowAction,
  WorkflowRule,
} from "@/lib/workflow-data"
import {
  TRIGGER_LABELS,
  ACTION_TYPE_LABELS,
  DELAY_OPTIONS,
  MOCK_TEMPLATES,
  getTemplatesByType,
} from "@/lib/workflow-data"

const TRIGGER_ICONS: Record<WorkflowTrigger, React.ReactNode> = {
  booking_created: <CalendarCheck className="h-3.5 w-3.5" />,
  lead_created: <UserPlus className="h-3.5 w-3.5" />,
  booking_canceled: <CalendarX className="h-3.5 w-3.5" />,
  booking_rescheduled: <CalendarClock className="h-3.5 w-3.5" />,
}

interface WorkflowCreatorProps {
  onSave: (workflow: WorkflowRule) => void
  onCancel: () => void
}

export function WorkflowCreator({ onSave, onCancel }: WorkflowCreatorProps) {
  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState<WorkflowTrigger>("booking_created")
  const [actions, setActions] = useState<
    {
      id: string
      type: WorkflowActionType
      template_id: string
      delay_minutes: DelayOption
    }[]
  >([
    { id: "new-act-1", type: "send_whatsapp", template_id: "", delay_minutes: 0 },
  ])
  const [saved, setSaved] = useState(false)

  const addAction = () => {
    setActions([
      ...actions,
      {
        id: `new-act-${Date.now()}`,
        type: "send_email",
        template_id: "",
        delay_minutes: 0,
      },
    ])
  }

  const removeAction = (id: string) => {
    if (actions.length <= 1) return
    setActions(actions.filter((a) => a.id !== id))
  }

  const updateAction = (
    id: string,
    field: keyof WorkflowAction,
    value: string | number
  ) => {
    setActions(
      actions.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  const handleSave = () => {
    if (!name.trim()) return

    const newWorkflow: WorkflowRule = {
      id: `wf-${Date.now()}`,
      name: name.trim(),
      trigger,
      actions: actions as WorkflowAction[],
      enabled: true,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    onSave(newWorkflow)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getTemplatesForAction = (type: WorkflowActionType) => {
    const templateType = type === "send_whatsapp" ? "whatsapp" : "email"
    return getTemplatesByType(templateType)
  }

  const isValid =
    name.trim().length > 0 && actions.every((a) => a.template_id)

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          Crear nuevo Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="wf-name" className="text-xs text-muted-foreground">
            Nombre del workflow
          </Label>
          <Input
            id="wf-name"
            placeholder="Ej: Confirmacion de cita automatica"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border/50 bg-secondary/30"
          />
        </div>

        {/* Trigger */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">
            Trigger (evento que activa el workflow)
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              Object.entries(TRIGGER_LABELS) as [WorkflowTrigger, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTrigger(key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all ${
                  trigger === key
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/50 bg-secondary/20 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {TRIGGER_ICONS[key]}
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Acciones a ejecutar
            </Label>
            <button
              onClick={addAction}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border/50 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              Agregar accion
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {actions.map((action, idx) => (
              <div key={action.id} className="flex flex-col gap-0">
                {idx > 0 && (
                  <div className="flex items-center justify-center py-1">
                    <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                )}
                <div className="rounded-lg border border-border/50 bg-secondary/10 p-3">
                  <div className="flex items-center justify-between pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-[10px] font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        Accion {idx + 1}
                      </span>
                    </div>
                    {actions.length > 1 && (
                      <button
                        onClick={() => removeAction(action.id)}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Action type */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Tipo
                      </Label>
                      <Select
                        value={action.type}
                        onValueChange={(v) => {
                          updateAction(action.id, "type", v)
                          updateAction(action.id, "template_id", "")
                        }}
                      >
                        <SelectTrigger className="h-9 border-border/50 bg-card text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(ACTION_TYPE_LABELS) as [
                              WorkflowActionType,
                              string,
                            ][]
                          ).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              <div className="flex items-center gap-2">
                                {key === "send_whatsapp" ? (
                                  <MessageSquare className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Mail className="h-3 w-3 text-blue-500" />
                                )}
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        Plantilla
                      </Label>
                      <Select
                        value={action.template_id}
                        onValueChange={(v) =>
                          updateAction(action.id, "template_id", v)
                        }
                      >
                        <SelectTrigger className="h-9 border-border/50 bg-card text-xs">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getTemplatesForAction(action.type).map((tpl) => (
                            <SelectItem
                              key={tpl.id}
                              value={tpl.id}
                              className="text-xs"
                            >
                              {tpl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Delay */}
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] text-muted-foreground">
                        <Clock className="mr-1 inline h-2.5 w-2.5" />
                        Delay
                      </Label>
                      <Select
                        value={String(action.delay_minutes)}
                        onValueChange={(v) =>
                          updateAction(
                            action.id,
                            "delay_minutes",
                            Number(v)
                          )
                        }
                      >
                        <SelectTrigger className="h-9 border-border/50 bg-card text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DELAY_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={String(opt.value)}
                              className="text-xs"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Guardado
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" /> Crear Workflow
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-border/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
