-- =============================================
-- Migration 023: 2FA for admin accounts
-- =============================================

CREATE TABLE IF NOT EXISTS public.admin_2fa (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL UNIQUE,            -- matches community_members.member_id
  totp_secret   TEXT NOT NULL,                   -- Base32 TOTP secret (ENCRYPTED at rest via pgcrypto ideally)
  backup_codes  TEXT[] NOT NULL DEFAULT '{}',    -- hashed backup codes
  enabled       BOOLEAN NOT NULL DEFAULT false,  -- false until first verification
  verified_at   TIMESTAMP WITH TIME ZONE,        -- when the user first verified the setup
  last_used_at  TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_2fa_user ON public.admin_2fa (user_id);

-- RLS: fully blocked from public access
ALTER TABLE public.admin_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_2fa_no_public_select"
  ON public.admin_2fa FOR SELECT USING (false);

CREATE POLICY "admin_2fa_no_public_insert"
  ON public.admin_2fa FOR INSERT WITH CHECK (false);

CREATE POLICY "admin_2fa_no_public_update"
  ON public.admin_2fa FOR UPDATE USING (false);

CREATE POLICY "admin_2fa_no_public_delete"
  ON public.admin_2fa FOR DELETE USING (false);

-- ──────────────────────────────────────────────────────────────────────────────
-- Track 2FA challenge state (pending verification before session upgrade)
-- Short-lived (expiry enforced in app layer)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_2fa_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  -- Temporary token returned to the client after password auth
  challenge_token TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  used          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_2fa_challenges_token   ON public.admin_2fa_challenges (challenge_token) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_2fa_challenges_user    ON public.admin_2fa_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_challenges_expiry  ON public.admin_2fa_challenges (expires_at);

-- Cleanup old challenges (optional: run periodically)
-- DELETE FROM admin_2fa_challenges WHERE expires_at < now() - interval '1 day';

ALTER TABLE public.admin_2fa_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_2fa_challenges_no_public"
  ON public.admin_2fa_challenges FOR ALL USING (false);
