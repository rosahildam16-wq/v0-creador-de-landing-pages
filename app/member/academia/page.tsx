"use client"

import { useState } from "react"
import { COURSES, CATEGORIES, getFeaturedCourses, getCoursesByCategory } from "@/lib/courses-data"
import { FeaturedCourseBanner } from "@/components/shared/featured-course-banner"
import { CourseCard } from "@/components/shared/course-card"
import { Search, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getMemberCommunity } from "@/lib/communities-data"

import { NetflixRow } from "@/components/shared/netflix-row"
import { NetflixCard } from "@/components/shared/netflix-card"

export default function MemberAcademiaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  const community = user?.memberId ? getMemberCommunity(user.memberId) : undefined
  const communityId = community?.id

  const featured = getFeaturedCourses(communityId)

  // Group courses by category for Netflix rows
  const categoryGroups = CATEGORIES.filter(c => c !== "Todos").map(cat => ({
    title: cat,
    courses: getCoursesByCategory(cat, communityId)
  }))

  const searchResults = searchQuery
    ? COURSES.filter(c =>
      c.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : []

  const getProgress = (courseId: string) => {
    const hash = courseId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    return hash % 100
  }

  return (
    <div className="flex flex-col gap-8 pb-20 -mt-6">
      {/* Immersive Hero Section */}
      <div className="relative -mx-6 h-[400px] md:h-[500px] overflow-hidden">
        {featured.length > 0 ? (
          <>
            <img
              src={featured[0].thumbnail}
              alt={featured[0].titulo}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05010d] via-[#05010d]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col gap-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="h-6 w-1 bg-primary" />
                <span className="text-xs font-black tracking-widest text-primary uppercase">Contenido Destacado</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                {featured[0].titulo}
              </h1>
              <p className="text-sm md:text-base text-white/60 line-clamp-3 leading-relaxed">
                {featured[0].descripcion}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <button className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-black uppercase text-xs transition-transform hover:scale-105 active:scale-95">
                  <Play className="h-4 w-4 fill-current" />
                  Ver Ahora
                </button>
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-lg font-black uppercase text-xs border border-white/10 transition-colors">
                  Más Información
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-neutral-900 font-black text-white/20 uppercase text-4xl">
            Academia Premium
          </div>
        )}
      </div>

      {/* Global Search */}
      <div className="relative z-10 -mt-12 mx-auto w-full max-w-xl px-2">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative flex items-center bg-black/80 border border-white/10 rounded-xl p-1 backdrop-blur-xl">
            <Search className="ml-3 h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="Busca por título, categoría o habilidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-white focus:ring-0 placeholder:text-white/20 py-3 px-4"
            />
          </div>
        </div>
      </div>

      {searchQuery ? (
        <div className="px-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Resultados de búsqueda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map(course => (
              <NetflixCard
                key={course.id}
                course={course}
                basePath="/member/academia"
                progress={getProgress(course.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Rows */}
          <NetflixRow title="Continuar Viendo">
            {COURSES.slice(0, 5).map(course => (
              <NetflixCard
                key={course.id}
                course={course}
                basePath="/member/academia"
                progress={getProgress(course.id)}
              />
            ))}
          </NetflixRow>

          {categoryGroups.map(group => group.courses.length > 0 && (
            <NetflixRow key={group.title} title={group.title}>
              {group.courses.map(course => (
                <NetflixCard
                  key={course.id}
                  course={course}
                  basePath="/member/academia"
                />
              ))}
            </NetflixRow>
          ))}
        </div>
      )}
    </div>
  )
}
