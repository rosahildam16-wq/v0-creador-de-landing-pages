"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, BookOpen, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Course } from "@/lib/courses-data"
import { NIVEL_LABELS, NIVEL_COLORS } from "@/lib/courses-data"

interface CourseCardProps {
  course: Course
  basePath: string // "/admin/academia" or "/member/academia"
  progress?: number // 0-100
}

export function CourseCard({ course, basePath, progress }: CourseCardProps) {
  return (
    <Link
      href={`${basePath}/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/30 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={course.titulo}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Construction Overlay (Universal for all courses for now) */}
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-[1px] transition-opacity duration-300 group-hover:bg-black/40">
          <div className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
              En Construcción
            </span>
          </div>
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
          <div className="flex h-12 w-12 scale-0 items-center justify-center rounded-full bg-primary/90 text-primary-foreground transition-transform duration-300 group-hover:scale-100">
            <Play className="h-5 w-5 ml-0.5" />
          </div>
        </div>

        {/* Level badge */}
        <div className="absolute right-2 top-2 z-20">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", NIVEL_COLORS[course.nivel])}>
            {NIVEL_LABELS[course.nivel]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-foreground leading-snug">
          {course.titulo}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {course.descripcion}
        </p>

        {/* Meta row */}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duracionTotal}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {course.totalLecciones} lecciones
          </span>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mt-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{progress}% completado</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
