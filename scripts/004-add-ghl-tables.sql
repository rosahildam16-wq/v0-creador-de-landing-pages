-- =============================================================
-- Migration 004: Add GHL tracking columns and tables
-- =============================================================

-- 1. Add missing columns to leads table for GHL tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campana text DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS embudo_id text DEFAULT 'nomada-vip';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_embudo text DEFAULT 'cita';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_cita_enviado boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compra_completada boolean DEFAULT false;

-- 2. Create ghl_logs table for persisting GoHighLevel send logs
CREATE TABLE IF NOT EXISTS ghl_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embudo_id text NOT NULL DEFAULT '',
  embudo_nombre text,
  lead_email text NOT NULL,
  lead_nombre text NOT NULL,
  method text NOT NULL CHECK (method IN ('api', 'webhook')),
  action text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'rejected')),
  http_code integer,
  contact_id text,
  attempt integer DEFAULT 1,
  max_attempts integer DEFAULT 1,
  elapsed text,
  tag text DEFAULT '',
  payload_sent jsonb DEFAULT '{}',
  response_body text,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ghl_logs_embudo ON ghl_logs(embudo_id);
CREATE INDEX IF NOT EXISTS idx_ghl_logs_status ON ghl_logs(status);
CREATE INDEX IF NOT EXISTS idx_ghl_logs_created ON ghl_logs(created_at DESC);

-- 3. Create ghl_config table for persisting GHL configuration
CREATE TABLE IF NOT EXISTS ghl_config (
  id text PRIMARY KEY DEFAULT 'default',
  webhook_url text DEFAULT '',
  api_key text DEFAULT '',
  location_id text DEFAULT '',
  base_url text DEFAULT 'https://services.leadconnectorhq.com',
  api_version text DEFAULT '2021-07-28',
  default_source text DEFAULT 'magic-funnel',
  timeout_ms integer DEFAULT 10000,
  retry_count integer DEFAULT 2,
  updated_at timestamptz DEFAULT now()
);

-- Insert default config row if not exists
INSERT INTO ghl_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
