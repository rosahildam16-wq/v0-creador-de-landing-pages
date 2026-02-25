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

  const { data: allLeads, isLoading } = useSWR<Lead[]>("/api/admin/leads", fetcher, {
    refreshInterval: 15000,
  })

  // Filter leads assigned to this member
  const leads = useMemo(() => {
    if (!allLeads || !member) return []
    return allLeads.filter((l) => l.asignado_a === member.id || member.embudos_asignados.includes(l.embudo_id))
  }, [allLeads, member])

  const [search, setSearch] = useState("")
  const [tempFilter, setTempFilter] = useState<string>("todas")
  const [etapaFilter, setEtapaFilter] = useState<string>("todas")
  const [sortKey, setSortKey] = useState<SortKey>("nombre")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(0)

  const leadsConScore = useMemo(
    () => leads.map((lead) => ({ ...lead, ...calcularTemperatura(lead) })),
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

      {leads.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-semibold">Sin leads todavia</h3>
            <p className="text-center text-sm text-muted-foreground">Tus leads apareceran aqui cuando ingresen por tu embudo.</p>
          </CardContent>
        </Card>
      )}

      {leads.length > 0 && (
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
                    <TableRow key={lead.id}>
                      <TableCell className="py-3"><span className="font-medium">{lead.nombre}</span></TableCell>
                      <TableCell className="py-3"><Badge variant="outline" className={getEtapaBadgeClasses(lead.etapa)}>{ETAPA_LABELS[lead.etapa]}</Badge></TableCell>
                      <TableCell className="py-3"><ScoreBars score={lead.score} temperatura={lead.temperatura} /></TableCell>
                      <TableCell className="py-3"><WhatsAppStatus tipoEmbudo={lead.tipo_embudo} whatsappCitaEnviado={lead.whatsapp_cita_enviado} compraCompletada={lead.compra_completada} /></TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && leads.length > 0 && (
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
