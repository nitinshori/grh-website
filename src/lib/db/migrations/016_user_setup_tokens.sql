-- 016_user_setup_tokens.sql
-- Adds one-time setup-token columns to the users table so pharmacy
-- admins can invite their staff. New user is created with a random
-- password hash (locked out) and emailed a /set-password link with a
-- 7-day token. Once they set their password the token is consumed.
--
-- Idempotent.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS setup_token_hash varchar(255);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS setup_token_expires_at timestamp;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS setup_token_used_at timestamp;
