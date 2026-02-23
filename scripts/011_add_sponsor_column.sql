-- Add sponsor_name column to community_members
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS sponsor_name TEXT DEFAULT NULL;
