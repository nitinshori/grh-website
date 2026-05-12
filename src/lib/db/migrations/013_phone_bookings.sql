-- 013_phone_bookings.sql
-- Adds phone-booking support to consultation_drafts.
--
-- A "phone booking" is a draft with only the patient details + expected
-- visit date filled in (created by the pharmacy team when a patient
-- phones to book). When the patient arrives, the pharmacist resumes the
-- draft, the PGD client pre-fills patient data, and it becomes a normal
-- consultation. The draft TTL is also bumped from 7 to 30 days so phone
-- bookings have room to breathe.
--
-- Idempotent — safe to re-run.

ALTER TABLE consultation_drafts
  ADD COLUMN IF NOT EXISTS booking_type varchar(20) NOT NULL DEFAULT 'in_progress';

-- Store as varchar(10) ISO YYYY-MM-DD to match patient_dob convention
-- (avoids any date-type/timezone serialisation surprises).
ALTER TABLE consultation_drafts
  ADD COLUMN IF NOT EXISTS expected_visit_date varchar(10);

ALTER TABLE consultation_drafts
  ADD COLUMN IF NOT EXISTS patient_phone varchar(50);

-- Backfill: push existing drafts' expiry out so the 30-day window applies
-- retroactively (was 7 days from creation; bump to 30 from creation).
UPDATE consultation_drafts
SET expires_at = created_at + interval '30 days'
WHERE expires_at < created_at + interval '30 days';

CREATE INDEX IF NOT EXISTS idx_drafts_booking_type
  ON consultation_drafts (pharmacy_id, booking_type);

CREATE INDEX IF NOT EXISTS idx_drafts_expected_visit_date
  ON consultation_drafts (pharmacy_id, expected_visit_date)
  WHERE expected_visit_date IS NOT NULL;
