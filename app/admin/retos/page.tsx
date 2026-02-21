"use client"

import { useState, useEffect } from "react"
import { Trophy, Plus, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Challenge } from "@/lib/challenges-data"
import { DEFAULT_CHALLENGES, getRanking, METRICA_LABELS } from "@/lib/challenges-data"
import { ChallengeCard } from "@/components/admin/challenge-card"
import { ChallengeFormDialog } from "@/components/admin/challenge-form-dialog"

// Safe storage helpers
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* noop */ }
  try { sessionStorage.setItem(key, value) } catch { /* noop */ }
}

export default function RetosPage() {
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)
  const [formOpen, setFormOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [viewingRanking, setViewingRanking] = useState<Challenge | null>(null)

  // Load from storage on mount
  useEffect(() => {
    const stored = safeGet("mf_challenges")
    if (stored) {
      try {
        setChallenges(JSON.parse(stored))
      } catch { /* use defaults */ }
    }
  }, [])

  // Persist to storage on change
  const persist = (updated: Challenge[]) => {
    setChallenges(updated)
    safeSet("mf_challenges", JSON.stringify(updated))
  }

  const handleSave = (challenge: Challenge) => {
    const existing = challenges.find((c) => c.id === challenge.id)
    if (existing) {
      persist(challenges.map((c) => (c.id === challenge.id ? challenge : c)))
    } else {
      persist([...challenges, challenge])
    }
    setEditingChallenge(null)
  }

  const handleToggleActive = (id: string) => {
    persist(challenges.map((c) => (c.id === id ? { ...c, activo: !c.activo } : c)))
  }

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge)
    setFormOpen(true)
  }

  const handleNewChallenge = () => {
    setEditingChallenge(null)
    setFormOpen(true)
  }

  const activos = challenges.filter((c) => c.activo)
  const inactivos = challenges.filter((c) => !c.activo)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Retos y Concursos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los retos de tu equipo para motivar la prospeccion
          </p>
        </div>
        <button
          onClick={handleNewChallenge}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo reto
        </button>
      </div>

      {/* Active challenges */}
      {activos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-primary" />
            Retos activos ({activos.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activos.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                onViewRanking={setViewingRanking}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inactive challenges */}
      {inactivos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Retos inactivos ({inactivos.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {inactivos.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                onViewRanking={setViewingRanking}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {challenges.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-4 rounded-xl py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-foreground">No hay retos creados</h3>
            <p className="text-sm text-muted-foreground">Crea tu primer reto para motivar a tu equipo</p>
          </div>
          <button
            onClick={handleNewChallenge}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear primer reto
          </button>
        </div>
      )}

      {/* Ranking modal */}
      {viewingRanking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingRanking(null)} />
          <div className="glass-card relative z-10 w-full max-w-md rounded-xl p-6 mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Ranking: {viewingRanking.titulo}</h2>
              </div>
              <button
                onClick={() => setViewingRanking(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Cerrar ranking"
              >
                <span className="sr-only">Cerrar</span>
                &times;
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Ordenado por: {METRICA_LABELS[viewingRanking.metrica]}
            </p>
            <div className="flex flex-col gap-2">
              {getRanking(viewingRanking).map((r) => (
                <div
                  key={r.member.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    r.posicion <= 3 ? "bg-primary/5 border border-primary/10" : "bg-secondary/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      r.posicion === 1 && "bg-amber-500/20 text-amber-400",
                      r.posicion === 2 && "bg-slate-400/20 text-slate-300",
                      r.posicion === 3 && "bg-orange-500/20 text-orange-400",
                      r.posicion > 3 && "bg-secondary text-muted-foreground"
                    )}
                  >
                    {r.posicion}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {r.member.avatar_initials}
                  </span>
                  <span className="flex-1 text-sm text-foreground">{r.member.nombre}</span>
                  <span className="text-sm font-semibold text-foreground">{r.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form dialog */}
      <ChallengeFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingChallenge(null)
        }}
        onSave={handleSave}
        challenge={editingChallenge}
      />
    </div>
  )
}
