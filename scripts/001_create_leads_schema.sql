-- CRM Leads Schema for Supabase
-- This creates the leads table, notes table, and activity events table.

-- =============================================
-- LEADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  fuente TEXT NOT NULL DEFAULT 'Organico',
  fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
  etapa TEXT NOT NULL DEFAULT 'lead_nuevo',
  -- Funnel behavior
  video_visto_pct INTEGER NOT NULL DEFAULT 0,
  llamada_contestada BOOLEAN NOT NULL DEFAULT false,
  quiz_completado BOOLEAN NOT NULL DEFAULT false,
  respuestas_quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
  terminal_completado BOOLEAN NOT NULL DEFAULT false,
  whatsapp_leido BOOLEAN NOT NULL DEFAULT false,
  login_completado BOOLEAN NOT NULL DEFAULT false,
  feed_visto BOOLEAN NOT NULL DEFAULT false,
  whatsapp_final_leido BOOLEAN NOT NULL DEFAULT false,
  sales_page_vista BOOLEAN NOT NULL DEFAULT false,
  cta_clicked BOOLEAN NOT NULL DEFAULT false,
  etapa_maxima_alcanzada INTEGER NOT NULL DEFAULT 0,
  tiempo_total_segundos INTEGER NOT NULL DEFAULT 0,
  ultimo_evento TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- CRM
  asignado_a TEXT NOT NULL DEFAULT 'Sin asignar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON public.leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON public.leads(fuente);
CREATE INDEX IF NOT EXISTS idx_leads_fecha_ingreso ON public.leads(fecha_ingreso DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- =============================================
-- NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  autor TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_lead_id ON public.notas(lead_id);

-- =============================================
-- ACTIVITY EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.eventos_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_lead_id ON public.eventos_actividad(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON public.eventos_actividad(created_at DESC);

-- =============================================
-- RLS POLICIES (permissive for now - service role used in API)
-- =============================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_actividad ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (anon key used by the admin dashboard)
-- When auth is added, tighten these to auth.uid() checks
CREATE POLICY "leads_allow_all" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notas_allow_all" ON public.notas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "eventos_allow_all" ON public.eventos_actividad FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- AUTO-UPDATE updated_at ON LEADS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
