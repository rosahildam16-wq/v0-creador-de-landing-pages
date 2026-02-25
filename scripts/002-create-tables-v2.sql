-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  fuente TEXT DEFAULT 'Organico',
  fecha_ingreso TIMESTAMPTZ DEFAULT now(),
  etapa TEXT DEFAULT 'lead_nuevo',
  video_visto_pct INTEGER DEFAULT 0,
  llamada_contestada BOOLEAN DEFAULT false,
  quiz_completado BOOLEAN DEFAULT false,
  respuestas_quiz TEXT[] DEFAULT ARRAY[]::TEXT[],
  terminal_completado BOOLEAN DEFAULT false,
  whatsapp_leido BOOLEAN DEFAULT false,
  login_completado BOOLEAN DEFAULT false,
  feed_visto BOOLEAN DEFAULT false,
  whatsapp_final_leido BOOLEAN DEFAULT false,
  sales_page_vista BOOLEAN DEFAULT false,
  cta_clicked BOOLEAN DEFAULT false,
  etapa_maxima_alcanzada INTEGER DEFAULT 0,
  tiempo_total_segundos INTEGER DEFAULT 0,
  ultimo_evento TIMESTAMPTZ DEFAULT now(),
  asignado_a TEXT DEFAULT 'Sin asignar',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create notas table
CREATE TABLE IF NOT EXISTS notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  autor TEXT DEFAULT 'Sistema',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create eventos_actividad table
CREATE TABLE IF NOT EXISTS eventos_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
