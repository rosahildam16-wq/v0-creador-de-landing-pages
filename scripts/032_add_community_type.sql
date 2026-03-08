-- ============================================================
-- Migration 032: Add community_type and trial_days to communities
-- ============================================================
-- community_type controls post-registration routing:
--   'team'         → redirect to /join/{slug}/plans (select a paid platform plan)
--   'student_paid' → redirect to /member (payment flow reserved for future)
--   'free'         → redirect to /member (no plan required)
--
-- trial_days overrides the platform default (7 days) per community.
-- skalia-vip gets 90 days; all others default to 7.
-- ============================================================

-- 1. Add community_type column (default 'team' for all existing communities)
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS community_type TEXT NOT NULL DEFAULT 'team'
  CHECK (community_type IN ('team', 'student_paid', 'free'));

-- 2. Add trial_days column as a convenience alias/override at community level
--    (complements free_trial_days and default_trial_days already on the table)
ALTER TABLE communities
  ADD COLUMN IF NOT EXISTS platform_trial_days INT NOT NULL DEFAULT 7;

-- 3. Set skalia-vip to 90-day platform trial
UPDATE communities
  SET platform_trial_days = 90
  WHERE id = 'skalia-vip';

-- 4. Helpful comment index (no functional index needed, community_type is low-cardinality)
COMMENT ON COLUMN communities.community_type IS
  'Controls post-registration routing: team → plan selection, student_paid → member (future payment), free → member directly';

COMMENT ON COLUMN communities.platform_trial_days IS
  'Days of free platform access after registration. Default 7, skalia-vip is 90.';
