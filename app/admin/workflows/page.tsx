"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Plus,
  MessageSquare,
  Mail,
  Shield,
  CalendarCheck,
  ArrowRight,
  Info,
} from "lucide-react"
import type { WorkflowRule } from "@/lib/workflow-data"
import { MOCK_WORKFLOWS, MOCK_TEMPLATES } from "@/lib/workflow-data"
import { WorkflowCard } from "@/components/admin/workflow-card"
import { WorkflowCreator } from "@/components/admin/workflow-creator"

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(MOCK_WORKFLOWS)
  const [showCreator, setShowCreator] = useState(false)

  const toggleWorkflow = (id: string, enabled: boolean) => {
    setWorkflows((prev) =>
      prev.map((wf) => (wf.id === id ? { ...wf, enabled } : wf))
    )
  }

  const addWorkflow = (workflow: WorkflowRule) => {
    setWorkflows((prev) => [...prev, workflow])
    setShowCreator(false)
  }

  const activeCount = workflows.filter((wf) => wf.enabled).length
  const whatsappTemplates = MOCK_TEMPLATES.filter(
    (t) => t.type === "whatsapp"
  ).length
  const emailTemplates = MOCK_TEMPLATES.filter(
    (t) => t.type === "email"
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              Automatizaciones
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea reglas automaticas: cuando ocurra un evento, ejecuta acciones
            como enviar WhatsApp o Email
          </p>
        </div>
        {!showCreator && (
          <button
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo Workflow
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="Workflows totales"
          value={workflows.length}
          sub="reglas creadas"
          color="text-foreground"
        />
        <StatCard
          label="Activos"
          value={activeCount}
          sub="ejecutandose"
          color="text-emerald-500"
        />
        <StatCard
          label="Plantillas WhatsApp"
          value={whatsappTemplates}
          sub="disponibles"
          color="text-emerald-500"
          icon={<MessageSquare className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Plantillas Email"
          value={emailTemplates}
          sub="disponibles"
          color="text-blue-500"
          icon={<Mail className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Default workflow explanation */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Shield className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">
              Workflow por defecto
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              El workflow por defecto no se puede desactivar. Garantiza que
              cuando una cita se agenda, se envie automaticamente un WhatsApp y
              un Email de confirmacion al contacto. Puedes crear workflows
              adicionales para otros triggers.
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-400">
              <CalendarCheck className="h-3 w-3" />
              <span>Cita agendada</span>
              <ArrowRight className="h-3 w-3" />
              <MessageSquare className="h-3 w-3" />
              <span>WhatsApp</span>
              <span className="text-muted-foreground">+</span>
              <Mail className="h-3 w-3" />
              <span>Email</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator */}
      {showCreator && (
        <WorkflowCreator
          onSave={addWorkflow}
          onCancel={() => setShowCreator(false)}
        />
      )}

      {/* Workflow list */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Workflows configurados ({workflows.length})
        </h2>
        {workflows.map((wf) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            onToggle={toggleWorkflow}
          />
        ))}
      </div>

      {/* How workflows work */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            Como funcionan los Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <StepCard
              number={1}
              title="Evento ocurre"
              desc="Un contacto agenda una cita, se crea un lead, o se cancela una cita"
              color="text-primary"
              bgColor="bg-primary/10"
            />
            <StepCard
              number={2}
              title="Workflow se activa"
              desc="El sistema busca workflows activos que coincidan con el trigger del evento"
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
            <StepCard
              number={3}
              title="Acciones se ejecutan"
              desc="Se envian WhatsApp y/o Emails segun las acciones configuradas, respetando los delays"
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: number
  sub: string
  color: string
  icon?: React.ReactNode
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {icon && <span className={color}>{icon}</span>}
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{sub}</span>
      </CardContent>
    </Card>
  )
}

function StepCard({
  number,
  title,
  desc,
  color,
  bgColor,
}: {
  number: number
  title: string
  desc: string
  color: string
  bgColor: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-4 text-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}
      >
        <span className={`text-sm font-bold ${color}`}>{number}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  )
}
