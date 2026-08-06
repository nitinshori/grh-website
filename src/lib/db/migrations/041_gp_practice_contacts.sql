-- 041: remembered GP practice contact details.
--
-- Reported by Moin (Aug 2026): "Is there any way that the GP email
-- addresses can be auto-populated? When we used to use Pharma Doctor it
-- used to have all of the information filled."
--
-- We already pull practice details from the NHS ODS directory, but ODS
-- carries an email address for only a small minority of GP practices, so
-- in practice the field comes back blank and gets typed by hand every
-- time, for the same handful of local surgeries.
--
-- This table remembers what was typed, keyed on the practice's ODS code,
-- so the next consultation for that surgery fills itself in. Entries are
-- shared across pharmacies: these are published business contacts for NHS
-- organisations, not patient data, and a practice email learned in one
-- pharmacy is just as correct in the next.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS gp_practice_contacts (
  ods_code      varchar(20) PRIMARY KEY,
  practice_name varchar(255),
  email         varchar(255),
  phone         varchar(50),
  -- 'ods' when it came from the NHS directory, 'user' when a pharmacist
  -- typed it. User-entered values win, since they are why this exists.
  source        varchar(16) NOT NULL DEFAULT 'user',
  -- Which pharmacy last contributed, for audit only.
  updated_by_pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE SET NULL,
  times_used    integer NOT NULL DEFAULT 1,
  created_at    timestamp NOT NULL DEFAULT NOW(),
  updated_at    timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gp_practice_contacts_email_idx
  ON gp_practice_contacts (email)
  WHERE email IS NOT NULL;
