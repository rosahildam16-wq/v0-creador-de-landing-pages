import { isLessonCompleted, toggleLessonCompletion } from "@/lib/academy-progress"
import { useAuth } from "@/lib/auth-context"

export default function MemberCourseDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { user } = useAuth()
  const course = getCourseById(id)
  const [expandedModules, setExpandedModules] = useState<string[]>(course?.modulos[0]?.id ? [course.modulos[0].id] : [])
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    course?.modulos[0]?.lecciones[0]?.id ?? null
  )
  const [refresh, setRefresh] = useState(0)

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

  const handleToggleComplete = (lessonId: string) => {
    if (!user?.memberId) return
    toggleLessonCompletion(lessonId, user.memberId)
    setRefresh(prev => prev + 1)
  }

  // Find current selected lesson details
  let currentLesson = null
  for (const mod of course.modulos) {
    const found = mod.lecciones.find((l) => l.id === selectedLessonId)
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
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border/30 bg-black shadow-2xl">
        <Image
          src={course.thumbnail}
          alt={currentLesson?.titulo ?? course.titulo}
          fill
          className="object-cover opacity-40 blur-[2px]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <button className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/95 text-primary-foreground shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:scale-110 hover:shadow-[0_0_60px_rgba(139,92,246,0.5)]">
            <Play className="h-9 w-9 ml-1" />
            <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40 opacity-20" />
          </button>
          <div className="text-center px-4">
            <h3 className="text-lg font-bold text-white mb-1">
              {currentLesson?.titulo ?? "Selecciona una leccion"}
            </h3>
            <p className="text-xs text-white/60">Modulo: {course.modulos.find(m => m.lecciones.some(l => l.id === selectedLessonId))?.titulo}</p>
          </div>
        </div>

        {/* Floating progress bar in player */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: currentLesson && isLessonCompleted(currentLesson.id) ? '100%' : '0%' }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentLesson && (
            <button
              onClick={() => handleToggleComplete(currentLesson.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95",
                isLessonCompleted(currentLesson.id)
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              )}
            >
              {isLessonCompleted(currentLesson.id) ? (
                <CheckCircle2 className="h-4.5 w-4.5" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isLessonCompleted(currentLesson.id) ? "Leccion completada" : "Marcar como terminado"}
            </button>
          )}
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
              <div key={modulo.id} className="overflow-hidden rounded-xl border border-border/30 bg-card/40">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(modulo.id)}
                  className="flex w-full items-center justify-between bg-secondary/20 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
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
                      const isActive = selectedLessonId === leccion.id
                      const isCompleted = isLessonCompleted(leccion.id)

                      return (
                        <button
                          key={leccion.id}
                          onClick={() => setSelectedLessonId(leccion.id)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-left transition-all border-t border-border/10",
                            isActive
                              ? "bg-primary/[0.08] shadow-[inset_4px_0_0_hsl(var(--primary))]"
                              : "hover:bg-secondary/20"
                          )}
                        >
                          {/* Lesson number / status */}
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

                          {/* Lesson info */}
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className={cn(
                              "truncate text-xs transition-colors",
                              isActive ? "font-bold text-foreground" : "text-foreground/80",
                              isCompleted && !isActive && "text-muted-foreground/70"
                            )}>
                              {leccion.titulo}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-muted-foreground/50 font-mono">
                                {leccion.duracion}
                              </span>
                              {isCompleted && (
                                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Completada</span>
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
        </div>
      </div>
    </div>
  )
}
