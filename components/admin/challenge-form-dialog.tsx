"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Challenge, Premio } from "@/lib/challenges-data"
import { TIPO_LABELS, METRICA_LABELS } from "@/lib/challenges-data"

interface ChallengeFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (challenge: Challenge) => void
  challenge?: Challenge | null
}

const TIPO_OPTIONS = Object.entries(TIPO_LABELS) as [Challenge["tipo"], string][]
const METRICA_OPTIONS = Object.entries(METRICA_LABELS) as [Challenge["metrica"], string][]

function generateId(): string {
  return `reto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function ChallengeFormDialog({ open, onClose, onSave, challenge }: ChallengeFormDialogProps) {
  const isEditing = !!challenge

  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState<Challenge["tipo"]>("cantidad")
  const [metrica, setMetrica] = useState<Challenge["metrica"]>("leads")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [activo, setActivo] = useState(true)
  const [premios, setPremios] = useState<Premio[]>([
    { puesto: 1, monto: 100, moneda: "USD" },
    { puesto: 2, monto: 50, moneda: "USD" },
    { puesto: 3, monto: 25, moneda: "USD" },
  ])

  useEffect(() => {
    if (challenge) {
      setTitulo(challenge.titulo)
      setTipo(challenge.tipo)
      setMetrica(challenge.metrica)
      setFechaInicio(challenge.fecha_inicio)
      setFechaFin(challenge.fecha_fin)
      setActivo(challenge.activo)
      setPremios([...challenge.premios])
    } else {
      setTitulo("")
      setTipo("cantidad")
      setMetrica("leads")
      setFechaInicio("")
      setFechaFin("")
      setActivo(true)
      setPremios([
        { puesto: 1, monto: 100, moneda: "USD" },
        { puesto: 2, monto: 50, moneda: "USD" },
        { puesto: 3, monto: 25, moneda: "USD" },
      ])
    }
  }, [challenge, open])

  const handleAddPremio = () => {
    const nextPuesto = premios.length + 1
    setPremios([...premios, { puesto: nextPuesto, monto: 0, moneda: "USD" }])
  }

  const handleRemovePremio = (index: number) => {
    const updated = premios.filter((_, i) => i !== index).map((p, i) => ({ ...p, puesto: i + 1 }))
    setPremios(updated)
  }

  const handlePremioMontoChange = (index: number, monto: number) => {
    const updated = [...premios]
    updated[index] = { ...updated[index], monto }
    setPremios(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Challenge = {
      id: challenge?.id || generateId(),
      titulo: titulo.toUpperCase(),
      tipo,
      metrica,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      activo,
      premios,
    }
    onSave(data)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card relative z-10 w-full max-w-lg rounded-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">
            {isEditing ? "Editar reto" : "Crear nuevo reto"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Titulo */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="challenge-title" className="text-xs font-medium text-muted-foreground">Titulo del reto</label>
            <input
              id="challenge-title"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: TOP PROSPECTADOR"
              required
              className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Tipo y Metrica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="challenge-tipo" className="text-xs font-medium text-muted-foreground">Tipo de reto</label>
              <select
                id="challenge-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Challenge["tipo"])}
                className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TIPO_OPTIONS.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="challenge-metrica" className="text-xs font-medium text-muted-foreground">Metrica a rankear</label>
              <select
                id="challenge-metrica"
                value={metrica}
                onChange={(e) => setMetrica(e.target.value as Challenge["metrica"])}
                className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {METRICA_OPTIONS.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="challenge-start" className="text-xs font-medium text-muted-foreground">Fecha inicio</label>
              <input
                id="challenge-start"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
                className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="challenge-end" className="text-xs font-medium text-muted-foreground">Fecha fin</label>
              <input
                id="challenge-end"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
                className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Activo toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={activo}
              onClick={() => setActivo(!activo)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                activo ? "bg-primary" : "bg-secondary"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 rounded-full bg-primary-foreground transition-transform",
                  activo ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <span className="text-sm text-foreground">{activo ? "Activo" : "Inactivo"}</span>
          </div>

          {/* Premios */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Premios</span>
              <button
                type="button"
                onClick={handleAddPremio}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {premios.map((premio, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">
                    {premio.puesto === 1 ? "1er lugar" : premio.puesto === 2 ? "2do lugar" : `${premio.puesto}to lugar`}
                  </span>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      min={0}
                      value={premio.monto}
                      onChange={(e) => handlePremioMontoChange(i, Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-secondary/50 px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      aria-label={`Monto del ${premio.puesto}${premio.puesto === 1 ? "er" : "do"} lugar`}
                    />
                    <span className="text-xs text-muted-foreground">USD</span>
                  </div>
                  {premios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePremio(i)}
                      className="rounded-lg p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`Eliminar premio del puesto ${premio.puesto}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isEditing ? "Guardar cambios" : "Crear reto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
