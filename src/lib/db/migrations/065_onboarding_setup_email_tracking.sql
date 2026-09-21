-- 065: record whether the sign-up setup email was actually sent.
--
-- Burrage Pharmacy, 17 to 19 Sep 2026: approved and billed, but the one
-- setup email never reached them, the link died after 7 days, and because
-- the login is only created when the link is clicked there was no account
-- at all and nothing on the admin side showed it. Approval returned
-- "emailed: true/false" to the browser and forgot it.
--
-- From this migration: the result of every setup email (first send or a
-- resend from the admin queue) is stored on the onboarding request, and the
-- approve route creates the user at approval time so the account exists
-- from day one and the forgotten-password page can reach it.
--
-- Idempotent: safe to re-run.

ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS setup_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS setup_email_error text,
  ADD COLUMN IF NOT EXISTS setup_email_attempts integer NOT NULL DEFAULT 0;
