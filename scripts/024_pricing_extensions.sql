-- =============================================
-- 024 – Pricing Extensions
-- • Annual billing option (20% discount)
-- • Community-level price overrides
-- • User-specific discounts (admin-controlled)
-- =============================================

-- ─────────────────────────────────────────────
-- PART 1 – Add annual_price to platform_plans
-- ─────────────────────────────────────────────
-- annual_price = total charged for the year (pre-calculated for display).
-- Default is price * 12 * 0.80 (20% discount).

ALTER TABLE public.platform_plans
  ADD COLUMN IF NOT EXISTS annual_price NUMERIC(10,2);

-- Back-fill: 20% off the annual equivalent
UPDATE public.platform_plans
  SET annual_price = ROUND(price * 12 * 0.80, 2)
  WHERE annual_price IS NULL AND price > 0;

-- student stays 0
UPDATE public.platform_plans
  SET annual_price = 0
  WHERE code = 'student';


-- ─────────────────────────────────────────────
-- PART 2 – Add billing_interval to user_platform_subscription
-- ─────────────────────────────────────────────
-- Tracks whether a user is on a monthly or annual billing cycle.

ALTER TABLE public.user_platform_subscription
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual'));


-- ─────────────────────────────────────────────
-- PART 3 – community_price_overrides
-- Super_admin can set a different price for a specific plan
-- inside a specific community (e.g. offer plan_27 at $10 in community X).
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_price_overrides (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    TEXT          NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  plan_code       TEXT          NOT NULL REFERENCES public.platform_plans(code) ON DELETE CASCADE,
  monthly_price   NUMERIC(10,2) NOT NULL,          -- override monthly price
  annual_price    NUMERIC(10,2),                    -- override annual price (NULL = auto 20% off monthly_price)
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  note            TEXT,                             -- admin note
  created_by      TEXT,                             -- admin user_id
  created_at      TIMESTAMPTZ   DEFAULT now(),
  updated_at      TIMESTAMPTZ   DEFAULT now(),

  UNIQUE (community_id, plan_code)
);

CREATE INDEX IF NOT EXISTS idx_cpo_community
  ON public.community_price_overrides (community_id)
  WHERE is_active = true;

ALTER TABLE public.community_price_overrides ENABLE ROW LEVEL SECURITY;
-- Only service role (admin) can access
CREATE POLICY "cpo_no_public" ON public.community_price_overrides
  FOR ALL USING (false) WITH CHECK (false);


-- ─────────────────────────────────────────────
-- PART 4 – user_discounts
-- Super_admin can assign a one-time or time-bound discount to a specific user.
-- Applied on top of community override or global price.
-- discount_type = 'pct'   → discount_value is percentage (0-100)
-- discount_type = 'fixed' → discount_value is a fixed USD amount off
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_discounts (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT          NOT NULL,             -- community_members.member_id
  plan_code      TEXT          REFERENCES public.platform_plans(code) ON DELETE SET NULL,
                                                      -- NULL = applies to any plan
  discount_type  TEXT          NOT NULL DEFAULT 'pct'
                   CHECK (discount_type IN ('pct', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL
                   CHECK (discount_value >= 0),       -- pct: 0-100; fixed: USD amount
  billing_scope  TEXT          NOT NULL DEFAULT 'both'
                   CHECK (billing_scope IN ('monthly', 'annual', 'both')),
  valid_from     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  valid_until    TIMESTAMPTZ,                          -- NULL = no expiry
  max_uses       INTEGER,                              -- NULL = unlimited
  used_count     INTEGER       NOT NULL DEFAULT 0,
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  reason         TEXT,                                 -- admin note
  created_by     TEXT          NOT NULL,               -- admin user_id
  revoked_by     TEXT,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   DEFAULT now(),
  updated_at     TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_discounts_user
  ON public.user_discounts (user_id)
  WHERE is_active = true;

ALTER TABLE public.user_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_discounts_no_public" ON public.user_discounts
  FOR ALL USING (false) WITH CHECK (false);


-- ─────────────────────────────────────────────
-- PART 5 – Helper function: resolve effective price
-- Returns the effective monthly/annual price for a user + plan + community.
-- Priority: user_discount > community_price_override > global platform_plan price
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_resolve_price(
  p_user_id     TEXT,
  p_plan_code   TEXT,
  p_community_id TEXT,
  p_interval    TEXT   -- 'monthly' | 'annual'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_monthly   NUMERIC;
  v_base_annual    NUMERIC;
  v_base           NUMERIC;
  v_override_row   RECORD;
  v_discount_row   RECORD;
  v_result         NUMERIC;
BEGIN
  -- 1. Get global base prices
  SELECT price, annual_price
    INTO v_base_monthly, v_base_annual
    FROM public.platform_plans
   WHERE code = p_plan_code AND is_active = true
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2. Check community override
  SELECT monthly_price, annual_price
    INTO v_override_row
    FROM public.community_price_overrides
   WHERE community_id = p_community_id
     AND plan_code = p_plan_code
     AND is_active = true
   LIMIT 1;

  IF FOUND THEN
    v_base_monthly := v_override_row.monthly_price;
    v_base_annual  := COALESCE(v_override_row.annual_price, ROUND(v_override_row.monthly_price * 12 * 0.80, 2));
  END IF;

  -- 3. Determine base for requested interval
  IF p_interval = 'annual' THEN
    v_base := COALESCE(v_base_annual, ROUND(v_base_monthly * 12 * 0.80, 2));
  ELSE
    v_base := v_base_monthly;
  END IF;

  v_result := v_base;

  -- 4. Apply user-specific discount (most recent active one that matches)
  SELECT *
    INTO v_discount_row
    FROM public.user_discounts
   WHERE user_id = p_user_id
     AND is_active = true
     AND (plan_code IS NULL OR plan_code = p_plan_code)
     AND (billing_scope = 'both' OR billing_scope = p_interval)
     AND valid_from <= now()
     AND (valid_until IS NULL OR valid_until > now())
     AND (max_uses IS NULL OR used_count < max_uses)
   ORDER BY created_at DESC
   LIMIT 1;

  IF FOUND THEN
    IF v_discount_row.discount_type = 'pct' THEN
      v_result := ROUND(v_result * (1 - v_discount_row.discount_value / 100), 2);
    ELSE
      v_result := GREATEST(0, ROUND(v_result - v_discount_row.discount_value, 2));
    END IF;
  END IF;

  RETURN v_result;
END;
$$;
