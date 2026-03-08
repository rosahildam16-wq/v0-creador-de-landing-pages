-- =============================================
-- Migration 022: Security constraints
-- Substep 2.4 — Phase A compliance
-- =============================================
-- 1. Max 2 active super_admins (trigger)
-- 2. Audit event on referral UPDATE attempt (sponsor lock)
-- =============================================


-- ─────────────────────────────────────────────
-- 1. LIMIT SUPER_ADMIN TO 2 ACTIVE ROWS
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_check_super_admin_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INT;
BEGIN
  -- Only applies when inserting or activating a super_admin row
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.active = true)) THEN
    IF NEW.role = 'super_admin' AND NEW.active = true THEN
      SELECT COUNT(*) INTO current_count
        FROM public.admin_roles
       WHERE role = 'super_admin'
         AND active = true
         AND id IS DISTINCT FROM NEW.id;   -- exclude the row being updated

      IF current_count >= 2 THEN
        RAISE EXCEPTION
          'COMPLIANCE: Maximum of 2 active super_admin accounts allowed. Current: %. Revoke an existing super_admin first.',
          current_count;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_super_admin_limit ON public.admin_roles;

CREATE TRIGGER trg_super_admin_limit
  BEFORE INSERT OR UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION fn_check_super_admin_limit();

COMMENT ON FUNCTION fn_check_super_admin_limit IS
  'Enforces maximum 2 active super_admin rows. Blocks INSERT or re-activation that would exceed the limit.';


-- ─────────────────────────────────────────────
-- 2. SPONSOR IMMUTABILITY — AUDIT ON ATTEMPT
--
-- The existing trigger fn_referrals_immutable() already BLOCKs updates.
-- This companion trigger writes an audit_logs row BEFORE blocking,
-- so every attempt is traceable even when the DB-level guard fires.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_sponsor_change_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Any UPDATE on referrals = a sponsor change attempt (field is immutable)
  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action_type,
    target_type,
    target_id,
    payload,
    reason,
    timestamp
  ) VALUES (
    current_setting('app.actor_user_id', true),   -- set by API layer via SET LOCAL
    current_setting('app.actor_role',    true),
    'sponsor_change_attempt',
    'referral',
    OLD.id::TEXT,
    jsonb_build_object(
      'user_id',          OLD.user_id,
      'current_sponsor',  OLD.sponsor_user_id,
      'attempted_sponsor', NEW.sponsor_user_id
    ),
    'Blocked by compliance — sponsor is permanently locked',
    now()
  );

  -- After logging, let the existing immutability trigger fire and raise the exception
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_sponsor_change ON public.referrals;

-- Fires BEFORE the immutability trigger (alphabetical: audit < immutable)
CREATE TRIGGER trg_audit_sponsor_change
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION fn_audit_sponsor_change_attempt();

COMMENT ON FUNCTION fn_audit_sponsor_change_attempt IS
  'Writes audit_logs entry on every attempt to UPDATE the referrals table (sponsor_change_attempt). Fires before the immutability trigger blocks the operation.';
