-- =============================================
-- Community Resources (Assets Library)
-- =============================================

CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'imagen', 'video', 'documento', 'enlace'
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT, -- member_id
  is_public BOOLEAN DEFAULT true
);

-- RLS
ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;

-- Everyone can view resources
CREATE POLICY "resources_select_all" 
ON public.community_resources FOR SELECT 
USING (true);

-- Manual authorization in API for write operations
CREATE POLICY "resources_insert_all" ON public.community_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "resources_update_all" ON public.community_resources FOR UPDATE USING (true);
CREATE POLICY "resources_delete_all" ON public.community_resources FOR DELETE USING (true);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_resources_comm ON public.community_resources(community_id);
