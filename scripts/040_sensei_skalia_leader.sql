-- ============================================================
-- Migration 040: Sensei como Líder y Creador de Skalia VIP
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Asegurar que la comunidad Skalia VIP existe en la DB
INSERT INTO public.communities (
  id,
  nombre,
  codigo,
  descripcion,
  color,
  leader_email,
  leader_name,
  owner_username,
  cuota_miembro,
  activa,
  allow_trial,
  default_trial_days,
  embudos_default,
  created_at
)
VALUES (
  'skalia-vip',
  'Skalia VIP',
  'DIAMANTECELIONVIP',
  'Comunidad exclusiva del equipo Skalia. Acceso completo a herramientas premium y embudos especializados.',
  '#8b5cf6',
  'jlmarketing9011@gmail.com',
  'Jorge León',
  'sensei',
  10,
  true,
  true,
  30,
  ARRAY['franquicia-reset'],
  '2026-01-15T00:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  owner_username   = 'sensei',
  leader_email     = 'jlmarketing9011@gmail.com',
  leader_name      = 'Jorge León',
  activa           = true;

-- 2. Upsert de Sensei en community_members como líder de Skalia VIP
INSERT INTO public.community_members (
  member_id,
  community_id,
  email,
  name,
  username,
  password_plain,
  password_hash,
  role,
  activo,
  can_create_communities,
  embudos_asignados,
  created_at
)
VALUES (
  'reg-sensei',
  'skalia-vip',
  'jlmarketing9011@gmail.com',
  'Jorge León',
  'sensei',
  'Leon321$',
  'Leon321$',
  'leader',
  true,
  true,
  ARRAY['franquicia-reset', 'nomada-vip'],
  now()
)
ON CONFLICT (username) DO UPDATE SET
  role                   = 'leader',
  community_id           = 'skalia-vip',
  activo                 = true,
  can_create_communities = true,
  password_plain         = 'Leon321$',
  password_hash          = 'Leon321$',
  updated_at             = now();

-- 3. Suscripción plan elite (97) para Sensei — desactiva anteriores e inserta nueva
UPDATE public.subscriptions
SET status = 'cancelled', updated_at = now()
WHERE user_email = 'jlmarketing9011@gmail.com'
  AND status IN ('trial', 'active', 'pending_payment');

INSERT INTO public.subscriptions (
  user_email,
  user_role,
  plan_id,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
VALUES (
  'jlmarketing9011@gmail.com',
  'admin',
  'elite',
  'active',
  now(),
  now() + INTERVAL '10 years',
  now(),
  now()
);

-- 4. Rol de admin en admin_roles para Sensei (como líder de comunidad)
INSERT INTO public.admin_roles (
  user_id,
  role,
  granted_by,
  active,
  created_at
)
VALUES (
  'reg-sensei',
  'admin',
  'bootstrap',
  true,
  now()
)
ON CONFLICT DO NOTHING;
