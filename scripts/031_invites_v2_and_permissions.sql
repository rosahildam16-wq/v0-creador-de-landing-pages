-- =============================================
-- 031 — Invite system v2 + granular permissions
-- =============================================

-- ── 1. Add is_active to community_invites ────────────────────────────────────
ALTER TABLE public.community_invites
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_community_invites_active
  ON public.community_invites (community_id, is_active)
  WHERE is_active = true;

-- ── 2. Add slug to communities (so URLs are stable) ──────────────────────────
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slug from existing id for communities that don't have it
UPDATE public.communities
SET slug = id
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_slug
  ON public.communities (slug)
  WHERE slug IS NOT NULL;

-- ── 3. Granular permission: can_create_communities ────────────────────────────
-- Added to community_members so leaders can create communities without
-- being super_admin.  Members with active plan 47+ get this automatically.

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS can_create_communities BOOLEAN NOT NULL DEFAULT false;

-- Grant permission to existing leaders / owners immediately
UPDATE public.community_members
SET can_create_communities = true
WHERE role IN ('leader', 'owner');

-- ── 4. Ensure communities table has needed columns ────────────────────────────
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS default_trial_days INT DEFAULT 7,
  ADD COLUMN IF NOT EXISTS allow_trial BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS owner_username TEXT;

-- Backfill owner_username from existing data
UPDATE public.communities c
SET owner_username = cm.username
FROM public.community_members cm
WHERE cm.community_id = c.id
  AND cm.role IN ('leader', 'owner')
  AND c.owner_username IS NULL
LIMIT 1;

-- ── 5. Ensure community_invites has owner_username index ─────────────────────
CREATE INDEX IF NOT EXISTS idx_community_invites_sponsor
  ON public.community_invites (sponsor_username)
  WHERE sponsor_username IS NOT NULL;

-- ── 6. Helper view: active invites per member ────────────────────────────────
CREATE OR REPLACE VIEW public.member_invites_view AS
SELECT
  ci.id,
  ci.token,
  ci.community_id,
  c.nombre AS community_name,
  c.slug AS community_slug,
  ci.sponsor_username,
  ci.role,
  ci.max_uses,
  ci.uses,
  ci.expires_at,
  ci.is_active,
  ci.created_at
FROM public.community_invites ci
JOIN public.communities c ON c.id = ci.community_id
WHERE ci.is_active = true;

-- ── 7. Seed: activate existing skalia-sensei invite if deactivated ────────────
UPDATE public.community_invites
SET is_active = true
WHERE token = 'skalia-sensei';

-- ── 8. Update communities slug for known entries ──────────────────────────────
UPDATE public.communities SET slug = 'skalia-vip'  WHERE id = 'skalia-vip' AND slug IS NULL;
UPDATE public.communities SET slug = 'general'     WHERE id = 'general'    AND slug IS NULL;
