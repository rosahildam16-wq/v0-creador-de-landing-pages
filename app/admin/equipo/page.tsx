"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Link2, ChevronDown, Shield } from "lucide-react"
import { getTeamMembers } from "@/lib/team-data"
import { TeamMemberCard } from "@/components/admin/team-member-card"
import { getAllCommunities, getAllCommunityMembers, type CommunityMember } from "@/lib/communities-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type SortOption = "reciente" | "renovacion" | "estado"
type FilterOption = "leads" | "cerrados" | "afiliados"
type MetricViewOption = "publicidad" | "organico"

const SORT_LABELS: Record<SortOption, string> = {
  reciente: "Mas reciente",
  renovacion: "Proximo a renovar",
  estado: "Estado",
}

const FILTER_LABELS: Record<FilterOption, string> = {
  leads: "Mas leads totales",
  cerrados: "Mas cerrados",
  afiliados: "Mas afiliados",
}

export default function EquipoPage() {
  const allMembers = getTeamMembers()
  const communities = getAllCommunities()
  const communityMembers = getAllCommunityMembers()

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("reciente")
  const [filter, setFilter] = useState<FilterOption>("leads")
  const [metricView, setMetricView] = useState<MetricViewOption>("publicidad")
  const [communityFilter, setCommunityFilter] = useState<string>("all")

  // Helper to get community for a member
  const getMemberComm = (memberId: string): CommunityMember | undefined =>
    communityMembers.find((cm) => cm.memberId === memberId)

  const filtered = useMemo(() => {
    let result = [...allMembers]

    // filter by community
    if (communityFilter !== "all") {
      const cmIds = communityMembers.filter((cm) => cm.communityId === communityFilter).map((cm) => cm.memberId)
      result = result.filter((m) => cmIds.includes(m.id))
    }

    // search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) => m.nombre.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      )
    }

    // sort
    if (sort === "reciente") {
      result.sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())
    } else if (sort === "renovacion") {
      result.sort((a, b) => {
        if (!a.fecha_renovacion) return 1
        if (!b.fecha_renovacion) return -1
        return 0
      })
    } else if (sort === "estado") {
      result.sort((a, b) => (a.publicidad_activa === b.publicidad_activa ? 0 : a.publicidad_activa ? -1 : 1))
    }

    // filter (secondary sort by metric)
    if (filter === "leads") {
      result.sort((a, b) => b.metricas.leads - a.metricas.leads)
    } else if (filter === "cerrados") {
      result.sort((a, b) => b.metricas.cerrados - a.metricas.cerrados)
    } else if (filter === "afiliados") {
      result.sort((a, b) => b.metricas.afiliados - a.metricas.afiliados)
    }

    return result
  }, [allMembers, search, sort, filter, communityFilter, communityMembers])

  const totalLeads = allMembers.reduce((sum, m) => sum + m.metricas.leads, 0)
  const totalActivos = allMembers.filter((m) => m.publicidad_activa).length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-sm text-muted-foreground">
            {allMembers.length} miembros &middot; {totalActivos} activos &middot; {totalLeads} leads totales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar nuevo</span>
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Invitar colaborador</span>
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Community filter */}
          <div className="flex gap-1 mr-2">
            <button
              onClick={() => setCommunityFilter("all")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                communityFilter === "all"
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Todos
            </button>
            {communities.filter(c => c.activa).map((comm) => (
              <button
                key={comm.id}
                onClick={() => setCommunityFilter(comm.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  communityFilter === comm.id
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: comm.color }} />
                {comm.nombre}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border/40" />

          {/* Sort pills */}
          <span className="text-xs text-muted-foreground">Ordenar por:</span>
          <div className="flex gap-1">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  sort === key
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Metric view pills */}
          <span className="ml-2 text-xs text-muted-foreground">Ver metricas:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setMetricView("publicidad")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                metricView === "publicidad"
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Publicidad
            </button>
            <button
              onClick={() => setMetricView("organico")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                metricView === "organico"
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Organico
            </button>
          </div>

          {/* Filter dropdown */}
          <span className="ml-2 text-xs text-muted-foreground">Filtrar por:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                {FILTER_LABELS[filter]}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(FILTER_LABELS) as FilterOption[]).map((key) => (
                <DropdownMenuItem key={key} onClick={() => setFilter(key)}>
                  {FILTER_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((member, i) => (
          <TeamMemberCard key={member.id} member={member} index={i} metricView={metricView} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">No se encontraron miembros</p>
          <p className="text-sm text-muted-foreground/70">Intenta con otro termino de busqueda</p>
        </div>
      )}
    </div>
  )
}
