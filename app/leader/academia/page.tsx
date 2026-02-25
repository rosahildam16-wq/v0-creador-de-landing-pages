"use client"

import { useState, useEffect } from "react"
import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Plus, Play, Trash2, Video } from "lucide-react"

interface AcademyVideo {
  id: string
  communityId: string
  titulo: string
  descripcion: string
  url: string
  categoria: string
  createdAt: string
}

function getVideos(communityId: string): AcademyVideo[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("mf_academy_videos") || "[]"
    return (JSON.parse(raw) as AcademyVideo[]).filter((v) => v.communityId === communityId)
  } catch { return [] }
}

function saveVideoLocal(video: AcademyVideo) {
  try {
    const raw = localStorage.getItem("mf_academy_videos") || "[]"
    const all = JSON.parse(raw) as AcademyVideo[]
    all.unshift(video)
    localStorage.setItem("mf_academy_videos", JSON.stringify(all))
  } catch { /* noop */ }
}

function deleteVideoLocal(id: string) {
  try {
    const raw = localStorage.getItem("mf_academy_videos") || "[]"
    const all = (JSON.parse(raw) as AcademyVideo[]).filter((v) => v.id !== id)
    localStorage.setItem("mf_academy_videos", JSON.stringify(all))
  } catch { /* noop */ }
}

export default function LeaderAcademiaPage() {
  const { community, loading } = useLeaderCommunity()
  const [videos, setVideos] = useState<AcademyVideo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [url, setUrl] = useState("")
  const [categoria, setCategoria] = useState("general")

  useEffect(() => {
    if (community?.id) setVideos(getVideos(community.id))
  }, [community?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const handleCreate = () => {
    if (!titulo.trim() || !url.trim() || !community) return
    const newVideo: AcademyVideo = {
      id: `vid-${Date.now()}`,
      communityId: community.id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      url: url.trim(),
      categoria,
      createdAt: new Date().toISOString(),
    }
    saveVideoLocal(newVideo)
    setVideos((prev) => [newVideo, ...prev])
    setTitulo("")
    setDescripcion("")
    setUrl("")
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    deleteVideoLocal(id)
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  const categorias = [...new Set(videos.map((v) => v.categoria))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academia</h1>
          <p className="text-sm text-muted-foreground">Configura los videos y cursos para tu equipo</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Agregar Video
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Titulo</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Titulo del video" className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descripcion</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="De que trata el video..." rows={2} className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none" />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">URL del Video (YouTube, Vimeo, etc)</label>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej: Ventas, Liderazgo..." className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Publicar Video</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {videos.length > 0 ? (
        <div className="space-y-6">
          {categorias.map((cat) => (
            <div key={cat}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {videos.filter((v) => v.categoria === cat).map((v) => (
                  <Card key={v.id} className="border-border/50 group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Play className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{v.titulo}</p>
                            {v.descripcion && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{v.descripcion}</p>}
                            <a href={v.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Video className="h-3 w-3" />
                              Ver video
                            </a>
                          </div>
                        </div>
                        <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/15" />
            <p className="mt-4 text-sm font-medium text-foreground">Crea tu academia de entrenamiento</p>
            <p className="mt-1.5 text-xs text-muted-foreground">Agrega videos de YouTube o Vimeo para capacitar a tu equipo.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
