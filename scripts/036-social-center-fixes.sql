-- ============================================================
-- 036 - Social Center Fixes
-- - Add tagline column
-- - Add is_published column
-- - Create increment_social_views RPC (was missing)
-- ============================================================

-- Add missing columns
ALTER TABLE social_centers
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- Create the missing RPC for view counting
CREATE OR REPLACE FUNCTION increment_social_views(x_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE social_centers
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE username = x_username;

  INSERT INTO social_visits (username, visited_at)
  VALUES (x_username, now())
  ON CONFLICT DO NOTHING;
END;
$$;

-- Grant execute to authenticated and anon roles
GRANT EXECUTE ON FUNCTION increment_social_views(text) TO authenticated, anon;
