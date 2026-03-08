-- =============================================
-- 042 — Avatar URL + Supabase Storage Buckets
-- =============================================

-- 1. Add avatar_url to community_members
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create storage buckets (public, 2MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152,
   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('social-center-assets', 'social-center-assets', true, 2097152,
   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('calendar-assets', 'calendar-assets', true, 2097152,
   ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage policies — public read, open write (app handles auth)
DO $$
DECLARE
  bkt TEXT;
BEGIN
  FOREACH bkt IN ARRAY ARRAY['avatars', 'social-center-assets', 'calendar-assets']
  LOOP
    -- Public SELECT
    EXECUTE format(
      'CREATE POLICY "public_read_%s" ON storage.objects FOR SELECT USING (bucket_id = %L)',
      replace(bkt, '-', '_'), bkt
    );
    -- Allow INSERT (app-level auth in API route)
    EXECUTE format(
      'CREATE POLICY "allow_insert_%s" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)',
      replace(bkt, '-', '_'), bkt
    );
    -- Allow UPDATE (replace existing file)
    EXECUTE format(
      'CREATE POLICY "allow_update_%s" ON storage.objects FOR UPDATE USING (bucket_id = %L)',
      replace(bkt, '-', '_'), bkt
    );
    -- Allow DELETE (cleanup old files)
    EXECUTE format(
      'CREATE POLICY "allow_delete_%s" ON storage.objects FOR DELETE USING (bucket_id = %L)',
      replace(bkt, '-', '_'), bkt
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Policies already exist — ignore
END $$;

-- 4. Confirm
SELECT 'avatar_url added, storage buckets created' AS resultado;
