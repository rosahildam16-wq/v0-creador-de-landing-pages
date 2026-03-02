-- ============================================================
-- EMAIL SEQUENCES SYSTEM - Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add tags column to leads table (if not exists)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Email Sequences (the automation templates)
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  -- 'manual' | 'funnel_entry' | 'tag_added' | 'lead_created' | 'form_submit'
  trigger_value TEXT DEFAULT '',
  -- For funnel_entry: funnel ID; for tag_added: tag name
  estado TEXT NOT NULL DEFAULT 'borrador',
  -- 'borrador' | 'activa' | 'pausada'
  community_id TEXT DEFAULT 'general',
  autor_id TEXT DEFAULT '',
  autor_role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sequence Steps (individual emails in a sequence)
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  asunto TEXT NOT NULL DEFAULT '',
  contenido_html TEXT DEFAULT '',
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT DEFAULT 'none',
  -- 'none' | 'opened_previous' | 'clicked_previous' | 'has_tag'
  condition_value TEXT DEFAULT '',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sequence Enrollments (leads enrolled in sequences)
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  lead_nombre TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'activo',
  -- 'activo' | 'completado' | 'cancelado' | 'pausado'
  current_step INTEGER NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate enrollments
  UNIQUE(sequence_id, lead_id)
);

-- 5. Sequence Email Logs (tracking sent emails)
CREATE TABLE IF NOT EXISTS sequence_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_index INTEGER DEFAULT 0,
  lead_email TEXT NOT NULL,
  asunto TEXT DEFAULT '',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_email_seq_trigger ON email_sequences(trigger_type, trigger_value, estado);
CREATE INDEX IF NOT EXISTS idx_email_seq_community ON email_sequences(community_id);
CREATE INDEX IF NOT EXISTS idx_seq_steps_sequence ON email_sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON sequence_enrollments(estado, next_send_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead ON sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

-- ============================================================
-- RLS Policies (adjust as needed)
-- ============================================================
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_email_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_all_email_sequences" ON email_sequences FOR ALL USING (true);
CREATE POLICY "service_all_sequence_steps" ON email_sequence_steps FOR ALL USING (true);
CREATE POLICY "service_all_enrollments" ON sequence_enrollments FOR ALL USING (true);
CREATE POLICY "service_all_logs" ON sequence_email_logs FOR ALL USING (true);
