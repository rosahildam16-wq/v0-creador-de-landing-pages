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
import { TEAM_MEMBERS } from "@/lib/team-data"
import {
  Search, Download, ChevronLeft, ChevronRight, Loader2, Users, ArrowUpDown,
} from "lucide-react"
import { format } from "date-fns"
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
  const member = TEAM_MEMBERS.find((m) => m.id === user?.memberId)

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

  const handleExport = () => {
    const csv = [
      "Nombre,Email,WhatsApp,Temperatura,Score,Etapa,Fecha Ingreso",
      ...sorted.map(
        (l) => `"${l.nombre}","${l.email}","${l.whatsapp}","${l.temperatura}",${l.score},"${ETAPA_LABELS[l.etapa]}","${format(new Date(l.fecha_ingreso), "dd/MM/yyyy")}"`
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
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2" disabled={sorted.length === 0}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
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
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((lead) => (
                    <TableRow key={lead.id} className="group hover:bg-white/[0.02]">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{lead.nombre}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{lead.email}</span>
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
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">No se encontraron leads con estos filtros.</TableCell></TableRow>
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
    </div>
  )
}
