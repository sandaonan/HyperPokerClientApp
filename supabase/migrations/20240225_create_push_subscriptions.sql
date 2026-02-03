-- Create push_subscriptions table for Web Push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES member(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, endpoint)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_member_id ON push_subscriptions(member_id);

-- Add comment
COMMENT ON TABLE push_subscriptions IS 'Stores Web Push subscription information for users';

