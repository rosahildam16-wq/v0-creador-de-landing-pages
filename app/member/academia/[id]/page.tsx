"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import {
    ArrowLeft, Play, CheckCircle2, ChevronDown, ChevronUp,
    Clock, BookOpen, Loader2, AlertCircle, GraduationCap, Lock
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lesson {
    id: string
    title: string
    description: string
    video_url: string | null
    duration_seconds: number
    sort_order: number
    status: string
    is_free_preview: boolean
}

interface Module {
    id: string
    title: string
    description: string
    sort_order: number
    lessons: Lesson[]
}

interface Course {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    level: string
    category: string
    status: string
    community_id: string | null
    modules: Module[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
    basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado"
}
const LEVEL_COLORS: Record<string, string> = {
    basico: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    intermedio: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    avanzado: "text-red-400 bg-red-500/10 border-red-500/20",
}

function getEmbedUrl(videoUrl: string): string | null {
    if (!videoUrl) return null
    // YouTube
    const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
    // Vimeo
    const vm = videoUrl.match(/vimeo\.com\/(\d+)/)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}?dnt=1`
    return null
}

function formatDuration(seconds: number): string {
    if (!seconds) return ""
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
}

function flattenLessons(modules: Module[]): Lesson[] {
    return modules.flatMap((m) => m.lessons)
}

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({ lesson, thumbnail }: { lesson: Lesson | null; thumbnail: string | null }) {
    const embedUrl = lesson?.video_url ? getEmbedUrl(lesson.video_url) : null

    if (!lesson) {
        return (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border/30 bg-black shadow-2xl flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Selecciona una lección</p>
            </div>
        )
    }

    if (embedUrl) {
        return (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border/30 bg-black shadow-2xl shadow-primary/10">
                <iframe
                    src={embedUrl}
                    title={lesson.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            </div>
        )
    }

    // Fallback: no video or unsupported URL
    return (
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border/30 bg-black shadow-2xl">
            {thumbnail && (
                <img src={thumbnail} alt={lesson.title} className="absolute inset-0 h-full w-full object-cover opacity-30 blur-sm" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                {lesson.video_url ? (
                    <>
                        <AlertCircle className="h-10 w-10 text-amber-400/60" />
                        <p className="text-sm font-semibold text-white/70">Formato de video no compatible</p>
                        <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity">
                            <Play className="h-3.5 w-3.5" /> Abrir video externo
                        </a>
                    </>
                ) : (
                    <>
                        <GraduationCap className="h-10 w-10 text-primary/40" />
                        <p className="text-sm font-semibold text-white/70">{lesson.title}</p>
                        <p className="text-xs text-white/40">Esta lección no tiene video asignado</p>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberCourseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
    const [expandedModules, setExpandedModules] = useState<string[]>([])
    const [toggling, setToggling] = useState(false)

    // Load course
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/academia/courses/${id}`)
                if (res.status === 404) { setNotFound(true); return }
                const data = await res.json()
                if (!data.course) { setNotFound(true); return }
                const c: Course = data.course
                setCourse(c)
                // Auto-select first lesson
                const first = c.modules?.[0]?.lessons?.[0]
                if (first) setSelectedLessonId(first.id)
                // Expand all modules
                setExpandedModules(c.modules?.map((m) => m.id) ?? [])
            } catch {
                setNotFound(true)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    // Load progress from DB
    useEffect(() => {
        if (!id) return
        const load = async () => {
            try {
                const res = await fetch(`/api/academia/progress?course_id=${id}`)
                const data = await res.json()
                setCompletedLessons(new Set(data.completedLessons ?? []))
            } catch { /* silently fail, progress from localStorage as fallback */ }
        }
        load()
    }, [id])

    const handleToggleComplete = useCallback(async (lessonId: string) => {
        if (toggling) return
        setToggling(true)
        const isCompleted = completedLessons.has(lessonId)
        // Optimistic update
        setCompletedLessons((prev) => {
            const next = new Set(prev)
            if (isCompleted) next.delete(lessonId); else next.add(lessonId)
            return next
        })
        try {
            await fetch("/api/academia/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonId, completed: !isCompleted }),
            })
        } catch {
            // Revert on error
            setCompletedLessons((prev) => {
                const next = new Set(prev)
                if (isCompleted) next.add(lessonId); else next.delete(lessonId)
                return next
            })
        } finally {
            setToggling(false)
        }
    }, [completedLessons, toggling])

    // Navigate to next lesson
    const allLessons = course ? flattenLessons(course.modules) : []
    const currentIdx = allLessons.findIndex((l) => l.id === selectedLessonId)
    const nextLesson = currentIdx >= 0 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
    const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null

    const currentLesson = allLessons.find((l) => l.id === selectedLessonId) ?? null

    // Progress %
    const totalLessons = allLessons.length
    const completedCount = allLessons.filter((l) => completedLessons.has(l.id)).length
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        )
    }

    if (notFound || !course) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm font-semibold text-foreground">Curso no encontrado</p>
                <Link href="/member/academia" className="mt-3 text-sm text-primary hover:underline">
                    Volver a la academia
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Back */}
            <Link href="/member/academia"
                className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver a la academia
            </Link>

            {/* Video Player */}
            <VideoPlayer lesson={currentLesson} thumbnail={course.thumbnail_url} />

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {prevLesson && (
                        <button onClick={() => setSelectedLessonId(prevLesson.id)}
                            className="flex items-center gap-1.5 rounded-xl border border-border/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                            ← Anterior
                        </button>
                    )}
                    {nextLesson && (
                        <button onClick={() => setSelectedLessonId(nextLesson.id)}
                            className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                            Siguiente →
                        </button>
                    )}
                </div>
                {currentLesson && (
                    <button
                        onClick={() => handleToggleComplete(currentLesson.id)}
                        disabled={toggling}
                        className={cn(
                            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-70",
                            completedLessons.has(currentLesson.id)
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        )}>
                        {toggling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : completedLessons.has(currentLesson.id) ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        {completedLessons.has(currentLesson.id) ? "Lección completada" : "Marcar como completada"}
                    </button>
                )}
            </div>

            {/* Course info + curriculum */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Left: Info */}
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", LEVEL_COLORS[course.level])}>
                                {LEVEL_LABELS[course.level]}
                            </span>
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {course.category}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-foreground text-balance">{course.title}</h1>
                        {course.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{course.description}</p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-2">
                            <BookOpen className="h-3.5 w-3.5" />
                            {totalLessons} lecciones
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            {completedCount} completadas
                        </div>
                    </div>

                    {/* Progress bar */}
                    {totalLessons > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>Progreso del curso</span>
                                <span className="font-bold text-foreground">{progressPct}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/40">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            {progressPct === 100 && (
                                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> ¡Curso completado!
                                </p>
                            )}
                        </div>
                    )}

                    {/* Lesson description */}
                    {currentLesson?.description && (
                        <div className="rounded-xl border border-border/30 bg-card/40 p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Sobre esta lección</p>
                            <p className="text-xs text-foreground/80 leading-relaxed">{currentLesson.description}</p>
                        </div>
                    )}
                </div>

                {/* Right: Curriculum */}
                <div className="flex flex-col gap-2 lg:col-span-3">
                    <h2 className="mb-1 text-sm font-bold text-foreground">Curriculum</h2>

                    {course.modules.map((module) => {
                        const isExpanded = expandedModules.includes(module.id)
                        const moduleCompleted = module.lessons.filter((l) => completedLessons.has(l.id)).length

                        return (
                            <div key={module.id} className="overflow-hidden rounded-xl border border-border/30 bg-card/40">
                                <button
                                    onClick={() => setExpandedModules((prev) =>
                                        prev.includes(module.id)
                                            ? prev.filter((m) => m !== module.id)
                                            : [...prev, module.id]
                                    )}
                                    className="flex w-full items-center justify-between bg-secondary/20 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-foreground">{module.title}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {moduleCompleted}/{module.lessons.length} lecciones
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {moduleCompleted === module.lessons.length && module.lessons.length > 0 && (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                        )}
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="flex flex-col">
                                        {module.lessons.map((lesson, idx) => {
                                            const isActive = selectedLessonId === lesson.id
                                            const isCompleted = completedLessons.has(lesson.id)
                                            const hasVideo = !!lesson.video_url && !!getEmbedUrl(lesson.video_url)

                                            return (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => setSelectedLessonId(lesson.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-3 text-left transition-all border-t border-border/10",
                                                        isActive
                                                            ? "bg-primary/[0.08] shadow-[inset_4px_0_0_hsl(var(--primary))]"
                                                            : "hover:bg-secondary/20"
                                                    )}
                                                >
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                                                        {isCompleted ? (
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                            </div>
                                                        ) : isActive ? (
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                                                                <Play className="h-2.5 w-2.5 ml-0.5" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground/60">{idx + 1}</span>
                                                        )}
                                                    </div>

                                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                        <span className={cn(
                                                            "truncate text-xs transition-colors",
                                                            isActive ? "font-bold text-foreground" : "text-foreground/80",
                                                            isCompleted && !isActive && "text-muted-foreground/70"
                                                        )}>
                                                            {lesson.title}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {lesson.duration_seconds > 0 && (
                                                                <span className="text-[9px] text-muted-foreground/50 font-mono flex items-center gap-0.5">
                                                                    <Clock className="h-2.5 w-2.5" />
                                                                    {formatDuration(lesson.duration_seconds)}
                                                                </span>
                                                            )}
                                                            {isCompleted && (
                                                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Completada</span>
                                                            )}
                                                            {!hasVideo && lesson.video_url && (
                                                                <span className="text-[8px] text-amber-400 uppercase tracking-tighter">Sin embed</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {course.modules.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border/30">
                            <BookOpen className="h-8 w-8 text-muted-foreground/20 mb-2" />
                            <p className="text-xs text-muted-foreground">Este curso aún no tiene lecciones</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
