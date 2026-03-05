-- =============================================
-- community_invites — invite-link system
-- Replaces DIAMANTECELION hard-coded code.
-- One row per shareable invite link.
-- =============================================

CREATE TABLE IF NOT EXISTS public.community_invites (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT        UNIQUE NOT NULL,
  community_id  TEXT        NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member',
  sponsor_username TEXT     NULL,
  max_uses      INT         NOT NULL DEFAULT 0,   -- 0 = unlimited
  uses          INT         NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NULL,
  created_by    TEXT        NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select_all"  ON public.community_invites FOR SELECT USING (true);
CREATE POLICY "invites_insert_admin" ON public.community_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "invites_update_admin" ON public.community_invites FOR UPDATE USING (true);
CREATE POLICY "invites_delete_admin" ON public.community_invites FOR DELETE USING (true);

-- ── Index for token lookup ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_community_invites_token ON public.community_invites(token);

-- ── Seed: create the Skalia VIP permanent invite for sensei ───────────────────
-- This replaces the hard-coded DIAMANTECELION code for new registrations.
-- The token is human-readable and can be used as a URL param: ?invite=skalia-sensei
INSERT INTO public.community_invites
  (token, community_id, role, sponsor_username, max_uses, created_by)
VALUES
  ('skalia-sensei', 'skalia-vip', 'member', 'sensei', 0, 'sensei')
ON CONFLICT (token) DO NOTHING;
