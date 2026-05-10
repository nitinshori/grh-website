-- Capture network fingerprint on consultation saves so we can spot
-- pharmacies billing for one location but operating from several.
-- /24 lookups happen at query time so the raw bytes can be wiped per the
-- retention policy without losing the abuse signal.

ALTER TABLE consultation_records
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64),
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_records_pharmacy_ip
  ON consultation_records (pharmacy_id, ip_address);
