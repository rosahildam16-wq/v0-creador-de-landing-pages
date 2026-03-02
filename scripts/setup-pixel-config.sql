-- Meta Pixel Configuration Table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pixel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embudo_id TEXT NOT NULL UNIQUE DEFAULT 'global',
  pixel_id TEXT NOT NULL DEFAULT '',
  pixel_token TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pixel_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pixel" ON pixel_config FOR ALL USING (true) WITH CHECK (true);
