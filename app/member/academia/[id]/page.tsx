"use client"

import { use, useState } from "react"
import { getCourseById } from "@/lib/courses-data"
import { NIVEL_LABELS, NIVEL_COLORS } from "@/lib/courses-data"
import { ArrowLeft, Play, Clock, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function MemberCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const course = getCourseById(id)
  const [expandedModules, setExpandedModules] = useState<string[]>(course?.modulos[0]?.id ? [course.modulos[0].id] : [])
  const [selectedLesson, setSelectedLesson] = useState<string | null>(
    course?.modulos[0]?.lecciones[0]?.id ?? null
  )

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Curso no encontrado</p>
        <Link href="/member/academia" className="mt-2 text-sm text-primary hover:underline">
          Volver a la academia
        </Link>
      </div>
    )
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    )
  }

  // Find current selected lesson details
  let currentLesson = null
  for (const mod of course.modulos) {
    const found = mod.lecciones.find((l) => l.id === selectedLesson)
    if (found) {
      currentLesson = found
      break
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Link
        href="/member/academia"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a la academia
      </Link>

      {/* Video Player Area */}
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border/30 bg-black">
        <Image
          src={course.thumbnail}
          alt={currentLesson?.titulo ?? course.titulo}
          fill
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <button className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform hover:scale-110">
            <Play className="h-7 w-7 ml-1" />
          </button>
          <p className="text-sm font-medium text-white/80">
            {currentLesson?.titulo ?? "Selecciona una leccion"}
          </p>
        </div>
      </div>

      {/* Course info + curriculum side by side on larger screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Course info */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Title & meta */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", NIVEL_COLORS[course.nivel])}>
                {NIVEL_LABELS[course.nivel]}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {course.categoria}
              </span>
            </div>
            <h1 className="text-xl font-bold text-foreground text-balance">
              {course.titulo}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {course.descripcion}
            </p>
          </div>

          {/* Meta cards */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-2">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.duracionTotal}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{course.totalLecciones} lecciones</span>
            </div>
          </div>

          {/* Instructor */}
          <div className="glass-card flex items-center gap-3 rounded-xl p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {course.instructor.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{course.instructor}</span>
              <span className="text-[11px] text-muted-foreground">Instructor</span>
            </div>
          </div>
        </div>

        {/* Right: Curriculum */}
        <div className="flex flex-col gap-2 lg:col-span-3">
          <h2 className="mb-1 text-sm font-bold text-foreground">Curriculum</h2>

          {course.modulos.map((modulo) => {
            const isExpanded = expandedModules.includes(modulo.id)
            const lessonCount = modulo.lecciones.length

            return (
              <div key={modulo.id} className="overflow-hidden rounded-xl border border-border/30">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(modulo.id)}
                  className="flex w-full items-center justify-between bg-secondary/30 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-foreground">
                      {modulo.titulo}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {lessonCount} lecciones
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Lessons */}
                {isExpanded && (
                  <div className="flex flex-col">
                    {modulo.lecciones.map((leccion, idx) => {
                      const isActive = selectedLesson === leccion.id
                      const isCompleted = idx === 0 // Simulate first lesson completed

                      return (
                        <button
                          key={leccion.id}
                          onClick={() => setSelectedLesson(leccion.id)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-left transition-colors border-t border-border/20",
                            isActive
                              ? "bg-primary/[0.06] border-l-2 border-l-primary"
                              : "hover:bg-secondary/20"
                          )}
                        >
                          {/* Lesson number / status */}
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : isActive ? (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <Play className="h-2.5 w-2.5 text-primary-foreground ml-0.5" />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{idx + 1}</span>
                            )}
                          </div>

                          {/* Lesson info */}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className={cn(
                              "truncate text-xs",
                              isActive ? "font-semibold text-foreground" : "text-foreground/80"
                            )}>
                              {leccion.titulo}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {leccion.duracion}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
