-- =============================================
-- RBAC: Admin Roles & Audit Logs
-- =============================================

-- 1. Admin roles table
--    Stores elevated roles for platform administrators.
--    Regular members in community_members keep their existing role column.
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,                      -- matches community_members.member_id or a static identifier
  role          TEXT NOT NULL CHECK (role IN (
                  'super_admin',
                  'admin',
                  'finance_admin',
                  'support_admin',
                  'compliance_admin'
                )),
  granted_by    TEXT NOT NULL,                      -- user_id of who granted this role
  active        BOOLEAN NOT NULL DEFAULT true,      -- false = revoked (soft delete)
  revoked_at    TIMESTAMP WITH TIME ZONE,
  revoked_by    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Only one active role per user (a user can have multiple revoked entries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_roles_user_active
  ON public.admin_roles (user_id)
  WHERE active = true;

-- Fast lookups by role
CREATE INDEX IF NOT EXISTS idx_admin_roles_role
  ON public.admin_roles (role)
  WHERE active = true;

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- SELECT: only accessible from server-side (service role). Deny anon/authenticated reads.
CREATE POLICY "admin_roles_no_public_select"
  ON public.admin_roles FOR SELECT USING (false);

CREATE POLICY "admin_roles_no_public_insert"
  ON public.admin_roles FOR INSERT WITH CHECK (false);

CREATE POLICY "admin_roles_no_public_update"
  ON public.admin_roles FOR UPDATE USING (false);

CREATE POLICY "admin_roles_no_public_delete"
  ON public.admin_roles FOR DELETE USING (false);


-- =============================================
-- 2. Audit logs table
--    Append-only. Records every sensitive action
--    performed by admin-level users.
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  TEXT NOT NULL,                     -- who performed the action
  actor_role     TEXT NOT NULL,                     -- their role at the time of action
  action_type    TEXT NOT NULL,                     -- e.g. 'create_user', 'delete_lead', 'grant_role'
  target_type    TEXT,                              -- e.g. 'user', 'lead', 'community', 'subscription'
  target_id      TEXT,                              -- ID of the affected resource
  payload        JSONB,                             -- optional: before/after snapshot or extra context
  reason         TEXT,                              -- optional: human-readable justification
  ip             TEXT,
  user_agent     TEXT,
  timestamp      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit logs are append-only: no UPDATE or DELETE allowed via RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_no_public_select"
  ON public.audit_logs FOR SELECT USING (false);

CREATE POLICY "audit_logs_insert_deny"
  ON public.audit_logs FOR INSERT WITH CHECK (false);

-- No UPDATE or DELETE policies: effectively immutable from client side.

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs (actor_user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target
  ON public.audit_logs (target_type, target_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs (action_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON public.audit_logs (timestamp DESC);
