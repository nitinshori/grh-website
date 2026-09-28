-- 067: record every ePGD link the site refuses, so a partner's broken link
-- can be diagnosed from our own data instead of by asking them for a
-- screenshot (HubRx catalogue page, 28 Sep 2026).
--
-- Written by the ePGD index page when the middleware bounces a tool URL to
-- it with ?denied=<segment>&why=<reason>. Read by the admin dashboard.
-- Idempotent.

CREATE TABLE IF NOT EXISTS epgd_refusals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  user_id      uuid,
  user_email   text,
  pharmacy_id  uuid,
  pharmacy_name text,
  auth_source  text,
  segment      text NOT NULL,
  reason       text NOT NULL,
  referer      text,
  host         text
);

CREATE INDEX IF NOT EXISTS epgd_refusals_created_at_idx ON epgd_refusals (created_at DESC);
