"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ScoreBars } from "@/components/admin/score-bars"
import { WhatsAppStatus } from "@/components/admin/whatsapp-status"
import { ETAPA_LABELS, ETAPA_ORDER, type EtapaPipeline } from "@/lib/types"
import { calcularTemperatura, type Temperatura } from "@/lib/lead-scoring"
import { useAuth } from "@/lib/auth-context"
import { getMemberData } from "@/lib/team-data"
import {
  Search, Download, ChevronLeft, ChevronRight, Loader2, Users, ArrowUpDown, Plus, X,
  Phone, Mail, MessageCircle, Globe, Calendar, Clock, StickyNote, Trash2, CalendarCheck, Lightbulb, User, ExternalLink, Link as LinkIcon
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import type { Lead } from "@/lib/types"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Error cargando leads")
    return r.json()
  })

const TEMPERATURAS: (Temperatura | "todas")[] = ["todas", "FRIO", "TIBIO", "CALIENTE"]

type SortKey = "nombre" | "campana" | "etapa" | "score"
type SortDir = "asc" | "desc"
const PAGE_SIZE = 10

function getEtapaBadgeClasses(etapa: EtapaPipeline): string {
  switch (etapa) {
    case "lead_nuevo": return "border-sky-500/30 bg-sky-500/10 text-sky-400"
    case "contactado": return "border-blue-500/30 bg-blue-500/10 text-blue-400"
    case "llamada_agendada": return "border-violet-500/30 bg-violet-500/10 text-violet-400"
    case "no_respondio": return "border-amber-500/30 bg-amber-500/10 text-amber-400"
    case "presentado": return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
    case "cerrado": return "border-green-500/30 bg-green-500/10 text-green-400"
    case "perdido": return "border-red-500/30 bg-red-500/10 text-red-400"
    default: return "border-border bg-secondary text-muted-foreground"
  }
}

export default function MemberLeadsPage() {
  const { user } = useAuth()
  const member = getMemberData(user)

  const { data: leads, isLoading, mutate } = useSWR<Lead[]>(
    user?.email ? `/api/member/leads?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const [search, setSearch] = useState("")
  const [tempFilter, setTempFilter] = useState<string>("todas")
  const [etapaFilter, setEtapaFilter] = useState<string>("todas")
  const [sortKey, setSortKey] = useState<SortKey>("nombre")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newLead, setNewLead] = useState({
    nombre: "",
    email: "",
    whatsapp: "",
    campana: "Franquicia Reset"
  })
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAgendarDialogOpen, setIsAgendarDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("notas")
  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    motive: ""
  })

  const leadsConScore = useMemo(
    () => (leads || []).map((lead) => ({ ...lead, ...calcularTemperatura(lead) })),
    [leads]
  )

  const filtered = useMemo(() => {
    let result = leadsConScore
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) => l.nombre.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.whatsapp.includes(q)
      )
    }
    if (tempFilter !== "todas") result = result.filter((l) => l.temperatura === tempFilter)
    if (etapaFilter !== "todas") result = result.filter((l) => l.etapa === etapaFilter)
    return result
  }, [leadsConScore, search, tempFilter, etapaFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "nombre": cmp = a.nombre.localeCompare(b.nombre); break
        case "campana": cmp = a.campana.localeCompare(b.campana); break
        case "etapa": cmp = ETAPA_ORDER.indexOf(a.etapa) - ETAPA_ORDER.indexOf(b.etapa); break
        case "score": cmp = a.score - b.score; break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
    setPage(0)
  }

  const handleUpdateEtapa = async (leadId: string, nuevaEtapa: EtapaPipeline) => {
    setUpdatingId(leadId)
    try {
      const res = await fetch("/api/member/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, etapa: nuevaEtapa }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
      mutate()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/member/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberEmail: user.email,
          leadData: newLead
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Lead registrado correctamente")
        setIsAddModalOpen(false)
        setNewLead({ nombre: "", email: "", whatsapp: "", campana: "Franquicia Reset" })
        mutate()
      } else {
        toast.error(data.error || "Error al registrar")
      }
    } catch (err) {
      toast.error("Error de conexion")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAgendarCita = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !appointmentData.date || !appointmentData.time) return
    setIsSubmitting(true)
    try {
      const startTime = new Date(`${appointmentData.date}T${appointmentData.time}`)
      const endTime = new Date(startTime.getTime() + 45 * 60000) // 45 min default

      const res = await fetch("/api/member/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          title: `Cita con ${selectedLead.nombre}`,
          description: appointmentData.motive,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          provider: "manual"
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Cita agendada manualmente 🥂")
        setIsAgendarDialogOpen(false)
        setAppointmentData({ date: "", time: "", motive: "" })
        mutate()
      } else {
        toast.error(data.error || "Error al agendar")
      }
    } catch (err) {
      toast.error("Error al procesar la cita")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este lead? Esta acción no se puede deshacer.")) return
    try {
      const res = await fetch(`/api/member/leads?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Lead eliminado")
        setIsDetailOpen(false)
        mutate()
      }
    } catch (err) {
      toast.error("Error al eliminar")
    }
  }

  const handleOpenDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDetailOpen(true)
  }

  const handleExport = () => {
    const csv = [
      "Nombre,Email,WhatsApp,Pais,Trafico,Embudo,Temperatura,Score,Etapa,Fecha Ingreso",
      ...sorted.map(
        (l) => `"${l.nombre}","${l.email}","${l.whatsapp}","${l.pais || ""}","${l.trafico || "Organico"}","${l.tipo_embudo || "cita"}","${l.temperatura}",${l.score},"${ETAPA_LABELS[l.etapa]}","${format(new Date(l.fecha_ingreso), "dd/MM/yyyy")}"`
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "mis-leads.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando tus leads...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Leads</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} leads asignados a ti</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary">
                <Plus className="h-4 w-4" /> Nuevo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Lead</DialogTitle>
                <DialogDescription>
                  Agrega un prospecto manualmente a tu CRM. Ideal para cierres de la Franquicia Reset.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-name">Nombre Completo</Label>
                  <Input
                    id="lead-name"
                    placeholder="Ej: Juan Perez"
                    value={newLead.nombre}
                    onChange={(e) => setNewLead({ ...newLead, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-wa">WhatsApp (con codigo de pais)</Label>
                  <Input
                    id="lead-wa"
                    placeholder="+573001234567"
                    value={newLead.whatsapp}
                    onChange={(e) => setNewLead({ ...newLead, whatsapp: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-camp">Campaña / Origen</Label>
                  <Select
                    value={newLead.campana}
                    onValueChange={(v) => setNewLead({ ...newLead, campana: v })}
                  >
                    <SelectTrigger id="lead-camp">
                      <SelectValue placeholder="Selecciona origen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Franquicia Reset">Franquicia Reset</SelectItem>
                      <SelectItem value="Manual">Registro Manual</SelectItem>
                      <SelectItem value="Referido">Referido Directo</SelectItem>
                      <SelectItem value="Facebook">Facebook Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Registrando..." : "Confirmar Registro"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Manual Appointment Modal */}
          <Dialog open={isAgendarDialogOpen} onOpenChange={setIsAgendarDialogOpen}>
            <DialogContent className="max-w-md p-0 bg-white dark:bg-neutral-900 border-none rounded-3xl overflow-hidden shadow-2xl">
              {selectedLead && (
                <div className="flex flex-col">
                  <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black tracking-tighter text-neutral-900 dark:text-white uppercase">
                        Agendar cita manualmente
                      </h2>
                      <p className="text-[10px] text-neutral-400 font-medium">
                        Registra una cita para un prospecto. Recibirá las mismas notificaciones que si la hubiera agendado él mismo.
                      </p>
                    </div>
                    <button onClick={() => setIsAgendarDialogOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAgendarCita} className="p-6 space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Nombre del prospecto *</Label>
                      <Input value={selectedLead.nombre} disabled className="bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">WhatsApp *</Label>
                        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-md px-3 h-10">
                          <span className="text-xs">🇲🇽 +52</span>
                          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
                          <span className="text-xs font-bold truncate">{selectedLead.whatsapp.replace(/^\+\d+/, '')}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email *</Label>
                        <Input value={selectedLead.email} disabled className="bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 font-bold text-xs" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Modalidad *</Label>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-1.5 rounded-lg gap-2 text-[10px] font-black uppercase tracking-widest">
                          <Globe className="h-3 w-3" />
                          Virtual
                        </Badge>
                        <span className="text-[10px] text-neutral-400">(según tu configuración de agenda)</span>
                      </div>
                      <p className="text-[9px] text-neutral-400 flex items-center gap-1 mt-1">
                        <LinkIcon className="h-3 w-3" /> Link de reunión: <span className="text-primary underline">https://zoom.us/my/magic-room</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Fecha y hora *</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          required
                          value={appointmentData.date}
                          onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                          className="bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 font-bold"
                        />
                        <Input
                          type="time"
                          required
                          value={appointmentData.time}
                          onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                          className="bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Motivo (opcional)</Label>
                      <textarea
                        placeholder="Ej: Presentación de plan de compensación"
                        value={appointmentData.motive}
                        onChange={(e) => setAppointmentData({ ...appointmentData, motive: e.target.value })}
                        className="w-full min-h-[80px] bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl p-3 text-sm outline-none focus:border-primary/50 transition-colors resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 rounded-xl font-bold h-11"
                        onClick={() => setIsAgendarDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl font-bold h-11 bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        {isSubmitting ? "Agendando..." : "Agendar cita"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" disabled={sorted.length === 0}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email, WhatsApp..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={tempFilter} onValueChange={(v) => { setTempFilter(v); setPage(0) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Temperatura" /></SelectTrigger>
                <SelectContent>
                  {TEMPERATURAS.map((t) => (<SelectItem key={t} value={t}>{t === "todas" ? "Todas" : t}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={etapaFilter} onValueChange={(v) => { setEtapaFilter(v); setPage(0) }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las etapas</SelectItem>
                  {ETAPA_ORDER.map((e) => (<SelectItem key={e} value={e}>{ETAPA_LABELS[e]}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {(leads || []).length === 0 && (
        <Card className="border-dashed border-border/50 bg-white/[0.01]">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
              <Users className="h-8 w-8 text-primary/40" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Aún no tienes leads</h3>
            <p className="max-w-[280px] text-sm text-muted-foreground">
              Tus prospectos aparecerán aquí automáticamente cuando completen tus formularios.
            </p>
          </CardContent>
        </Card>
      )}

      {(leads || []).length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead><button type="button" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" onClick={() => toggleSort("nombre")}>Nombre <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></button></TableHead>
                    <TableHead><button type="button" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" onClick={() => toggleSort("etapa")}>Etapa <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></button></TableHead>
                    <TableHead><button type="button" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" onClick={() => toggleSort("score")}>Temperatura <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></button></TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">País / Tráfico</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((lead) => (
                    <TableRow key={lead.id} className="group hover:bg-white/[0.02]">
                      <TableCell className="py-4">
                        <div
                          className="flex flex-col cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                          onClick={() => handleOpenDetail(lead)}
                        >
                          <span className="font-bold text-foreground">{lead.nombre}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{lead.email}</span>
                          {lead.tipo_embudo && <span className="text-[9px] text-primary/50 font-black uppercase mt-0.5">{lead.tipo_embudo}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Select
                          value={lead.etapa}
                          onValueChange={(v) => handleUpdateEtapa(lead.id, v as EtapaPipeline)}
                          disabled={updatingId === lead.id}
                        >
                          <SelectTrigger className={cn(
                            "h-9 w-[170px] border-none bg-transparent font-medium focus:ring-0",
                            getEtapaBadgeClasses(lead.etapa as EtapaPipeline)
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ETAPA_ORDER.map((e) => (
                              <SelectItem key={e} value={e} className="text-xs">{ETAPA_LABELS[e]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-4">
                        <ScoreBars score={lead.score} temperatura={lead.temperatura} />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-foreground">{lead.pais || "N/A"}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "w-fit text-[9px] px-1.5 py-0 uppercase font-black",
                              lead.trafico === "Pauta" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}
                          >
                            {lead.trafico || "Organico"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <WhatsAppStatus tipoEmbudo={lead.tipo_embudo} whatsappCitaEnviado={lead.whatsapp_cita_enviado} compraCompletada={lead.compra_completada} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                            onClick={() => window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`, '_blank')}
                          >
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-2.32 0-4.591.398-6.726 1.147-.263.094-.529.141-.794.141-.412 0-.819-.117-1.173-.341-.454-.287-.768-.748-.871-1.278l-.164-.812c-.001-.001 0-.001 0-.002l-.11-.54c-.131-.645.143-1.309.684-1.652.544-.343 1.258-.335 1.791.021l1.523 1.015c.427.284.664.767.625 1.272l-.039.492c2.08-.131 4.22-.131 6.3 0l-.039-.492c-.039-.505.197-.988.625-1.272l1.523-1.015c.535-.357 1.247-.364 1.791-.021.541.343.815 1.007.684 1.652l-.11.54c0 .001 0 .001 0 .002l-.164.812c-.104.53-.417.991-.871 1.278-.354.224-.761.341-1.173.341-.265 0-.531-.047-.794-.141-2.135-.749-4.406-1.147-6.726-1.147z" /></svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (leads || []).length > 0 && (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">No se encontraron leads con estos filtros.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
      {/* Lead Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl p-0 bg-white dark:bg-neutral-900 border-none rounded-3xl overflow-hidden shadow-2xl">
          {selectedLead && (
            <div className="flex flex-col">
              {/* Modal Header */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase">
                      {selectedLead.nombre}
                    </h2>
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none px-3 py-0.5 text-[10px] font-black uppercase tracking-widest">
                      🔥 Super Caliente
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Estado CRM: {ETAPA_LABELS[selectedLead.etapa]}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="h-5 w-5 text-neutral-400" />
                </button>
              </div>

              {/* Data Grid */}
              <div className="px-8 py-6 grid grid-cols-2 gap-x-12 gap-y-6 bg-neutral-50/50 dark:bg-white/[0.02]">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">WhatsApp</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">{selectedLead.whatsapp}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">{selectedLead.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Tiempo efectivo</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-neutral-300" /> —
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Registrado</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    {format(new Date(selectedLead.fecha_ingreso), "dd MMM yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Último contacto</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">—</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Origen</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase">{selectedLead.campana || "Re-Lanzamiento 2026"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">CTA WhatsApp</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">No</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">ID Prospecto</p>
                  <p className="text-[10px] font-mono text-neutral-400 truncate">{selectedLead.id}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-8 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-1.5 min-w-[180px]">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Estado:</span>
                  <div className="flex-1">
                    <Select
                      value={selectedLead.etapa}
                      onValueChange={(v) => handleUpdateEtapa(selectedLead.id, v as EtapaPipeline)}
                    >
                      <SelectTrigger className="h-7 border-none bg-transparent p-0 text-xs font-bold focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ETAPA_ORDER.map((e) => (
                          <SelectItem key={e} value={e} className="text-xs">{ETAPA_LABELS[e]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold h-11 px-6 rounded-xl gap-2 flex-1 shadow-lg shadow-[#25D366]/20 border-none"
                  onClick={() => window.open(`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageCircle className="h-5 w-5" />
                  Contactar por WhatsApp
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Button>

                <div className="w-full flex gap-3 mt-1">
                  <Button
                    variant="outline"
                    className="h-11 px-6 rounded-xl gap-2 font-bold border-neutral-200 dark:border-neutral-800"
                    onClick={() => setIsAgendarDialogOpen(true)}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Agendar cita
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-11 px-6 rounded-xl gap-2 font-bold bg-red-500 hover:bg-red-600 border-none"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="px-8 pb-10">
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl mb-6">
                  {['notas', 'engagement', 'recordatorios'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        activeTab === tab ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                      )}
                    >
                      {tab === 'notas' && <StickyNote className="h-3 w-3" />}
                      {tab === 'engagement' && <Users className="h-3 w-3" />}
                      {tab === 'recordatorios' && <Calendar className="h-3 w-3" />}
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[120px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  {activeTab === 'notas' && (
                    <div className="w-full space-y-4 text-left">
                      <Button variant="ghost" size="sm" className="w-full border border-dashed border-neutral-200 dark:border-neutral-800 py-6 text-neutral-400 hover:text-primary gap-2">
                        <Plus className="h-4 w-4" /> Nueva nota para este lead
                      </Button>
                      <p className="text-[10px] text-neutral-400 text-center italic">No hay notas registradas todavía.</p>
                    </div>
                  )}
                  {activeTab === 'engagement' && (
                    <p className="text-xs text-neutral-400 mt-2 font-medium">No se han registrado interacciones recientes.</p>
                  )}
                  {activeTab === 'recordatorios' && (
                    <div className="space-y-4">
                      <Button variant="ghost" size="sm" className="text-neutral-400 gap-2">
                        <Plus className="h-4 w-4" /> Nuevo recordatorio
                      </Button>
                      <p className="text-[10px] text-neutral-400 italic">Los recordatorios están deshabilitados para leads cerrados o no interesados.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
