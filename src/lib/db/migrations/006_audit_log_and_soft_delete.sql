-- Migration 006: Audit log + soft-delete for consultation records
-- Adds GDPR/CQC compliance scaffolding without removing or altering existing data.
-- Safe to run on production: only ADDs columns/tables, no destructive changes.

-- 1. Soft-delete columns on consultation_records
ALTER TABLE consultation_records
  ADD COLUMN IF NOT EXISTS deleted_at timestamp,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason varchar(255);

-- Index for fast filtering of non-deleted records (most queries)
CREATE INDEX IF NOT EXISTS idx_consultation_records_deleted_at
  ON consultation_records (deleted_at)
  WHERE deleted_at IS NULL;

-- 2. Audit log enum + table
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'record_create',
    'record_view',
    'record_list',
    'record_export',
    'record_soft_delete',
    'record_purge',
    'login',
    'login_failed',
    'logout',
    'password_change'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_email varchar(255),
  action audit_action NOT NULL,
  record_id uuid,
  record_count integer,
  details text,
  ip_address varchar(64),
  user_agent text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_pharmacy_created
  ON audit_logs (pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_created
  ON audit_logs (record_id, created_at DESC) WHERE record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON audit_logs (action, created_at DESC);
