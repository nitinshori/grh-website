-- Drafts of in-progress consultations. Pharmacy assistants prep patient
-- details / consent, then the pharmacist resumes and completes.
-- Auto-expires 7 days after creation (a cron deletes expired rows).

CREATE TABLE IF NOT EXISTS consultation_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pgd_slug VARCHAR(255) NOT NULL,
  patient_first_name VARCHAR(100),
  patient_last_name VARCHAR(100),
  patient_dob VARCHAR(10),
  draft_state TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drafts_pharmacy_created
  ON consultation_drafts (pharmacy_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drafts_expires_at
  ON consultation_drafts (expires_at);
