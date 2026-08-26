-- 049: the evaluation login for Rakesh Patel, Bachu's Pharmacy.
--
-- Nitin, 26 Aug 2026: active for 24 hours only, stopping at 8pm on the
-- evening of 27 Aug. Pairs with migration 048, which created the
-- evaluation pharmacy and gave it UTI approved plus the other 80
-- catalogue PGDs as not_approved.
--
-- What he gets:
--   * the full ePGD catalogue on the index, with UTI the only tool that
--     opens; the rest render inert (users.view_only, migration 047)
--   * the UTI written PGD, and the other 80 as titles only on the
--     "Non approved PGDs" page, which has never had download links
--   * an account that stops working at the expiry below, enforced per
--     request in middleware next to is_active, so he is signed out
--     within a minute rather than at next login
--
-- TIMEZONE, and the reason this says 19:00 and not 20:00.
-- access_expires_at is "timestamp without time zone". src/proxy.ts reads
-- it with new Date(value), which interprets a naive timestamp in the
-- server's local zone, and Vercel runs in UTC. 27 Aug is British Summer
-- Time, UTC+1. So 8pm UK is 19:00 UTC, and storing 20:00 here would have
-- given him an extra hour.
--
-- role = 'pharmacist' deliberately, not pharmacy_admin: an evaluation
-- user has no business inviting staff or changing pharmacy settings.
--
-- must_change_password stays false. Forcing a password change on a login
-- that expires in 24 hours is friction with no security benefit.
--
-- The hash below is bcrypt cost 12, the platform standard, and was
-- verified to round-trip before being written here. The plaintext is
-- deliberately not recorded in this file or anywhere in git.
--
-- NOTE for whoever reads this later: the password Nitin chose does not
-- satisfy src/lib/password-policy.ts (under 12 characters, and only two
-- of the four character classes). It works because the policy is checked
-- when a password is set through the app, not at login, and this row is
-- inserted directly. Acceptable for a 24-hour login to a pharmacy with
-- no patient data behind it. It should not become the pattern for real
-- accounts.
--
-- Clean-up once the evaluation is over: set is_active = false on this
-- user, or delete this user and the pharmacy from 048. The expiry makes
-- the login stop working on its own, so this is tidiness, not urgency.
--
-- Idempotent: safe to re-run. Re-running does NOT reset the password or
-- the expiry, so it cannot silently reopen an account closed on purpose.

INSERT INTO users (
  id, email, password_hash, first_name, last_name,
  role, pharmacy_id, is_active, must_change_password,
  access_expires_at, view_only, auth_source
)
VALUES (
  '7c4a9e21-58b3-4d6f-9a02-e3f81b6c5d47',
  'rakesh@bachuconsultancy.co.uk',
  '$2b$12$TuyOvQRW3nMyFFtpk0iM0ukos92teqaDCbbOpyWdnBUMhsmW7R73.',
  'Rakesh',
  'Patel',
  'pharmacist',
  '0d1e6b3c-9a47-4f52-8c6d-2b7e5a1f4d90',
  TRUE,
  FALSE,
  TIMESTAMP '2026-08-27 19:00:00',
  TRUE,
  'direct'
)
ON CONFLICT (email) DO NOTHING;
