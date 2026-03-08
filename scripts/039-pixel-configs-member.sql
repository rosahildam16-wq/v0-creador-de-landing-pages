-- Migration 039: Create pixel_configs table with per-member, per-funnel pixel support
--
-- Replaces the old pixel_config (singular) table which lacked member_id.
-- New schema supports:
--   - Admin-level pixels:  (embudo_id, member_id = 'admin')
--   - Member-level pixels: (embudo_id, member_id = 'username')
--   - Global fallback:     (embudo_id = 'global', member_id = 'admin')
--
-- Priority chain (enforced in /api/pixel/config):
--   member's own pixel → admin pixel for funnel → global admin pixel → env var
--
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS pixel_configs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  embudo_id   TEXT        NOT NULL DEFAULT 'global',
  member_id   TEXT        NOT NULL DEFAULT 'admin',
  pixel_id    TEXT        NOT NULL,
  pixel_token TEXT        NOT NULL DEFAULT '',
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pixel_configs_unique UNIQUE (embudo_id, member_id)
);

-- Index for common lookup pattern
CREATE INDEX IF NOT EXISTS pixel_configs_embudo_member_idx
  ON pixel_configs (embudo_id, member_id);

-- RLS: only service_role (admin client) can access this table
ALTER TABLE pixel_configs ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (it already does, but explicit for clarity)
-- The API exclusively uses createAdminClient() which uses service_role key
-- No public/anon access needed

-- If migrating from old pixel_config (singular) table, copy existing admin rows:
-- INSERT INTO pixel_configs (embudo_id, member_id, pixel_id, pixel_token, enabled, created_at, updated_at)
-- SELECT embudo_id, 'admin', pixel_id, COALESCE(access_token, ''), enabled, created_at, updated_at
-- FROM pixel_config
-- ON CONFLICT (embudo_id, member_id) DO NOTHING;
