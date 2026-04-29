-- Migration: Add appointments table for pharmacy diary system
-- Run this against your Neon database

-- Create the enum type for appointment status
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('available', 'booked', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create the appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status appointment_status NOT NULL DEFAULT 'available',
  patient_name VARCHAR(255),
  patient_phone VARCHAR(50),
  patient_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by pharmacy + date range
CREATE INDEX IF NOT EXISTS idx_appointments_pharmacy_time
  ON appointments (pharmacy_id, start_time, end_time);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments (pharmacy_id, status);
