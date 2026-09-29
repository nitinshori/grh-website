-- 070: sign-ups created by the admin on a customer's behalf.
--
-- Delmergate (30 Sep 2026) sent every detail by email and asked us to set
-- it up; two legal entities means two Direct Debits. A GoCardless redirect
-- link lives 30 minutes, so it cannot be emailed ahead. Instead the admin
-- creates the request with everything filled in and the customer receives
-- a durable link (/onboard/dd?id=...&key=...) that shows the summary and
-- starts the mandate when clicked.
--
-- Idempotent.

ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS resume_key varchar(64),
  ADD COLUMN IF NOT EXISTS created_by_admin uuid REFERENCES users(id) ON DELETE SET NULL;
