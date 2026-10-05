-- 073: a pharmacist can work at more than one branch of a group.
--
-- Delmergate (5 Oct 2026): Ajay Nandyala works at Shirley Avenue, Sevenoaks
-- and Eureka. Until now a login was attached to exactly one pharmacy
-- (users.pharmacy_id) and every consultation record, PGD check and
-- sign-off was filed against it, so his supplies at Sevenoaks would have
-- been recorded under Eureka.
--
-- users.pharmacy_id stays as the HOME branch. This table grants additional
-- branches. The session's pharmacyId becomes the branch being worked at
-- (chosen on the dashboard, validated server-side against this table), so
-- records and access follow the branch without touching the code that
-- reads session.user.pharmacyId.
--
-- Idempotent.

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'branch_access_changed';

CREATE TABLE IF NOT EXISTS user_pharmacy_access (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pharmacy_id  uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  granted_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_pharmacy_access_unique
  ON user_pharmacy_access (user_id, pharmacy_id);
CREATE INDEX IF NOT EXISTS user_pharmacy_access_pharmacy_idx
  ON user_pharmacy_access (pharmacy_id);
