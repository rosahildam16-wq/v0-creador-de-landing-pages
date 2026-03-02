
-- 016_create_email_campaigns.sql
-- Script para crear la tabla de campañas de email marketing

CREATE TABLE IF NOT EXISTS public.campanas_email (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    asunto TEXT NOT NULL,
    contenido_html TEXT NOT NULL,
    audiencia TEXT NOT NULL,
    audience_filters JSONB DEFAULT '{}'::jsonb,
    community_id TEXT,
    programado_para TIMESTAMP WITH TIME ZONE,
    enviado_en TIMESTAMP WITH TIME ZONE,
    estado TEXT NOT NULL DEFAULT 'borrador',
    autor_id TEXT,
    autor_role TEXT,
    leads_alcanzados INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.campanas_email ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso básicas (ajustar según necesidad)
DROP POLICY IF EXISTS "campanas_select_all" ON public.campanas_email;
CREATE POLICY "campanas_select_all" ON public.campanas_email FOR SELECT USING (true);

DROP POLICY IF EXISTS "campanas_insert_all" ON public.campanas_email;
CREATE POLICY "campanas_insert_all" ON public.campanas_email FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "campanas_update_all" ON public.campanas_email;
CREATE POLICY "campanas_update_all" ON public.campanas_email FOR UPDATE USING (true);

-- Agregar columna mailing_enabled a communities si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='mailing_enabled') THEN
        ALTER TABLE public.communities ADD COLUMN mailing_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;
