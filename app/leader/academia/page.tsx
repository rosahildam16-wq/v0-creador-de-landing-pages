"use client"

import { useState, useEffect, useCallback } from "react"
import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { ImageUploader } from "@/components/ui/image-uploader"
import {
    GraduationCap, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
    Play, BookOpen, Layers, Eye, EyeOff, ArrowLeft, Loader2,
    Check, X, MoveUp, MoveDown, Globe, Lock, Video, Save
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface DBLesson {
    id: string
    title: string
    description: string
    video_url: string | null
    duration_seconds: number
    sort_order: number
    status: "draft" | "published"
    is_free_preview: boolean
}

interface DBModule {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    sort_order: number
    lessons: DBLesson[]
}

interface DBCourse {
    id: string
    title: string
    description: string
    thumbnail_url: string | null
    level: "basico" | "intermedio" | "avanzado"
    category: string
    status: "draft" | "published"
    is_featured: boolean
    community_id: string | null
    access_type: "free" | "community" | "paid"
    price: number
    sort_order: number
    module_count?: number
    lesson_count?: number
    modules?: DBModule[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["General", "Marketing Digital", "Ventas", "Liderazgo", "Redes Sociales", "Mindset", "Crecimiento Personal"]
const LEVELS = [
    { value: "basico", label: "Básico", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { value: "intermedio", label: "Intermedio", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { value: "avanzado", label: "Avanzado", color: "text-red-400 bg-red-500/10 border-red-500/20" },
]

function getVideoEmbed(url: string): string | null {
    if (!url) return null
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
    const vm = url.match(/vimeo\.com\/(\d+)/)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`
    return null
}

function formatSeconds(s: number) {
    if (!s) return ""
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
}

// ─── LessonRow ────────────────────────────────────────────────────────────────

function LessonRow({
    lesson, moduleId, onUpdate, onDelete, onMove, isFirst, isLast
}: {
    lesson: DBLesson
    moduleId: string
    onUpdate: (lesson: DBLesson) => void
    onDelete: (id: string) => void
    onMove: (id: string, dir: "up" | "down") => void
    isFirst: boolean
    isLast: boolean
}) {
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(lesson.title)
    const [desc, setDesc] = useState(lesson.description)
    const [videoUrl, setVideoUrl] = useState(lesson.video_url || "")
    const [saving, setSaving] = useState(false)
    const embedUrl = getVideoEmbed(videoUrl)

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/academia/lessons/${lesson.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), description: desc.trim(), video_url: videoUrl.trim() || null }),
            })
            const data = await res.json()
            if (data.lesson) {
                onUpdate(data.lesson)
                setEditing(false)
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`¿Eliminar lección "${lesson.title}"?`)) return
        await fetch(`/api/academia/lessons/${lesson.id}`, { method: "DELETE" })
        onDelete(lesson.id)
    }

    return (
        <div className={cn("border-t border-border/10 bg-card/30 transition-all", editing && "bg-card/60")}>
            {!editing ? (
                <div className="flex items-center gap-3 px-4 py-2.5 group">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                        {lesson.sort_order + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{lesson.title}</p>
                        {lesson.video_url && (
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Video className="h-2.5 w-2.5" />
                                Video enlazado
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onMove(lesson.id, "up")} disabled={isFirst} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                            <MoveUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => onMove(lesson.id, "down")} disabled={isLast} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                            <MoveDown className="h-3 w-3" />
                        </button>
                        <button onClick={() => setEditing(true)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors">
                            <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={handleDelete} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-4 space-y-3">
                    <input
                        autoFocus
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título de la lección"
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                    <textarea
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Descripción opcional..."
                        rows={2}
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50 resize-none"
                    />
                    <div>
                        <input
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="URL del video (YouTube o Vimeo)"
                            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                        />
                        {videoUrl && !embedUrl && (
                            <p className="mt-1 text-[10px] text-amber-400">URL no reconocida. Usa YouTube o Vimeo.</p>
                        )}
                        {embedUrl && (
                            <p className="mt-1 text-[10px] text-emerald-400 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Video válido detectado
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditing(false); setTitle(lesson.title); setDesc(lesson.description); setVideoUrl(lesson.video_url || "") }}
                            className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving || !title.trim()}
                            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 transition-opacity">
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Guardar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── ModuleSection ────────────────────────────────────────────────────────────

function ModuleSection({
    mod, courseId, onUpdate, onDelete, onMove, isFirst, isLast
}: {
    mod: DBModule
    courseId: string
    onUpdate: (mod: DBModule) => void
    onDelete: (id: string) => void
    onMove: (id: string, dir: "up" | "down") => void
    isFirst: boolean
    isLast: boolean
}) {
    const [expanded, setExpanded] = useState(true)
    const [editingTitle, setEditingTitle] = useState(false)
    const [title, setTitle] = useState(mod.title)
    const [addingLesson, setAddingLesson] = useState(false)
    const [newLessonTitle, setNewLessonTitle] = useState("")
    const [saving, setSaving] = useState(false)

    const saveTitle = async () => {
        if (!title.trim()) return
        setSaving(true)
        try {
            const res = await fetch(`/api/academia/modules/${mod.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim() }),
            })
            const data = await res.json()
            if (data.module) onUpdate({ ...mod, title: data.module.title })
            setEditingTitle(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteModule = async () => {
        if (!confirm(`¿Eliminar módulo "${mod.title}" y todas sus lecciones?`)) return
        await fetch(`/api/academia/modules/${mod.id}`, { method: "DELETE" })
        onDelete(mod.id)
    }

    const handleAddLesson = async () => {
        if (!newLessonTitle.trim()) return
        setSaving(true)
        try {
            const res = await fetch(`/api/academia/modules/${mod.id}/lessons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newLessonTitle.trim() }),
            })
            const data = await res.json()
            if (data.lesson) {
                onUpdate({ ...mod, lessons: [...mod.lessons, data.lesson] })
                setNewLessonTitle("")
                setAddingLesson(false)
            }
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateLesson = (updated: DBLesson) => {
        onUpdate({ ...mod, lessons: mod.lessons.map((l) => l.id === updated.id ? updated : l) })
    }

    const handleDeleteLesson = (id: string) => {
        onUpdate({ ...mod, lessons: mod.lessons.filter((l) => l.id !== id).map((l, i) => ({ ...l, sort_order: i })) })
    }

    const handleMoveLesson = async (lessonId: string, dir: "up" | "down") => {
        const idx = mod.lessons.findIndex((l) => l.id === lessonId)
        if ((dir === "up" && idx === 0) || (dir === "down" && idx === mod.lessons.length - 1)) return
        const newLessons = [...mod.lessons]
        const swapIdx = dir === "up" ? idx - 1 : idx + 1
        ;[newLessons[idx], newLessons[swapIdx]] = [newLessons[swapIdx], newLessons[idx]]
        const updated = newLessons.map((l, i) => ({ ...l, sort_order: i }))
        onUpdate({ ...mod, lessons: updated })
        // Persist reorder
        await Promise.all(updated.map((l) =>
            fetch(`/api/academia/lessons/${l.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sort_order: l.sort_order }),
            })
        ))
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border/30 bg-card/20">
            {/* Module header */}
            <div className="flex items-center gap-2 bg-secondary/20 px-3 py-2.5">
                <button onClick={() => setExpanded(!expanded)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {editingTitle ? (
                    <div className="flex flex-1 items-center gap-2">
                        <input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setEditingTitle(false); setTitle(mod.title) } }}
                            className="flex-1 rounded-lg border border-primary/40 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
                        />
                        <button onClick={saveTitle} disabled={saving} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { setEditingTitle(false); setTitle(mod.title) }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{mod.title}</p>
                            <p className="text-[10px] text-muted-foreground">{mod.lessons.length} lecciones</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onMove(mod.id, "up")} disabled={isFirst} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
                                <MoveUp className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => onMove(mod.id, "down")} disabled={isLast} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20">
                                <MoveDown className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingTitle(true)} className="p-1 rounded text-muted-foreground hover:text-primary">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={handleDeleteModule} className="p-1 rounded text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Lessons */}
            {expanded && (
                <>
                    {mod.lessons.length === 0 && !addingLesson && (
                        <div className="px-4 py-3 text-center text-[11px] text-muted-foreground/50">
                            Sin lecciones aún
                        </div>
                    )}
                    {mod.lessons.map((lesson, idx) => (
                        <LessonRow
                            key={lesson.id}
                            lesson={lesson}
                            moduleId={mod.id}
                            onUpdate={handleUpdateLesson}
                            onDelete={handleDeleteLesson}
                            onMove={handleMoveLesson}
                            isFirst={idx === 0}
                            isLast={idx === mod.lessons.length - 1}
                        />
                    ))}

                    {/* Add lesson */}
                    {addingLesson ? (
                        <div className="border-t border-border/10 p-3 flex gap-2">
                            <input
                                autoFocus
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddLesson(); if (e.key === "Escape") { setAddingLesson(false); setNewLessonTitle("") } }}
                                placeholder="Título de la nueva lección..."
                                className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                            />
                            <button onClick={handleAddLesson} disabled={saving || !newLessonTitle.trim()}
                                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                Agregar
                            </button>
                            <button onClick={() => { setAddingLesson(false); setNewLessonTitle("") }}
                                className="px-2 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setAddingLesson(true)}
                            className="flex w-full items-center gap-2 border-t border-border/10 px-4 py-2 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/[0.03] transition-colors">
                            <Plus className="h-3 w-3" />
                            Agregar lección
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

// ─── CourseEditor ─────────────────────────────────────────────────────────────

function CourseEditor({
    course, communityId, onBack, onUpdate
}: {
    course: DBCourse
    communityId: string | null
    onBack: () => void
    onUpdate: (c: DBCourse) => void
}) {
    const [modules, setModules] = useState<DBModule[]>([])
    const [loadingModules, setLoadingModules] = useState(true)
    const [addingModule, setAddingModule] = useState(false)
    const [newModuleTitle, setNewModuleTitle] = useState("")
    const [savingModule, setSavingModule] = useState(false)
    // Course meta editing
    const [title, setTitle] = useState(course.title)
    const [description, setDescription] = useState(course.description)
    const [thumbnail, setThumbnail] = useState(course.thumbnail_url || "")
    const [level, setLevel] = useState(course.level)
    const [category, setCategory] = useState(course.category)
    const [status, setStatus] = useState(course.status)
    const [savingMeta, setSavingMeta] = useState(false)
    const [metaSaved, setMetaSaved] = useState(false)

    useEffect(() => {
        const load = async () => {
            const res = await fetch(`/api/academia/courses/${course.id}/modules`)
            const data = await res.json()
            setModules(data.modules || [])
            setLoadingModules(false)
        }
        load()
    }, [course.id])

    const saveMeta = async () => {
        setSavingMeta(true)
        try {
            const res = await fetch(`/api/academia/courses/${course.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), description: description.trim(), thumbnail_url: thumbnail || null, level, category, status }),
            })
            const data = await res.json()
            if (data.course) {
                onUpdate(data.course)
                setMetaSaved(true)
                setTimeout(() => setMetaSaved(false), 2000)
            }
        } finally {
            setSavingMeta(false)
        }
    }

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return
        setSavingModule(true)
        try {
            const res = await fetch(`/api/academia/courses/${course.id}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newModuleTitle.trim() }),
            })
            const data = await res.json()
            if (data.module) {
                setModules((prev) => [...prev, data.module])
                setNewModuleTitle("")
                setAddingModule(false)
            }
        } finally {
            setSavingModule(false)
        }
    }

    const handleUpdateModule = (updated: DBModule) => {
        setModules((prev) => prev.map((m) => m.id === updated.id ? updated : m))
    }

    const handleDeleteModule = (id: string) => {
        setModules((prev) => prev.filter((m) => m.id !== id).map((m, i) => ({ ...m, sort_order: i })))
    }

    const handleMoveModule = async (moduleId: string, dir: "up" | "down") => {
        const idx = modules.findIndex((m) => m.id === moduleId)
        if ((dir === "up" && idx === 0) || (dir === "down" && idx === modules.length - 1)) return
        const newMods = [...modules]
        const swapIdx = dir === "up" ? idx - 1 : idx + 1
        ;[newMods[idx], newMods[swapIdx]] = [newMods[swapIdx], newMods[idx]]
        const updated = newMods.map((m, i) => ({ ...m, sort_order: i }))
        setModules(updated)
        await Promise.all(updated.map((m) =>
            fetch(`/api/academia/modules/${m.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sort_order: m.sort_order }),
            })
        ))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Volver a cursos
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Left: Meta */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-border/30 bg-card/40 p-5 space-y-4">
                        <h2 className="text-sm font-bold text-foreground">Información del curso</h2>

                        <ImageUploader
                            value={thumbnail}
                            onChange={(url) => setThumbnail(url)}
                            bucket="course-assets"
                            pathPrefix={`courses/${course.id}`}
                            shape="square"
                            height="h-40"
                            label="Portada del curso"
                        />

                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Título</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del curso"
                                className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Descripción</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="De qué trata el curso..."
                                className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Nivel</label>
                                <select value={level} onChange={(e) => setLevel(e.target.value as any)}
                                    className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                                    <option value="basico">Básico</option>
                                    <option value="intermedio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Categoría</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Estado</label>
                            <div className="flex gap-2">
                                <button onClick={() => setStatus("draft")}
                                    className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all",
                                        status === "draft" ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-border/40 text-muted-foreground hover:border-border")}>
                                    <EyeOff className="h-3.5 w-3.5" /> Borrador
                                </button>
                                <button onClick={() => setStatus("published")}
                                    className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all",
                                        status === "published" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-border/40 text-muted-foreground hover:border-border")}>
                                    <Globe className="h-3.5 w-3.5" /> Publicado
                                </button>
                            </div>
                        </div>

                        <button onClick={saveMeta} disabled={savingMeta}
                            className={cn("w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                                metaSaved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50")}>
                            {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : metaSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {metaSaved ? "Guardado" : "Guardar cambios"}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border/30 bg-card/40 p-4 text-center">
                            <p className="text-2xl font-black text-foreground">{modules.length}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Módulos</p>
                        </div>
                        <div className="rounded-xl border border-border/30 bg-card/40 p-4 text-center">
                            <p className="text-2xl font-black text-foreground">{modules.reduce((a, m) => a + m.lessons.length, 0)}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Lecciones</p>
                        </div>
                    </div>
                </div>

                {/* Right: Modules + Lessons */}
                <div className="lg:col-span-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-foreground">Módulos y lecciones</h2>
                        <button onClick={() => setAddingModule(true)}
                            className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                            <Plus className="h-3.5 w-3.5" /> Nuevo módulo
                        </button>
                    </div>

                    {addingModule && (
                        <div className="flex gap-2 rounded-xl border border-primary/20 bg-card/40 p-3">
                            <input autoFocus value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleAddModule(); if (e.key === "Escape") { setAddingModule(false); setNewModuleTitle("") } }}
                                placeholder="Título del nuevo módulo..."
                                className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                            <button onClick={handleAddModule} disabled={savingModule || !newModuleTitle.trim()}
                                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                                {savingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Crear
                            </button>
                            <button onClick={() => { setAddingModule(false); setNewModuleTitle("") }}
                                className="px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {loadingModules ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                        </div>
                    ) : modules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/20 py-16 text-center">
                            <Layers className="h-10 w-10 text-muted-foreground/20 mb-3" />
                            <p className="text-sm font-semibold text-foreground">Sin módulos</p>
                            <p className="text-xs text-muted-foreground mt-1">Crea el primer módulo para agregar lecciones</p>
                        </div>
                    ) : (
                        modules.map((mod, idx) => (
                            <ModuleSection
                                key={mod.id}
                                mod={mod}
                                courseId={course.id}
                                onUpdate={handleUpdateModule}
                                onDelete={handleDeleteModule}
                                onMove={handleMoveModule}
                                isFirst={idx === 0}
                                isLast={idx === modules.length - 1}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── CreateCourseDialog ───────────────────────────────────────────────────────

function CreateCourseDialog({
    communityId, onCreated, onClose
}: {
    communityId: string | null
    onCreated: (c: DBCourse) => void
    onClose: () => void
}) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [thumbnail, setThumbnail] = useState("")
    const [level, setLevel] = useState("basico")
    const [category, setCategory] = useState("General")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const handleCreate = async () => {
        if (!title.trim()) { setError("El título es obligatorio"); return }
        setSaving(true)
        setError("")
        try {
            const res = await fetch("/api/academia/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), description: description.trim(), thumbnail_url: thumbnail || null, level, category, community_id: communityId, status: "draft" }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || "Error al crear el curso"); return }
            onCreated(data.course)
        } catch {
            setError("Error de conexión")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl border border-border/30 bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border/20 px-6 py-4">
                    <h2 className="text-base font-bold text-foreground">Crear nuevo curso</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <ImageUploader
                        value={thumbnail}
                        onChange={setThumbnail}
                        bucket="course-assets"
                        pathPrefix="courses/new"
                        shape="square"
                        height="h-36"
                        label="Portada del curso"
                    />

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Título del curso *</label>
                        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Prospeccion Digital Avanzada"
                            className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Descripción</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                            placeholder="¿De qué trata el curso?"
                            className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Nivel</label>
                            <select value={level} onChange={(e) => setLevel(e.target.value)}
                                className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none">
                                <option value="basico">Básico</option>
                                <option value="intermedio">Intermedio</option>
                                <option value="avanzado">Avanzado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">Categoría</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none">
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}
                </div>

                <div className="flex gap-3 border-t border-border/20 px-6 py-4">
                    <button onClick={onClose} className="flex-1 rounded-xl border border-border/40 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleCreate} disabled={saving || !title.trim()}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                        Crear curso
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeaderAcademiaPage() {
    const { community, loading } = useLeaderCommunity()
    const [courses, setCourses] = useState<DBCourse[]>([])
    const [loadingCourses, setLoadingCourses] = useState(true)
    const [view, setView] = useState<"list" | "editor">("list")
    const [selectedCourse, setSelectedCourse] = useState<DBCourse | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    const fetchCourses = useCallback(async () => {
        setLoadingCourses(true)
        try {
            const res = await fetch("/api/academia/courses?owner_only=true&include_all=true")
            const data = await res.json()
            setCourses(data.courses || [])
        } catch {
            setCourses([])
        } finally {
            setLoadingCourses(false)
        }
    }, [])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    const handleToggleStatus = async (course: DBCourse) => {
        const newStatus = course.status === "published" ? "draft" : "published"
        const res = await fetch(`/api/academia/courses/${course.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        })
        const data = await res.json()
        if (data.course) {
            setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status: newStatus } : c))
        }
    }

    const handleDeleteCourse = async (id: string) => {
        if (!confirm("¿Eliminar este curso? Se borrarán todos sus módulos y lecciones.")) return
        await fetch(`/api/academia/courses/${id}`, { method: "DELETE" })
        setCourses((prev) => prev.filter((c) => c.id !== id))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        )
    }

    if (view === "editor" && selectedCourse) {
        return (
            <CourseEditor
                course={selectedCourse}
                communityId={community?.id || null}
                onBack={() => { setView("list"); setSelectedCourse(null) }}
                onUpdate={(updated) => {
                    setCourses((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c))
                    setSelectedCourse((prev) => prev ? { ...prev, ...updated } : null)
                }}
            />
        )
    }

    const published = courses.filter((c) => c.status === "published").length
    const draft = courses.filter((c) => c.status === "draft").length
    const totalLessons = courses.reduce((a, c) => a + (c.lesson_count ?? 0), 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Academia</h1>
                    <p className="text-sm text-muted-foreground">
                        {community ? `Cursos de ${community.nombre}` : "Gestiona los cursos de tu comunidad"}
                    </p>
                </div>
                <button onClick={() => setShowCreateDialog(true)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                    <Plus className="h-4 w-4" /> Crear curso
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/30 bg-card/40 p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{courses.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Total cursos</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-center">
                    <p className="text-2xl font-black text-emerald-400">{published}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Publicados</p>
                </div>
                <div className="rounded-xl border border-border/30 bg-card/40 p-4 text-center">
                    <p className="text-2xl font-black text-foreground">{totalLessons}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Lecciones</p>
                </div>
            </div>

            {/* Course list */}
            {loadingCourses ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
            ) : courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/20 py-20 text-center">
                    <GraduationCap className="h-14 w-14 text-muted-foreground/15 mb-4" />
                    <p className="text-base font-bold text-foreground">Tu academia está vacía</p>
                    <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                        Crea tu primer curso y empieza a organizar el contenido para tu comunidad.
                    </p>
                    <button onClick={() => setShowCreateDialog(true)}
                        className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                        <Plus className="h-4 w-4" /> Crear primer curso
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <div key={course.id} className="group overflow-hidden rounded-2xl border border-border/30 bg-card/40 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                            {/* Thumbnail */}
                            <div className="relative aspect-video overflow-hidden bg-secondary/30">
                                {course.thumbnail_url ? (
                                    <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <GraduationCap className="h-10 w-10 text-muted-foreground/20" />
                                    </div>
                                )}
                                {/* Status badge */}
                                <div className={cn("absolute top-2 right-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                                    course.status === "published" ? "bg-emerald-500/90 text-white" : "bg-black/60 text-white/70")}>
                                    {course.status === "published" ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                                    {course.status === "published" ? "Publicado" : "Borrador"}
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground line-clamp-2">{course.title}</h3>
                                    {course.description && (
                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{course.module_count ?? 0} módulos</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.lesson_count ?? 0} lecciones</span>
                                    <span>·</span>
                                    <span className={cn("rounded-full border px-1.5 py-0.5 font-semibold",
                                        LEVELS.find((l) => l.value === course.level)?.color)}>
                                        {LEVELS.find((l) => l.value === course.level)?.label}
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => { setSelectedCourse(course); setView("editor") }}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                                        <Pencil className="h-3.5 w-3.5" /> Editar contenido
                                    </button>
                                    <button onClick={() => handleToggleStatus(course)}
                                        className={cn("px-3 py-2 rounded-xl text-xs font-semibold border transition-colors",
                                            course.status === "published"
                                                ? "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20")}>
                                        {course.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                    <button onClick={() => handleDeleteCourse(course.id)}
                                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-transparent text-muted-foreground hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreateDialog && (
                <CreateCourseDialog
                    communityId={community?.id || null}
                    onCreated={(course) => {
                        setCourses((prev) => [course, ...prev])
                        setShowCreateDialog(false)
                        setSelectedCourse(course)
                        setView("editor")
                    }}
                    onClose={() => setShowCreateDialog(false)}
                />
            )}
        </div>
    )
}
