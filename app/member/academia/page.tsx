"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { NetflixRow } from "@/components/shared/netflix-row"
import { NetflixCard } from "@/components/shared/netflix-card"
import { Search, Play, GraduationCap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Course {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    level: "basico" | "intermedio" | "avanzado"
    category: string
    status: string
    is_featured: boolean
    module_count: number
    lesson_count: number
    community_id: string | null
}

const LEVEL_LABELS: Record<string, string> = {
    basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado"
}
const LEVEL_COLORS: Record<string, string> = {
    basico: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    intermedio: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    avanzado: "text-red-400 bg-red-500/10 border-red-500/20",
}

// Map DB course to the shape NetflixCard expects
function toCardShape(course: Course) {
    return {
        id: course.id,
        titulo: course.title,
        descripcion: course.description,
        thumbnail: course.thumbnail_url || "/images/courses/placeholder.jpg",
        nivel: course.level,
        categoria: course.category,
        duracionTotal: `${course.lesson_count} lecciones`,
        totalLecciones: course.lesson_count,
        destacado: course.is_featured,
        tags: [course.category],
        instructor: "",
        modulos: [],
    }
}

export default function MemberAcademiaPage() {
    const { user } = useAuth()
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [progress, setProgress] = useState<Record<string, number>>({})

    useEffect(() => {
        const load = async () => {
            try {
                const params = new URLSearchParams()
                if (user?.communityId) params.set("community_id", user.communityId)
                const res = await fetch(`/api/academia/courses?${params}`)
                const data = await res.json()
                const loaded: Course[] = data.courses || []
                setCourses(loaded)

                // Load progress for each course
                if (loaded.length > 0) {
                    const progressMap: Record<string, number> = {}
                    await Promise.all(loaded.map(async (c) => {
                        try {
                            const pr = await fetch(`/api/academia/progress?course_id=${c.id}`)
                            const pd = await pr.json()
                            const completed = pd.completedLessons?.length ?? 0
                            progressMap[c.id] = c.lesson_count > 0 ? Math.round((completed / c.lesson_count) * 100) : 0
                        } catch { progressMap[c.id] = 0 }
                    }))
                    setProgress(progressMap)
                }
            } catch {
                setCourses([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [user?.communityId])

    const featured = courses.filter((c) => c.is_featured)
    const hero = featured[0] ?? courses[0]

    const categories = [...new Set(courses.map((c) => c.category))]
    const inProgress = courses.filter((c) => (progress[c.id] ?? 0) > 0 && (progress[c.id] ?? 0) < 100)

    const searchResults = searchQuery
        ? courses.filter((c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : []

    return (
        <div className="flex flex-col gap-8 pb-20 -mt-6">
            {/* Hero */}
            <div className="relative -mx-6 h-[400px] md:h-[500px] overflow-hidden">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center bg-neutral-900">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                ) : hero ? (
                    <>
                        {hero.thumbnail_url ? (
                            <img src={hero.thumbnail_url} alt={hero.title} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-900/60 to-[#05010d]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#05010d] via-[#05010d]/40 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col gap-4 max-w-2xl">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-1 bg-primary" />
                                <span className="text-xs font-black tracking-widest text-primary uppercase">Contenido Destacado</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                                {hero.title}
                            </h1>
                            <p className="text-sm md:text-base text-white/60 line-clamp-2 leading-relaxed">
                                {hero.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <Link href={`/member/academia/${hero.id}`}
                                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-black uppercase text-xs transition-transform hover:scale-105 active:scale-95">
                                    <Play className="h-4 w-4 fill-current" />
                                    Ver Ahora
                                </Link>
                                <div className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold", LEVEL_COLORS[hero.level])}>
                                    {LEVEL_LABELS[hero.level]}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/10 via-neutral-900 to-[#05010d]">
                        <GraduationCap className="h-16 w-16 text-primary/30" />
                        <p className="text-lg font-black text-white/20 uppercase tracking-widest">Academia Premium</p>
                        <p className="text-sm text-white/30">Los cursos aparecerán aquí cuando estén disponibles</p>
                    </div>
                )}
            </div>

            {/* Search */}
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

            {loading && !hero ? null : searchQuery ? (
                <div className="px-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                        Resultados ({searchResults.length})
                    </h2>
                    {searchResults.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin resultados para "{searchQuery}"</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.map((course) => (
                                <NetflixCard
                                    key={course.id}
                                    course={toCardShape(course)}
                                    basePath="/member/academia"
                                    progress={progress[course.id]}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* In progress row */}
                    {inProgress.length > 0 && (
                        <NetflixRow title="Continuar Viendo">
                            {inProgress.map((course) => (
                                <NetflixCard
                                    key={course.id}
                                    course={toCardShape(course)}
                                    basePath="/member/academia"
                                    progress={progress[course.id]}
                                />
                            ))}
                        </NetflixRow>
                    )}

                    {/* All courses row */}
                    {courses.length > 0 && (
                        <NetflixRow title="Todos los cursos">
                            {courses.map((course) => (
                                <NetflixCard
                                    key={course.id}
                                    course={toCardShape(course)}
                                    basePath="/member/academia"
                                    progress={progress[course.id]}
                                />
                            ))}
                        </NetflixRow>
                    )}

                    {/* Category rows */}
                    {categories.map((cat) => {
                        const catCourses = courses.filter((c) => c.category === cat)
                        if (catCourses.length < 2) return null
                        return (
                            <NetflixRow key={cat} title={cat}>
                                {catCourses.map((course) => (
                                    <NetflixCard
                                        key={course.id}
                                        course={toCardShape(course)}
                                        basePath="/member/academia"
                                        progress={progress[course.id]}
                                    />
                                ))}
                            </NetflixRow>
                        )
                    })}

                    {/* Empty state */}
                    {!loading && courses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <GraduationCap className="h-16 w-16 text-muted-foreground/15 mb-4" />
                            <p className="text-lg font-bold text-foreground">Academia en construcción</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                Los cursos de tu comunidad aparecerán aquí en cuanto estén disponibles.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
