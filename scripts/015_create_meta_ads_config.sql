-- =============================================
-- Migration for Meta Ads Integration
-- =============================================

CREATE TABLE IF NOT EXISTS public.meta_ads_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL, -- or UUID if linking to profiles
  ad_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  pixel_id TEXT,
  pixel_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id)
);

-- Enable RLS
ALTER TABLE public.meta_ads_config ENABLE ROW LEVEL SECURITY;

-- Policy: Members can only manage their own config (Simple allow for now, adjust based on auth)
CREATE POLICY "meta_config_allow_all" ON public.meta_ads_config FOR ALL USING (true) WITH CHECK (true);
