-- 076: appointment emails (7 Oct 2026)
--
-- Why: the public booking page had an "email me a confirmation" tick box
-- that did nothing, nothing reminded patients, and a pharmacy had no way
-- to invite a patient to book other than copying the link by hand (PPH
-- asked on behalf of a third-party pharmacy, 7 Oct 2026).
--
-- What: timestamps on appointments so a confirmation or reminder is sent
-- once; patient_invites records every invitation a pharmacy sends.

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_invite_sent';

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS appointments_reminder_idx
  ON appointments (start_time) WHERE status = 'booked' AND reminder_sent_at IS NULL;

CREATE TABLE IF NOT EXISTS patient_invites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id       uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  sent_by_user_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  to_email          varchar(255) NOT NULL,
  patient_name      varchar(255),
  service_name      varchar(255),
  message           text,
  sent_at           timestamptz NOT NULL DEFAULT now(),
  error             text
);
CREATE INDEX IF NOT EXISTS patient_invites_pharmacy_idx ON patient_invites (pharmacy_id, sent_at DESC);
