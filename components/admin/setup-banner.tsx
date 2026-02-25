"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Loader2, CheckCircle2, AlertTriangle, Copy, ChevronDown, ChevronUp } from "lucide-react"

const SETUP_SQL = `CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text DEFAULT '',
  whatsapp text DEFAULT '',
  fuente text DEFAULT 'Organico',
  fecha_ingreso timestamptz DEFAULT now(),
  etapa text DEFAULT 'lead_nuevo',
  video_visto_pct integer DEFAULT 0,
  llamada_contestada boolean DEFAULT false,
  quiz_completado boolean DEFAULT false,
  respuestas_quiz text[] DEFAULT '{}',
  terminal_completado boolean DEFAULT false,
  whatsapp_leido boolean DEFAULT false,
  login_completado boolean DEFAULT false,
  feed_visto boolean DEFAULT false,
  sales_page_vista boolean DEFAULT false,
  cta_clicked boolean DEFAULT false,
  etapa_maxima_alcanzada integer DEFAULT 0,
  tiempo_total_segundos integer DEFAULT 0,
  ultimo_evento timestamptz DEFAULT now(),
  asignado_a text DEFAULT 'Sin asignar'
);

CREATE TABLE IF NOT EXISTS notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  texto text NOT NULL,
  autor text DEFAULT 'Sistema',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eventos_actividad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descripcion text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON leads(fuente);
CREATE INDEX IF NOT EXISTS idx_leads_fecha ON leads(fecha_ingreso DESC);
CREATE INDEX IF NOT EXISTS idx_notas_lead_id ON notas(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_lead_id ON eventos_actividad(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_created ON eventos_actividad(created_at DESC);`

type SetupStatus = "checking" | "needs_setup" | "running" | "done" | "error" | "no_supabase"

export function SetupBanner({ onComplete }: { onComplete?: () => void }) {
  const [status, setStatus] = useState<SetupStatus>("needs_setup")
  const [error, setError] = useState("")
  const [sqlVisible, setSqlVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  async function runSetup(withSeed: boolean) {
    setStatus("running")
    setError("")

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: withSeed }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        // If auto-setup failed, show the SQL for manual setup
        if (data.sql) {
          setError("No se pudieron crear las tablas automaticamente. Usa el SQL de abajo en el editor de Supabase.")
          setSqlVisible(true)
          setStatus("error")
        } else {
          setError(data.error || "Error desconocido durante el setup")
          setStatus("error")
        }
        return
      }

      setStatus("done")
      setTimeout(() => {
        onComplete?.()
      }, 1500)
    } catch {
      setError("No se pudo conectar al servidor. Verifica que Supabase este configurado.")
      setStatus("no_supabase")
    }
  }

  function copySQL() {
    navigator.clipboard.writeText(SETUP_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === "done") {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-3 p-6">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
          <div>
            <h3 className="font-semibold text-foreground">Base de datos configurada</h3>
            <p className="text-sm text-muted-foreground">
              Todo listo. Cargando el dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          {status === "error" || status === "no_supabase" ? (
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
          ) : (
            <Database className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          )}
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-foreground">Configurar base de datos</h3>
            <p className="text-sm text-muted-foreground">
              {status === "no_supabase"
                ? "No se detecto la integracion de Supabase. Conectala desde el panel lateral de v0 (seccion Connect) y luego recarga."
                : status === "error"
                  ? error
                  : "La base de datos necesita las tablas del CRM. Puedes crearlas automaticamente o copiar el SQL para ejecutarlo manualmente."}
            </p>
          </div>
        </div>

        {(status === "needs_setup" || status === "error") && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runSetup(true)} disabled={status === "running"}>
                {status === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  "Crear tablas + datos de ejemplo"
                )}
              </Button>
              <Button variant="outline" onClick={() => runSetup(false)} disabled={status === "running"}>
                Solo crear tablas (sin datos)
              </Button>
            </div>

            <div className="border-t border-border/50 pt-3">
              <button
                onClick={() => setSqlVisible(!sqlVisible)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {sqlVisible ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Opcion manual: copiar SQL
              </button>

              {sqlVisible && (
                <div className="mt-2 relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-2 h-7 text-xs"
                    onClick={copySQL}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                  <pre className="overflow-x-auto rounded-md bg-muted/50 p-4 text-xs text-muted-foreground max-h-[300px] overflow-y-auto">
                    {SETUP_SQL}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}

        {status === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creando tablas y datos de ejemplo...
          </div>
        )}

        {status === "no_supabase" && (
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recargar pagina
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
