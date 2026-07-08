-- 020_consultation_delivery_notes.sql
-- Rachel/Pritchards: capture delivery details + a general consultation note
-- on every ePGD consultation record. Idempotent.

ALTER TABLE "consultation_records" ADD COLUMN IF NOT EXISTS "delivery_details" text;
ALTER TABLE "consultation_records" ADD COLUMN IF NOT EXISTS "consultation_notes" text;
