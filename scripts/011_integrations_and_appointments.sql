-- =============================================
-- Migration for Appointment Scheduling & Integrations
-- =============================================

-- 1. Add feature flags to communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"zoom_enabled": false, "calendar_enabled": false, "whatsapp_reminders_enabled": false}'::jsonb;

-- 2. Create member_integrations table to store personal tokens
CREATE TABLE IF NOT EXISTS public.member_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'zoom', 'whatsapp'
  access_token TEXT,
  refresh_token TEXT,
  expiry_date BIGINT,
  email TEXT,
  phone TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, provider)
);

-- 3. Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  meeting_link TEXT,
  provider TEXT, -- 'zoom', 'google_meet', 'manual'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Simple policies (tighten later with auth check if needed)
CREATE POLICY "integrations_allow_all" ON public.member_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "appointments_allow_all" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
