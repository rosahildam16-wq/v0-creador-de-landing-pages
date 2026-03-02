-- =============================================
-- Email Sequences / Automation Tables
-- =============================================

-- 1. Sequences (the automation workflow)
CREATE TABLE IF NOT EXISTS public.email_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    -- Trigger: what starts this sequence
    trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'funnel_entry', 'tag_added', 'manual', 'form_submit', 'lead_created'
    trigger_value TEXT DEFAULT '', -- funnel ID, tag name, etc.
    -- Status
    estado TEXT NOT NULL DEFAULT 'borrador', -- 'activa', 'pausada', 'borrador'
    -- Ownership
    community_id TEXT DEFAULT 'general',
    autor_id TEXT DEFAULT '',
    autor_role TEXT DEFAULT 'admin',
    -- Stats
    total_enrolled INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Sequence Steps (individual emails in the sequence)
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    step_order INT NOT NULL DEFAULT 0,
    -- Email content
    asunto TEXT NOT NULL DEFAULT '',
    contenido_html TEXT NOT NULL DEFAULT '',
    -- Timing
    delay_days INT NOT NULL DEFAULT 0,    -- Days after previous step (or enrollment)
    delay_hours INT NOT NULL DEFAULT 0,   -- Hours after previous step
    -- Conditions
    condition_type TEXT DEFAULT 'none', -- 'none', 'opened_previous', 'clicked_previous', 'has_tag'
    condition_value TEXT DEFAULT '',
    -- Status
    activo BOOLEAN DEFAULT true,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enrollments (tracks each person going through a sequence)
CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    lead_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    lead_nombre TEXT DEFAULT '',
    -- Progress
    current_step INT DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activa', -- 'activa', 'completada', 'pausada', 'cancelada'
    -- Timing
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    next_send_at TIMESTAMPTZ,
    last_sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    -- Prevent duplicates
    UNIQUE(sequence_id, lead_id)
);

-- 4. Tags for leads (for trigger_type = 'tag_added')
CREATE TABLE IF NOT EXISTS public.lead_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lead_id, tag)
);

-- RLS
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_email_sequences" ON public.email_sequences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_email_sequence_steps" ON public.email_sequence_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_email_sequence_enrollments" ON public.email_sequence_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lead_tags" ON public.lead_tags FOR ALL USING (true) WITH CHECK (true);

-- Index for fast enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_next_send ON public.email_sequence_enrollments(next_send_at) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_enrollments_sequence ON public.email_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_lead ON public.lead_tags(lead_id);

NOTIFY pgrst, 'reload schema';
