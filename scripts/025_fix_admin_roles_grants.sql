-- ============================================================
-- 025_fix_admin_roles_grants.sql
--
-- ROOT CAUSE OF "Could not find the table 'public.admin_roles'
-- in the schema cache":
--
-- PostgREST (Supabase REST layer) only exposes tables whose
-- definition is visible to the roles it introspects.  When no
-- GRANT exists for `anon` / `authenticated`, PostgREST silently
-- omits the table from its schema cache — even for service_role
-- requests.
--
-- FIX: Grant table-level privileges to `anon` and `authenticated`.
-- Row-level security with USING (false) already blocks all
-- row access for those roles; these grants only let PostgREST
-- include the tables in its API surface so that service_role
-- requests (which bypass RLS) work correctly.
-- ============================================================

-- Schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- admin_roles: service_role writes + reads; anon/authenticated see 0 rows (RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_roles TO anon, authenticated;

-- audit_logs: same pattern
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon, authenticated;

-- Ensure the policies defined in 020_create_rbac_tables.sql still exist
-- (re-create only if missing to make this script idempotent)
DO $$
BEGIN
  -- admin_roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'admin_roles'
      AND policyname = 'admin_roles_no_public_select'
  ) THEN
    CREATE POLICY admin_roles_no_public_select
      ON public.admin_roles FOR SELECT USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'admin_roles'
      AND policyname = 'admin_roles_no_public_insert'
  ) THEN
    CREATE POLICY admin_roles_no_public_insert
      ON public.admin_roles FOR INSERT WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'admin_roles'
      AND policyname = 'admin_roles_no_public_update'
  ) THEN
    CREATE POLICY admin_roles_no_public_update
      ON public.admin_roles FOR UPDATE USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'admin_roles'
      AND policyname = 'admin_roles_no_public_delete'
  ) THEN
    CREATE POLICY admin_roles_no_public_delete
      ON public.admin_roles FOR DELETE USING (false);
  END IF;

  -- audit_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'audit_logs'
      AND policyname = 'audit_logs_no_public_select'
  ) THEN
    CREATE POLICY audit_logs_no_public_select
      ON public.audit_logs FOR SELECT USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'audit_logs'
      AND policyname = 'audit_logs_insert_deny'
  ) THEN
    CREATE POLICY audit_logs_insert_deny
      ON public.audit_logs FOR INSERT WITH CHECK (false);
  END IF;
END $$;

-- After running this migration, Supabase PostgREST needs to reload
-- its schema cache.  Either:
--   a) Wait up to 5 minutes for automatic refresh, OR
--   b) Run in Supabase SQL editor: NOTIFY pgrst, 'reload schema';
--      (This triggers an immediate schema cache reload.)
SELECT 'Run: NOTIFY pgrst, ''reload schema''; — to apply immediately' AS next_step;
