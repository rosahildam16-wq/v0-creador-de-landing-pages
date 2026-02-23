-- Add free trial support
-- communities.free_trial_days: number of free days for new members (null = no trial)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS free_trial_days integer DEFAULT NULL;

-- community_members.trial_ends_at: when the free trial expires (null = no trial / paying)
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;

-- Set Skalia VIP to 30 days free trial
UPDATE communities SET free_trial_days = 30 WHERE id = 'skalia-vip';
