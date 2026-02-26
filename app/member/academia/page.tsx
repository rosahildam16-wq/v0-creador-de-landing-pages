"use client"

import { useState } from "react"
import { COURSES, CATEGORIES, getFeaturedCourses, getCoursesByCategory } from "@/lib/courses-data"
import { FeaturedCourseBanner } from "@/components/shared/featured-course-banner"
import { CourseCard } from "@/components/shared/course-card"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getMemberCommunity } from "@/lib/communities-data"

export default function MemberAcademiaPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  const community = user?.memberId ? getMemberCommunity(user.memberId) : undefined
  const communityId = community?.id

  const featured = getFeaturedCourses(communityId)
  const filtered = getCoursesByCategory(selectedCategory, communityId).filter((c) =>
    searchQuery
      ? c.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  )

  // Generate random progress for demo
  const getProgress = (courseId: string) => {
    const hash = courseId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    return hash % 100
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Academia</h1>
        <p className="text-sm text-muted-foreground">Tu plataforma de entrenamiento y formacion</p>
      </div>

      {/* Featured Banner */}
      {featured.length > 0 && !searchQuery && selectedCategory === "Todos" && (
        <FeaturedCourseBanner course={featured[0]} basePath="/member/academia" />
      )}

      {/* Search & Categories */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-secondary/30 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
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

      {/* Continue watching (if applicable) */}
      {!searchQuery && selectedCategory === "Todos" && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-foreground">Continuar viendo</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 3).map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                basePath="/member/academia"
                progress={getProgress(course.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All courses / filtered */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-foreground">
          {searchQuery
            ? `Resultados (${filtered.length})`
            : selectedCategory === "Todos"
              ? "Todos los cursos"
              : selectedCategory}
        </h2>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
            <p className="text-sm text-muted-foreground">
              No se encontraron cursos con esos criterios
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                basePath="/member/academia"
                progress={getProgress(course.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
