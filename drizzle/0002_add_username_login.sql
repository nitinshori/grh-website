-- Add an alternate login identifier (the GPHC registration number for
-- partner-onboarded pharmacists) plus a flag that forces a password
-- change on next login. Used by the PPH bulk-import script.
--
-- The unique index is partial: only enforced on rows where username
-- IS NOT NULL, so existing email-only users aren't affected.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username varchar(64),
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
  ON users (LOWER(username))
  WHERE username IS NOT NULL;
