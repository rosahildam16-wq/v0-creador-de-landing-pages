-- Migration 040: Add plan_code column to community_members
--
-- Adds a plan_code column to community_members so that:
--   1. Plan can be set directly on the user row (admin override)
--   2. Login route uses community_members.plan_code first, then falls back to subscriptions
--   3. /api/auth/me syncs plan_code from DB on every session check
--   4. SuperAdmin can upgrade/downgrade plans without requiring re-login
--
-- Valid values: '27' | '47' | '97' | '300'
-- Default: '27' (Starter)
--
-- Run this in the Supabase SQL Editor.

-- 1. Add column with constraint
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS plan_code TEXT DEFAULT '27'
  CHECK (plan_code IN ('27', '47', '97', '300'));

-- 2. Index for lookups in /api/auth/me
CREATE INDEX IF NOT EXISTS community_members_plan_code_idx
  ON community_members (plan_code);

-- 3. (Optional) Seed: if user "sensei" exists as a DB row, set plan 97
-- UPDATE community_members SET plan_code = '97'
-- WHERE username = 'sensei' OR member_id = 'sensei';

-- 4. (Optional) Migrate existing subscriptions to plan_code
-- This sets plan_code based on the most recent active subscription for each user.
-- Uncomment and run if you want to migrate existing subscription data:
--
-- UPDATE community_members cm
-- SET plan_code = COALESCE(
--   (
--     SELECT
--       CASE s.plan_id
--         WHEN '97'      THEN '97'
--         WHEN 'elite'   THEN '97'
--         WHEN 'plan_97' THEN '97'
--         WHEN '47'      THEN '47'
--         WHEN 'pro'     THEN '47'
--         WHEN 'plan_47' THEN '47'
--         ELSE '27'
--       END
--     FROM subscriptions s
--     WHERE s.user_email = cm.email
--       AND s.status IN ('trial', 'active')
--     ORDER BY s.created_at DESC
--     LIMIT 1
--   ),
--   '27'
-- );
