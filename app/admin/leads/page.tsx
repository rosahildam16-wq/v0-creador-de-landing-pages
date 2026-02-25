"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScoreBars } from "@/components/admin/score-bars"
import { WhatsAppStatus } from "@/components/admin/whatsapp-status"
import { ETAPA_LABELS, ETAPA_ORDER, type FuenteTrafico, type EtapaPipeline } from "@/lib/types"
import { EMBUDOS } from "@/lib/embudos-config"
import { calcularTemperatura, type Temperatura } from "@/lib/lead-scoring"
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Route,
  Loader2,
  Users,
  ArrowUpDown,
} from "lucide-react"
import { format } from "date-fns"
import useSWR from "swr"
import type { Lead } from "@/lib/types"

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Error cargando leads")
    return r.json()
  })

const FUENTES: (FuenteTrafico | "todas")[] = [
  "todas",
  "Meta Ads",
  "Instagram",
  "TikTok",
  "Google",
  "Organico",
]
const TEMPERATURAS: (Temperatura | "todas")[] = [
  "todas",
  "FRIO",
  "TIBIO",
  "CALIENTE",
]

type SortKey = "nombre" | "campana" | "etapa" | "score" | "whatsapp"
type SortDir = "asc" | "desc"

const PAGE_SIZE = 10

function getEtapaBadgeClasses(etapa: EtapaPipeline): string {
  switch (etapa) {
    case "lead_nuevo":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400"
    case "contactado":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400"
    case "llamada_agendada":
      return "border-violet-500/30 bg-violet-500/10 text-violet-400"
    case "no_respondio":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400"
    case "presentado":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
    case "cerrado":
      return "border-green-500/30 bg-green-500/10 text-green-400"
    case "perdido":
      return "border-red-500/30 bg-red-500/10 text-red-400"
    default:
      return "border-border bg-secondary text-muted-foreground"
  }
}

export default function LeadsPage() {
  const {
    data: leads,
    isLoading,
  } = useSWR<Lead[]>("/api/admin/leads", fetcher, {
    refreshInterval: 15000,
  })

  const [search, setSearch] = useState("")
  const [fuenteFilter, setFuenteFilter] = useState<string>("todas")
  const [tempFilter, setTempFilter] = useState<string>("todas")
  const [etapaFilter, setEtapaFilter] = useState<string>("todas")
  const [embudoFilter, setEmbudoFilter] = useState<string>("todos")
  const [sortKey, setSortKey] = useState<SortKey>("nombre")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [page, setPage] = useState(0)

  // Enrich leads with scoring
  const leadsConScore = useMemo(
    () =>
      (leads || []).map((lead) => ({
        ...lead,
        ...calcularTemperatura(lead),
      })),
    [leads]
  )

  // Filter
  const filtered = useMemo(() => {
    let result = leadsConScore

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.nombre.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.campana.toLowerCase().includes(q) ||
          l.whatsapp.includes(q)
      )
    }

    if (fuenteFilter !== "todas") {
      result = result.filter((l) => l.fuente === fuenteFilter)
    }
    if (tempFilter !== "todas") {
      result = result.filter((l) => l.temperatura === tempFilter)
    }
    if (etapaFilter !== "todas") {
      result = result.filter((l) => l.etapa === etapaFilter)
    }
    if (embudoFilter !== "todos") {
      result = result.filter((l) => l.embudo_id === embudoFilter)
    }

    return result
  }, [leadsConScore, search, fuenteFilter, tempFilter, etapaFilter, embudoFilter])

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "nombre":
          cmp = a.nombre.localeCompare(b.nombre)
          break
        case "campana":
          cmp = a.campana.localeCompare(b.campana)
          break
        case "etapa":
          cmp =
            ETAPA_ORDER.indexOf(a.etapa) - ETAPA_ORDER.indexOf(b.etapa)
          break
        case "score":
          cmp = a.score - b.score
          break
        case "whatsapp":
          cmp =
            Number(a.whatsapp_cita_enviado || a.compra_completada) -
            Number(b.whatsapp_cita_enviado || b.compra_completada)
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(0)
  }

  const handleExport = () => {
    const csv = [
      "Nombre,Email,WhatsApp,Campana,Fuente,Temperatura,Score,Etapa,WhatsApp Cita,Fecha Ingreso",
      ...sorted.map(
        (l) =>
          `"${l.nombre}","${l.email}","${l.whatsapp}","${l.campana}","${l.fuente}","${l.temperatura}",${l.score},"${ETAPA_LABELS[l.etapa]}","${l.whatsapp_cita_enviado ? "Enviado" : "Pendiente"}","${format(new Date(l.fecha_ingreso), "dd/MM/yyyy")}"`
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leads-nomada-vip.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando leads...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Detalle de leads
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} contactos encontrados
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
          disabled={sorted.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, campana..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={fuenteFilter}
                onValueChange={(v) => {
                  setFuenteFilter(v)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  {FUENTES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f === "todas" ? "Todas las fuentes" : f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={tempFilter}
                onValueChange={(v) => {
                  setTempFilter(v)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Temperatura" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPERATURAS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "todas" ? "Todas las temp." : t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={etapaFilter}
                onValueChange={(v) => {
                  setEtapaFilter(v)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las etapas</SelectItem>
                  {ETAPA_ORDER.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ETAPA_LABELS[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={embudoFilter}
                onValueChange={(v) => {
                  setEmbudoFilter(v)
                  setPage(0)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Embudo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los embudos</SelectItem>
                  {EMBUDOS.map((embudo) => (
                    <SelectItem key={embudo.id} value={embudo.id}>
                      {embudo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {(leads || []).length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-semibold">Sin leads todavia</h3>
            <p className="text-center text-sm text-muted-foreground">
              Tu base de datos esta vacia. Los leads apareceran aqui cuando
              ingresen por el embudo o el webhook.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {(leads || []).length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
                        onClick={() => toggleSort("nombre")}
                      >
                        Nombre
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
                        onClick={() => toggleSort("campana")}
                      >
                        Campana
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
                        onClick={() => toggleSort("etapa")}
                      >
                        Estado del pipeline
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
                        onClick={() => toggleSort("score")}
                      >
                        Temperatura
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
                        onClick={() => toggleSort("whatsapp")}
                      >
                        WhatsApp
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((lead) => (
                    <TableRow key={lead.id} className="group">
                      {/* Nombre */}
                      <TableCell className="py-3">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {lead.nombre}
                        </Link>
                      </TableCell>

                      {/* Campana */}
                      <TableCell className="py-3">
                        <span className="text-sm text-muted-foreground">
                          {lead.campana || "Sin campana"}
                        </span>
                      </TableCell>

                      {/* Estado del pipeline */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={getEtapaBadgeClasses(lead.etapa)}
                        >
                          {ETAPA_LABELS[lead.etapa]}
                        </Badge>
                      </TableCell>

                      {/* Puntuacion - Barras visuales Korex-style */}
                      <TableCell className="py-3">
                        <ScoreBars
                          score={lead.score}
                          temperatura={lead.temperatura}
                        />
                      </TableCell>

                      {/* WhatsApp status */}
                      <TableCell className="py-3">
                        <WhatsAppStatus
                          tipoEmbudo={lead.tipo_embudo}
                          whatsappCitaEnviado={lead.whatsapp_cita_enviado}
                          compraCompletada={lead.compra_completada}
                        />
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/leads/${lead.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Ver estadisticas</span>
                            </Button>
                          </Link>
                          <Link
                            href={`/admin/embudos/${lead.embudo_id}`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Route className="h-4 w-4 text-muted-foreground" />
                              <span className="sr-only">Ver embudo</span>
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (leads || []).length > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        No se encontraron leads con estos filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, sorted.length)} de{" "}
            {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
