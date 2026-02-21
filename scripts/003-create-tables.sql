-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
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
  whatsapp_final_leido boolean DEFAULT false,
  sales_page_vista boolean DEFAULT false,
  cta_clicked boolean DEFAULT false,
  etapa_maxima_alcanzada integer DEFAULT 0,
  tiempo_total_segundos integer DEFAULT 0,
  ultimo_evento timestamptz DEFAULT now(),
  asignado_a text DEFAULT 'Sin asignar'
);

-- Create notas table
CREATE TABLE IF NOT EXISTS notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  texto text NOT NULL,
  autor text DEFAULT 'Sistema',
  created_at timestamptz DEFAULT now()
);

-- Create eventos_actividad table
CREATE TABLE IF NOT EXISTS eventos_actividad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descripcion text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON leads(fuente);
CREATE INDEX IF NOT EXISTS idx_leads_fecha ON leads(fecha_ingreso DESC);
CREATE INDEX IF NOT EXISTS idx_notas_lead_id ON notas(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_lead_id ON eventos_actividad(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_created ON eventos_actividad(created_at DESC);
