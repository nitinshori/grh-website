-- Migration: Full booking system — clinicians, appointment types, availability
-- Run this against your Neon database

-- ══════════════════════════════════════════════════════════════════
-- 1. Extend pharmacies table
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS group_slug VARCHAR(100);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7);
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_pharmacies_group_slug ON pharmacies (group_slug);

-- ══════════════════════════════════════════════════════════════════
-- 2. Clinicians
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clinicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_slug VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  gphc_number VARCHAR(20),
  role VARCHAR(100) DEFAULT 'Pharmacist',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinicians_group ON clinicians (group_slug);

-- ══════════════════════════════════════════════════════════════════
-- 3. Appointment types
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_slug VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  color VARCHAR(7) DEFAULT '#25b4b4',
  requires_details BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_types_group ON appointment_types (group_slug);

-- ══════════════════════════════════════════════════════════════════
-- 4. Clinician availability (recurring weekly)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clinician_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id UUID NOT NULL REFERENCES clinicians(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,  -- 0=Sun, 1=Mon … 6=Sat
  start_time VARCHAR(5) NOT NULL,  -- "09:00"
  end_time VARCHAR(5) NOT NULL,    -- "17:00"
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_clinician_availability_lookup
  ON clinician_availability (pharmacy_id, day_of_week);

-- ══════════════════════════════════════════════════════════════════
-- 5. Extend appointments table (or create if not exists)
-- ══════════════════════════════════════════════════════════════════

-- Create the enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('available', 'booked', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  clinician_id UUID REFERENCES clinicians(id) ON DELETE SET NULL,
  appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status appointment_status NOT NULL DEFAULT 'available',
  patient_name VARCHAR(255),
  patient_first_name VARCHAR(100),
  patient_surname VARCHAR(100),
  patient_dob VARCHAR(10),
  patient_phone VARCHAR(50),
  patient_email VARCHAR(255),
  service_details TEXT,
  notes TEXT,
  booked_online BOOLEAN NOT NULL DEFAULT false,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  email_confirmation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- If the table already exists from the simpler version, add new columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinician_id UUID REFERENCES clinicians(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_first_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_surname VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_dob VARCHAR(10);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_details TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booked_online BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS email_confirmation BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_appointments_pharmacy_time
  ON appointments (pharmacy_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_clinician
  ON appointments (clinician_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments (pharmacy_id, status);
