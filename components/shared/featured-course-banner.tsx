"use client"

import Image from "next/image"
import Link from "next/link"
import { Play, Clock, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Course } from "@/lib/courses-data"
import { NIVEL_LABELS, NIVEL_COLORS } from "@/lib/courses-data"

interface FeaturedCourseBannerProps {
  course: Course
  basePath: string
}

export function FeaturedCourseBanner({ course, basePath }: FeaturedCourseBannerProps) {
  const bannerSrc = course.banner || course.thumbnail

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background image */}
      <div className="relative aspect-[21/9] sm:aspect-[3/1]">
        <Image
          src={bannerSrc}
          alt={course.titulo}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:justify-center sm:p-8">
        <div className="flex max-w-md flex-col gap-3">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", NIVEL_COLORS[course.nivel])}>
              {NIVEL_LABELS[course.nivel]}
            </span>
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              Destacado
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white sm:text-2xl text-balance">
            {course.titulo}
          </h2>

          {/* Description */}
          <p className="line-clamp-2 text-xs text-white/70 leading-relaxed sm:text-sm">
            {course.descripcion}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.duracionTotal}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.totalLecciones} lecciones
            </span>
            <span>{course.instructor}</span>
          </div>

          {/* CTA */}
          <Link
            href={`${basePath}/${course.id}`}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Play className="h-4 w-4" />
            Comenzar curso
          </Link>
        </div>
      </div>
    </div>
  )
}
