-- Add invite fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

-- Create invite usage audit table
CREATE TABLE IF NOT EXISTS invite_uses (
  id BIGSERIAL PRIMARY KEY,
  inviter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_invite_uses_code ON invite_uses(code);

