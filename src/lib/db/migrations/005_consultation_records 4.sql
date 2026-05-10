-- Migration: Add consultation_records table for clinical patient data storage
-- Run against Neon Postgres

-- Outcome enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consultation_outcome') THEN
    CREATE TYPE consultation_outcome AS ENUM ('completed', 'referred', 'not_supplied');
  END IF;
END $$;

-- Main table
CREATE TABLE IF NOT EXISTS consultation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES pgd_consultations(id) ON DELETE SET NULL,
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pgd_slug VARCHAR(255) NOT NULL,

  -- Patient demographics (structured for search)
  patient_first_name VARCHAR(100) NOT NULL,
  patient_last_name VARCHAR(100) NOT NULL,
  patient_dob VARCHAR(10) NOT NULL,
  patient_nhs_number VARCHAR(20),
  patient_phone VARCHAR(50),
  patient_email VARCHAR(255),
  patient_address TEXT,
  patient_gp_name VARCHAR(255),
  patient_gp_practice VARCHAR(255),

  -- Full clinical data as JSON
  clinical_data TEXT NOT NULL,

  -- Outcome
  outcome consultation_outcome NOT NULL DEFAULT 'completed',
  medicine_supplied VARCHAR(255),
  medicine_dose VARCHAR(255),
  medicine_duration VARCHAR(100),
  medicine_quantity VARCHAR(50),

  -- Pharmacist sign-off
  pharmacist_name VARCHAR(255) NOT NULL,
  pharmacist_gphc VARCHAR(50) NOT NULL,

  -- Timestamps
  consultation_date TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consultation_records_pharmacy
  ON consultation_records(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_consultation_records_user
  ON consultation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_records_patient_name
  ON consultation_records(patient_last_name, patient_first_name);
CREATE INDEX IF NOT EXISTS idx_consultation_records_patient_nhs
  ON consultation_records(patient_nhs_number) WHERE patient_nhs_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consultation_records_pgd_slug
  ON consultation_records(pgd_slug);
CREATE INDEX IF NOT EXISTS idx_consultation_records_date
  ON consultation_records(consultation_date DESC);
