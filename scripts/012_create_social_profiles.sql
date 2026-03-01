-- =============================================
-- Magic Social Center Profiles
-- =============================================

CREATE TABLE IF NOT EXISTS public.social_centers (
  username TEXT PRIMARY KEY, -- matches community_members.username
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  theme_config JSONB DEFAULT '{
    "primary_color": "#8b5cf6",
    "bg_style": "glass_mesh",
    "layout": "list",
    "button_style": "glass"
  }'::JSONB,
  links JSONB DEFAULT '[]'::JSONB, -- [{ label: "WhatsApp", url: "...", icon: "whatsapp", highlight: false }, ...]
  social_links JSONB DEFAULT '{}'::JSONB, -- { instagram: "...", tiktok: "...", ... }
  views_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.social_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_centers_select_all" ON public.social_centers FOR SELECT USING (true);
CREATE POLICY "social_centers_access_all" ON public.social_centers FOR ALL USING (true) WITH CHECK (true);
