-- Create tables for CRM Lead Management System

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  fuente TEXT DEFAULT 'Organico' CHECK (fuente IN ('Meta Ads', 'Instagram', 'TikTok', 'Google', 'Organico')),
  fecha_ingreso TIMESTAMPTZ DEFAULT now(),
  etapa TEXT DEFAULT 'lead_nuevo' CHECK (etapa IN ('lead_nuevo', 'contactado', 'llamada_agendada', 'no_respondio', 'presentado', 'cerrado', 'perdido')),
  video_visto_pct INTEGER DEFAULT 0,
  llamada_contestada BOOLEAN DEFAULT false,
  quiz_completado BOOLEAN DEFAULT false,
  respuestas_quiz TEXT[] DEFAULT '{}',
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

-- Notas table
CREATE TABLE IF NOT EXISTS notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  autor TEXT DEFAULT 'Sistema',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eventos de actividad table
CREATE TABLE IF NOT EXISTS eventos_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_fecha_ingreso ON leads(fecha_ingreso DESC);
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON leads(fuente);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_notas_lead_id ON notas(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_lead_id ON eventos_actividad(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON eventos_actividad(created_at DESC);
