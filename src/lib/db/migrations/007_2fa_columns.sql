-- Migration 007: Add 2FA / TOTP columns to users
-- Safe to run on production: only ADDs nullable columns.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS totp_secret varchar(64),
  ADD COLUMN IF NOT EXISTS totp_enabled boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS totp_backup_codes text;
