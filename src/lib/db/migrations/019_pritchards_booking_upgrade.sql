-- 019_pritchards_booking_upgrade.sql
-- Jacqui's requests (Pritchards):
--   • staff_members table + "booked by" attribution on appointments
--   • seed Pritchards' 20 staff names
--   • rename Victoria Road branch → Prestatyn
--   • appointment categories: IP Consultation / Common Ailments,
--     Smoking Consultation, Private Consultation (replace previous set)
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS "staff_members" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_slug" varchar(100) NOT NULL,
  "name"       varchar(255) NOT NULL,
  "is_active"  boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "staff_members_group_name_unique" UNIQUE ("group_slug", "name")
);

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "booked_by_staff_id" uuid REFERENCES "staff_members"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "appointments_booked_by_idx" ON "appointments" ("booked_by_staff_id");

-- Pritchards staff (Jacqui's list, in her order)
INSERT INTO "staff_members" ("group_slug", "name", "sort_order") VALUES
  ('pritchards', 'Jacqui', 1),
  ('pritchards', 'Charlotte', 2),
  ('pritchards', 'Laura', 3),
  ('pritchards', 'Rhian', 4),
  ('pritchards', 'Tina', 5),
  ('pritchards', 'Joseph', 6),
  ('pritchards', 'Catherine', 7),
  ('pritchards', 'Karen', 8),
  ('pritchards', 'Becca', 9),
  ('pritchards', 'Kate', 10),
  ('pritchards', 'Debs', 11),
  ('pritchards', 'Joe', 12),
  ('pritchards', 'Owen', 13),
  ('pritchards', 'Meriel', 14),
  ('pritchards', 'Linda', 15),
  ('pritchards', 'Anthony', 16),
  ('pritchards', 'Heather', 17),
  ('pritchards', 'Kayli', 18),
  ('pritchards', 'Bethan', 19),
  ('pritchards', 'Ange', 20)
ON CONFLICT ("group_slug", "name") DO NOTHING;

-- Victoria Road → Prestatyn
UPDATE "pharmacies"
SET "name" = replace("name", 'Victoria Road', 'Prestatyn')
WHERE "group_slug" = 'pritchards' AND "name" ILIKE '%victoria road%';

-- Appointment categories: deactivate the old set, then upsert the three
UPDATE "appointment_types" SET "is_active" = false WHERE "group_slug" = 'pritchards';

UPDATE "appointment_types" SET "is_active" = true, "sort_order" = 1
WHERE "group_slug" = 'pritchards' AND "name" = 'IP Consultation / Common Ailments';
INSERT INTO "appointment_types" ("group_slug", "name", "duration_minutes", "color", "sort_order", "is_active")
SELECT 'pritchards', 'IP Consultation / Common Ailments', 15, '#2563eb', 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_types" WHERE "group_slug" = 'pritchards' AND "name" = 'IP Consultation / Common Ailments'
);

UPDATE "appointment_types" SET "is_active" = true, "sort_order" = 2
WHERE "group_slug" = 'pritchards' AND "name" = 'Smoking Consultation';
INSERT INTO "appointment_types" ("group_slug", "name", "duration_minutes", "color", "sort_order", "is_active")
SELECT 'pritchards', 'Smoking Consultation', 20, '#d97706', 2, true
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_types" WHERE "group_slug" = 'pritchards' AND "name" = 'Smoking Consultation'
);

UPDATE "appointment_types" SET "is_active" = true, "sort_order" = 3
WHERE "group_slug" = 'pritchards' AND "name" = 'Private Consultation';
INSERT INTO "appointment_types" ("group_slug", "name", "duration_minutes", "color", "sort_order", "is_active")
SELECT 'pritchards', 'Private Consultation', 20, '#7c3aed', 3, true
WHERE NOT EXISTS (
  SELECT 1 FROM "appointment_types" WHERE "group_slug" = 'pritchards' AND "name" = 'Private Consultation'
);
