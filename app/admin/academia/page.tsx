"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { COURSES, CATEGORIES, getCoursesByCategory } from "@/lib/courses-data"
import { NIVEL_LABELS, NIVEL_COLORS } from "@/lib/courses-data"
import type { Course } from "@/lib/courses-data"
import { Search, Plus, BookOpen, Clock, Users, Eye, MoreVertical, Edit, Trash2, BarChart3, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminAcademiaPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")

  const filtered = getCoursesByCategory(selectedCategory).filter((c) =>
    searchQuery
      ? c.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  )

  // Mock stats
  const totalStudents = 8
  const totalCourses = COURSES.length
  const totalLessons = COURSES.reduce((sum, c) => sum + c.totalLecciones, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Academia</h1>
          <p className="text-sm text-muted-foreground">Gestiona los cursos y contenido de tu comunidad</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Nuevo curso
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card flex items-center gap-3 rounded-xl p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">{totalCourses}</span>
            <span className="text-[11px] text-muted-foreground">Cursos totales</span>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3 rounded-xl p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <BookOpen className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">{totalLessons}</span>
            <span className="text-[11px] text-muted-foreground">Lecciones totales</span>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3 rounded-xl p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Users className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">{totalStudents}</span>
            <span className="text-[11px] text-muted-foreground">Estudiantes activos</span>
          </div>
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border/50 bg-secondary/30 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-secondary/30 p-1">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lista
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                selectedCategory === cat
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course list/grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
          <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No se encontraron cursos</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <AdminCourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((course) => (
            <AdminCourseRow key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

function AdminCourseCard({ course }: { course: Course }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/30 bg-card transition-all duration-200 hover:border-primary/20">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={course.titulo}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", NIVEL_COLORS[course.nivel])}>
            {NIVEL_LABELS[course.nivel]}
          </span>
        </div>
        {course.destacado && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-primary/80 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              Destacado
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between">
          <h3 className="line-clamp-2 text-sm font-bold text-foreground leading-snug flex-1">
            {course.titulo}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-3.5 w-3.5" />
                Editar curso
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-3.5 w-3.5" />
                Vista previa
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-3.5 w-3.5" />
                Estadisticas
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
          {course.descripcion}
        </p>

        <div className="mt-auto flex items-center gap-3 pt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duracionTotal}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.totalLecciones} lecciones
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {Math.floor(Math.random() * 8) + 1}
          </span>
        </div>
      </div>
    </div>
  )
}

function AdminCourseRow({ course }: { course: Course }) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card p-3 transition-all duration-200 hover:border-primary/20">
      {/* Thumbnail */}
      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={course.thumbnail}
          alt={course.titulo}
          fill
          className="object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold text-foreground">{course.titulo}</h3>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", NIVEL_COLORS[course.nivel])}>
            {NIVEL_LABELS[course.nivel]}
          </span>
          {course.destacado && (
            <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Destacado
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>{course.categoria}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duracionTotal}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.totalLecciones} lecciones
          </span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit className="mr-2 h-3.5 w-3.5" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Eye className="mr-2 h-3.5 w-3.5" />
            Vista previa
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
