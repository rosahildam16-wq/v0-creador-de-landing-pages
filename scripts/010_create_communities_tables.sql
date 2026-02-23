-- =============================================
-- Communities & Members tables for Magic Funnel
-- =============================================

-- 1. Communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#8b5cf6',
  embudos_default TEXT[] DEFAULT '{}',
  leader_email TEXT,
  leader_name TEXT,
  cuota_miembro NUMERIC DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_select_all" ON public.communities FOR SELECT USING (true);
CREATE POLICY "communities_insert_admin" ON public.communities FOR INSERT WITH CHECK (true);
CREATE POLICY "communities_update_admin" ON public.communities FOR UPDATE USING (true);
CREATE POLICY "communities_delete_admin" ON public.communities FOR DELETE USING (true);

-- 2. Community members table (registered users linked to communities)
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  discount_code TEXT,
  embudos_asignados TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_all" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "members_insert_all" ON public.community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "members_update_all" ON public.community_members FOR UPDATE USING (true);
CREATE POLICY "members_delete_all" ON public.community_members FOR DELETE USING (true);

-- Unique email per community
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_email ON public.community_members(email);

-- 3. Admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT DEFAULT 'team',
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  destinatario TEXT DEFAULT 'admin',
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_all" ON public.admin_notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_all" ON public.admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON public.admin_notifications FOR UPDATE USING (true);

-- 4. Seed default communities
INSERT INTO public.communities (id, nombre, codigo, descripcion, color, embudos_default, leader_email, leader_name, cuota_miembro, activa)
VALUES 
  ('skalia-vip', 'Skalia VIP', 'DIAMANTECELION', 'Comunidad exclusiva del equipo Skalia. Acceso completo a herramientas premium y embudos especializados.', '#8b5cf6', ARRAY['franquicia-reset'], 'iajorgeleon21@gmail.com', 'Jorge Leon', 10, true),
  ('general', 'General', NULL, 'Usuarios registrados sin comunidad especifica. Acceso basico a la plataforma.', '#6366f1', '{}', NULL, NULL, 0, true)
ON CONFLICT (id) DO NOTHING;
