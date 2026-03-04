-- =============================================
-- Phase 2 Core: Communities + Plans + Referrals
-- + Trials + Commissions + Payouts
-- =============================================
-- Strategy:
--   • Never drop or rename existing columns.
--   • subscription_plans / subscriptions stay intact
--     (legacy users and existing logic keep working).
--   • New tables are net-new; old tables get additive ALTERs only.
--   • RLS on all new tables: public blocked, service role bypasses.
-- =============================================


-- ─────────────────────────────────────────────
-- PART 1 – Extend communities (additive only)
-- ─────────────────────────────────────────────

-- slug: URL-friendly identifier used in /c/{slug}
-- Defaults to the existing `id` (already kebab-case in real data).
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.communities
  SET slug = id
  WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_slug
  ON public.communities (slug);

-- allow_trial: enables trial window for new community memberships
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS allow_trial BOOLEAN NOT NULL DEFAULT true;

-- default_trial_days: overrides platform default (7) per community.
-- Note: free_trial_days (from migration 012) is kept for backward compat.
--       New code reads default_trial_days first, falls back to free_trial_days, then 7.
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS default_trial_days INTEGER NOT NULL DEFAULT 7;


-- ─────────────────────────────────────────────
-- PART 2 – community_plans
--   Monetization plans a community can offer its members.
--   Paying a community plan does NOT grant platform tools.
--   Platform tools depend exclusively on user_platform_subscription.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_plans (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  TEXT          NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name          TEXT          NOT NULL,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      TEXT          NOT NULL DEFAULT 'USD',
  interval      TEXT          NOT NULL DEFAULT 'monthly'
                  CHECK (interval IN ('weekly','monthly','quarterly','yearly','one_time')),
  trial_days    INTEGER       NOT NULL DEFAULT 7,
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_plans_community
  ON public.community_plans (community_id)
  WHERE is_active = true;

ALTER TABLE public.community_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_plans_no_public" ON public.community_plans
  FOR ALL USING (false) WITH CHECK (false);


-- ─────────────────────────────────────────────
-- PART 3 – community_memberships
--   Tracks a user's membership status to a specific community.
--   grace_until: 7-day grace window after past_due before → frozen.
--   UNIQUE (community_id, user_id): one membership row per user per community.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_memberships (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id         TEXT          NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id              TEXT          NOT NULL,  -- community_members.member_id
  plan_id              UUID          REFERENCES public.community_plans(id) ON DELETE SET NULL,
  status               TEXT          NOT NULL DEFAULT 'active'
                         CHECK (status IN ('trialing','active','past_due','frozen','canceled')),
  trial_start          TIMESTAMPTZ,
  trial_end            TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  grace_until          TIMESTAMPTZ,             -- past_due → frozen after this date
  created_at           TIMESTAMPTZ   DEFAULT now(),
  updated_at           TIMESTAMPTZ   DEFAULT now(),

  UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_memberships_user
  ON public.community_memberships (user_id);

CREATE INDEX IF NOT EXISTS idx_community_memberships_status
  ON public.community_memberships (status);

CREATE INDEX IF NOT EXISTS idx_community_memberships_trial_end
  ON public.community_memberships (trial_end)
  WHERE status = 'trialing';

ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_memberships_no_public" ON public.community_memberships
  FOR ALL USING (false) WITH CHECK (false);


-- ─────────────────────────────────────────────
-- PART 4 – platform_plans
--   Internal Magic Funnel plans. Separate from subscription_plans
--   (which stays untouched) to avoid breaking existing users.
--
--   limits (JSONB) documented keys:
--     funnels_max           INT   (-1 = unlimited, 0 = none)
--     communities_max       INT   (-1 = unlimited, 0 = none)
--     contacts_max          INT   (-1 = unlimited)
--     can_create_community  BOOL
--     can_create_funnel     BOOL
--     commission_cap_monthly  NUMERIC | null  (null = unlimited)
--     tools                 TEXT[]  slugs of enabled platform tools
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_plans (
  code        TEXT          PRIMARY KEY,
  name        TEXT          NOT NULL,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency    TEXT          NOT NULL DEFAULT 'USD',
  interval    TEXT          NOT NULL DEFAULT 'monthly',
  trial_days  INTEGER       NOT NULL DEFAULT 0,  -- 0 = no trial (student)
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  limits      JSONB         NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ   DEFAULT now()
);

ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;
-- Public can read active plans (needed for pricing / onboarding pages)
CREATE POLICY "platform_plans_public_read" ON public.platform_plans
  FOR SELECT USING (is_active = true);
-- All writes blocked from client; service role bypasses RLS
CREATE POLICY "platform_plans_no_public_write" ON public.platform_plans
  FOR INSERT WITH CHECK (false);

-- Seed: 5 internal plans
INSERT INTO public.platform_plans (code, name, price, interval, trial_days, limits)
VALUES
  ('student', 'Estudiante', 0.00, 'monthly', 0, '{
    "funnels_max": 0,
    "communities_max": 0,
    "contacts_max": 0,
    "can_create_community": false,
    "can_create_funnel": false,
    "commission_cap_monthly": null,
    "tools": ["community_content", "academy_videos", "resources"]
  }'::jsonb),

  ('plan_27', 'Member', 27.00, 'monthly', 7, '{
    "funnels_max": 0,
    "communities_max": 0,
    "contacts_max": 500,
    "can_create_community": false,
    "can_create_funnel": false,
    "commission_cap_monthly": null,
    "tools": ["community_content", "academy_videos", "resources", "crm_community"]
  }'::jsonb),

  ('plan_47', 'Creator', 47.00, 'monthly', 7, '{
    "funnels_max": 3,
    "communities_max": 3,
    "contacts_max": -1,
    "can_create_community": true,
    "can_create_funnel": true,
    "commission_cap_monthly": 1500,
    "tools": [
      "community_content", "academy_videos", "resources",
      "crm_community", "crm_global", "funnel_builder",
      "integrations", "booking"
    ]
  }'::jsonb),

  ('plan_97', 'Elite', 97.00, 'monthly', 7, '{
    "funnels_max": -1,
    "communities_max": -1,
    "contacts_max": -1,
    "can_create_community": true,
    "can_create_funnel": true,
    "commission_cap_monthly": 10000,
    "tools": [
      "community_content", "academy_videos", "resources",
      "crm_community", "crm_global", "funnel_builder",
      "integrations", "booking", "meta_ads", "workflows", "team_management"
    ]
  }'::jsonb),

  ('plan_300', 'Club', 300.00, 'monthly', 7, '{
    "funnels_max": -1,
    "communities_max": -1,
    "contacts_max": -1,
    "can_create_community": true,
    "can_create_funnel": true,
    "commission_cap_monthly": null,
    "tools": [
      "community_content", "academy_videos", "resources",
      "crm_community", "crm_global", "funnel_builder",
      "integrations", "booking", "meta_ads", "workflows",
      "team_management", "white_label"
    ]
  }'::jsonb)

ON CONFLICT (code) DO NOTHING;


-- ─────────────────────────────────────────────
-- PART 5 – user_platform_subscription
--   One row per user. Tracks their current internal platform plan.
--   downgrade_to_student_at: set when trial ends or subscription cancels.
--     A scheduled job / webhook checks this column and moves the user to student.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_platform_subscription (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT          NOT NULL UNIQUE,  -- community_members.member_id
  platform_plan_code      TEXT          NOT NULL DEFAULT 'student'
                            REFERENCES public.platform_plans(code),
  status                  TEXT          NOT NULL DEFAULT 'active'
                            CHECK (status IN ('trialing','active','past_due','canceled')),
  trial_start             TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  downgrade_to_student_at TIMESTAMPTZ,  -- set when trial/grace expires unpaid
  created_at              TIMESTAMPTZ   DEFAULT now(),
  updated_at              TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ups_status
  ON public.user_platform_subscription (status);

CREATE INDEX IF NOT EXISTS idx_ups_trial_end
  ON public.user_platform_subscription (trial_end)
  WHERE status = 'trialing';

CREATE INDEX IF NOT EXISTS idx_ups_downgrade
  ON public.user_platform_subscription (downgrade_to_student_at)
  WHERE downgrade_to_student_at IS NOT NULL;

ALTER TABLE public.user_platform_subscription ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ups_no_public" ON public.user_platform_subscription
  FOR ALL USING (false) WITH CHECK (false);


-- ─────────────────────────────────────────────
-- PART 6 – referrals  (IMMUTABLE — enforced by trigger)
--   One row per referred user. Sponsor cannot be changed once set.
--   UNIQUE on user_id enforces single sponsor per user (compliance rule).
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL UNIQUE,  -- the referred user
  sponsor_user_id TEXT        NOT NULL,          -- who referred them
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_sponsor
  ON public.referrals (sponsor_user_id);

-- Trigger function: referral rows are write-once
CREATE OR REPLACE FUNCTION public.fn_referrals_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'referrals are immutable: sponsor cannot be changed once set (compliance rule). user_id=%, attempted sponsor=%',
    OLD.user_id, NEW.sponsor_user_id;
END;
$$;

DROP TRIGGER IF EXISTS trg_referrals_immutable ON public.referrals;
CREATE TRIGGER trg_referrals_immutable
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.fn_referrals_immutable();

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_no_public" ON public.referrals
  FOR ALL USING (false) WITH CHECK (false);


-- ─────────────────────────────────────────────
-- PART 7 – commissions
--   One row per payment event that generates commissions.
--   Captures both L1 (direct sponsor, 20%) and L2 (sponsor's sponsor, 20%)
--   in a single row for atomic insertion.
--
--   Cap enforcement (done in app layer before insert):
--     SELECT SUM(level1_amount) FROM commissions
--       WHERE sponsor_level1_user_id = $x
--         AND date_trunc('month', period_start) = date_trunc('month', now())
--         AND status NOT IN ('void','held')
--
--   Rule: only platform_plans generate commissions. community_plans do NOT.
--   Rule: only sponsors with active plan >= plan_47 receive commissions.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commissions (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_user_id          TEXT          NOT NULL,  -- subscriber who paid
  platform_plan_code     TEXT          NOT NULL REFERENCES public.platform_plans(code),
  sponsor_level1_user_id TEXT,                    -- direct sponsor  (20%)
  sponsor_level2_user_id TEXT,                    -- sponsor's sponsor (20%)
  level1_amount          NUMERIC(10,2) DEFAULT 0,
  level2_amount          NUMERIC(10,2) DEFAULT 0,
  currency               TEXT          NOT NULL DEFAULT 'USD',
  period_start           TIMESTAMPTZ   NOT NULL,
  period_end             TIMESTAMPTZ   NOT NULL,
  status                 TEXT          NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','payable','paid','held','void')),
  reason                 TEXT,                    -- hold/void justification
  metadata               JSONB,
  created_at             TIMESTAMPTZ   DEFAULT now(),
  updated_at             TIMESTAMPTZ   DEFAULT now()
);

-- Fast monthly cap queries per beneficiary
CREATE INDEX IF NOT EXISTS idx_commissions_level1_period
  ON public.commissions (sponsor_level1_user_id, period_start);

CREATE INDEX IF NOT EXISTS idx_commissions_level2_period
  ON public.commissions (sponsor_level2_user_id, period_start);

CREATE INDEX IF NOT EXISTS idx_commissions_status
  ON public.commissions (status);

CREATE INDEX IF NOT EXISTS idx_commissions_payer
  ON public.commissions (payer_user_id);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions_no_public" ON public.commissions
  FOR ALL USING (false) WITH CHECK (false);


-- ─────────────────────────────────────────────
-- PART 8 – payouts
--   Tracks disbursements to users.
--   Rules enforced in app layer:
--     - Minimum $50 (also enforced by DB CHECK)
--     - Processed on Fridays
--     - 7-day antifraude hold for new creators
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payouts (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT          NOT NULL,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount >= 50),
  currency   TEXT          NOT NULL DEFAULT 'USD',
  status     TEXT          NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','sent','paid','failed')),
  notes      TEXT,
  created_at TIMESTAMPTZ   DEFAULT now(),
  paid_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_user
  ON public.payouts (user_id);

CREATE INDEX IF NOT EXISTS idx_payouts_status
  ON public.payouts (status);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_no_public" ON public.payouts
  FOR ALL USING (false) WITH CHECK (false);
