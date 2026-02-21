"use client"

import { useState, use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TemperatureBadge } from "@/components/admin/temperature-badge"
import { TemperatureBar } from "@/components/admin/temperature-bar"
import { FunnelTimeline } from "@/components/admin/funnel-timeline"
import { ETAPA_LABELS, ETAPA_ORDER, type EtapaPipeline, type Nota } from "@/lib/types"
import type { Lead } from "@/lib/types"
import { calcularTemperatura } from "@/lib/lead-scoring"
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  StickyNote,
  Globe,
  Clock,
  ChevronRight,
  Lightbulb,
  User,
  Loader2,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: lead, isLoading, mutate } = useSWR<Lead>(`/api/admin/leads?id=${id}`, fetcher)

  const [nuevaNota, setNuevaNota] = useState("")
  const [notaDialogOpen, setNotaDialogOpen] = useState(false)
  const [savingNota, setSavingNota] = useState(false)
  const [savingEtapa, setSavingEtapa] = useState(false)

  if (isLoading || !lead) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando lead...</p>
      </div>
    )
  }

  if ('error' in lead) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Lead no encontrado</p>
        <Link href="/admin/leads">
          <Button variant="outline" size="sm">Volver a Leads</Button>
        </Link>
      </div>
    )
  }

  const scoreResult = calcularTemperatura(lead)

  const handleAddNota = async () => {
    if (!nuevaNota.trim()) return
    setSavingNota(true)
    try {
      const res = await fetch("/api/admin/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: id, texto: nuevaNota.trim(), autor: "Tu" }),
      })
      if (res.ok) {
        const nota = await res.json()
        mutate({ ...lead, notas: [nota, ...lead.notas] }, false)
        setNuevaNota("")
        setNotaDialogOpen(false)
      }
    } finally {
      setSavingNota(false)
    }
  }

  const handleEtapaChange = async (newEtapa: EtapaPipeline) => {
    setSavingEtapa(true)
    try {
      const res = await fetch("/api/admin/leads/etapa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: id, etapa: newEtapa }),
      })
      if (res.ok) {
        mutate({ ...lead, etapa: newEtapa }, false)
      }
    } finally {
      setSavingEtapa(false)
    }
  }

  const tiempoFormatted = (() => {
    const mins = Math.floor(lead.tiempo_total_segundos / 60)
    const secs = lead.tiempo_total_segundos % 60
    return `${mins}m ${secs}s`
  })()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/leads">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Leads
          </Button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{lead.nombre}</h1>
            <p className="text-sm text-muted-foreground">{lead.email}</p>
          </div>
          <TemperatureBadge temperatura={scoreResult.temperatura} score={scoreResult.score} />
        </div>
      </div>

      {/* Main Content: 2 columns */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Contact Info */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Datos del Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={Phone} label="Telefono" value={lead.telefono} />
              <InfoRow icon={MessageCircle} label="WhatsApp" value={lead.whatsapp} />
              <InfoRow icon={Globe} label="Fuente" value={lead.fuente} />
              <InfoRow
                icon={Calendar}
                label="Ingreso"
                value={format(new Date(lead.fecha_ingreso), "dd MMM yyyy", { locale: es })}
              />
              <InfoRow icon={Clock} label="Tiempo total" value={tiempoFormatted} />
              <InfoRow
                icon={Clock}
                label="Ultimo evento"
                value={formatDistanceToNow(new Date(lead.ultimo_evento), { locale: es, addSuffix: true })}
              />

              {/* Asignado */}
              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <span className="text-xs text-muted-foreground">Asignado a</span>
                <Badge variant="secondary" className="text-xs">{lead.asignado_a}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Scoring de Temperatura</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <TemperatureBar score={scoreResult.score} />

              <div className="flex flex-col gap-2">
                {scoreResult.factores.map((f) => (
                  <div key={f.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${f.cumplido ? "bg-emerald-400" : "bg-muted-foreground/30"}`}
                      />
                      <span className={f.cumplido ? "text-foreground" : "text-muted-foreground"}>
                        {f.label}
                      </span>
                    </div>
                    <span className={`font-mono ${f.cumplido ? "text-emerald-400" : "text-muted-foreground/50"}`}>
                      {f.cumplido ? `+${f.puntos}` : f.puntos}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Stage */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Etapa del Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={lead.etapa}
                onValueChange={(v) => handleEtapaChange(v as EtapaPipeline)}
                disabled={savingEtapa}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ETAPA_ORDER.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ETAPA_LABELS[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => window.open(`https://wa.me/${lead.whatsapp.replace(/\s/g, "").replace("+", "")}`, "_blank")}>
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                Enviar WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => window.open(`mailto:${lead.email}`)}>
                <Mail className="h-4 w-4 text-blue-400" />
                Enviar Email
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => window.open(`tel:${lead.telefono}`)}>
                <Phone className="h-4 w-4 text-amber-400" />
                Llamar
              </Button>
              <Dialog open={notaDialogOpen} onOpenChange={setNotaDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-start gap-2">
                    <StickyNote className="h-4 w-4 text-violet-400" />
                    Agregar Nota
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Nota para {lead.nombre}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <Input
                      placeholder="Escribe tu nota aqui..."
                      value={nuevaNota}
                      onChange={(e) => setNuevaNota(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNota()}
                    />
                    <Button onClick={handleAddNota} disabled={!nuevaNota.trim() || savingNota}>
                      {savingNota ? "Guardando..." : "Guardar Nota"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Recommended Actions */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-400">
                <Lightbulb className="h-4 w-4" />
                Acciones Recomendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {scoreResult.acciones_recomendadas.map((accion, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span>{accion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Funnel Journey */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recorrido del Embudo</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelTimeline lead={lead} />
            </CardContent>
          </Card>

          {/* Quiz Responses */}
          {lead.quiz_completado && lead.respuestas_quiz.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Respuestas del Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {[
                    "Cual es tu ingreso mensual actual?",
                    "Cual es tu ocupacion principal?",
                    "Tienes experiencia invirtiendo?",
                  ].map((pregunta, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">{pregunta}</span>
                      <span className="text-sm font-medium">
                        {lead.respuestas_quiz[i] || "Sin respuesta"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Notas ({lead.notas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.notas.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No hay notas todavia.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {lead.notas.map((nota) => (
                    <div key={nota.id} className="flex flex-col gap-1 rounded-lg border border-border/50 bg-secondary/30 p-3">
                      <p className="text-sm">{nota.texto}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{nota.autor}</span>
                        <span>-</span>
                        <span>{format(new Date(nota.created_at), "dd MMM yyyy HH:mm", { locale: es })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <span className="text-xs font-medium">{value}</span>
    </div>
  )
}
