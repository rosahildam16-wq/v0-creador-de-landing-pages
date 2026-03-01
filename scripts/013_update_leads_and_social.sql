-- =============================================
-- Update Leads Schema with more details
-- =============================================

-- Add new tracking columns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS pais TEXT,
ADD COLUMN IF NOT EXISTS tipo_embudo TEXT DEFAULT 'nomada-vip',
ADD COLUMN IF NOT EXISTS trafico TEXT DEFAULT 'Organico' CHECK (trafico IN ('Organico', 'Pauta'));

-- Add columns to community_members if missing (for social center)
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_username ON public.community_members(username);

-- Create a table for social center visits tracking if not exists
CREATE TABLE IF NOT EXISTS public.social_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_visits_username ON public.social_visits(username);
