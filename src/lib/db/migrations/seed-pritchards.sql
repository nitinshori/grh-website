-- Seed data: Pritchard's Pharmacy — two sites, two clinicians, starter appointment types
-- Run AFTER add-booking-system.sql

-- ══════════════════════════════════════════════════════════════════
-- 1. Pharmacy sites
-- ══════════════════════════════════════════════════════════════════

INSERT INTO pharmacies (id, name, slug, group_slug, address, brand_color, brand_name, is_active)
VALUES
  (
    gen_random_uuid(),
    'Pritchards Meliden',
    'pritchards-meliden',
    'pritchards',
    'Meliden, Prestatyn',
    '#3d8b37',
    'Pritchards Pharmacy',
    true
  ),
  (
    gen_random_uuid(),
    'Pritchards Victoria Road',
    'pritchards-victoria-road',
    'pritchards',
    '99 Victoria Road, Prestatyn, LL19 7SR',
    '#3d8b37',
    'Pritchards Pharmacy',
    true
  )
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- 2. User accounts (one per site)
--    Password should be set via the app or manually hashed.
--    Placeholder hash below — CHANGE BEFORE GO-LIVE.
-- ══════════════════════════════════════════════════════════════════

-- You'll need to generate real bcrypt hashes. These are placeholders.
-- Use: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TEMP_PASSWORD', 10).then(h => console.log(h))"

INSERT INTO users (id, email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
VALUES
  (
    gen_random_uuid(),
    'meliden@pritchardspharmacy.co.uk',
    '$2a$10$PLACEHOLDER_HASH_CHANGE_ME_BEFORE_GO_LIVE',
    'Pritchards',
    'Meliden',
    'pharmacy_admin',
    (SELECT id FROM pharmacies WHERE slug = 'pritchards-meliden' LIMIT 1),
    true
  ),
  (
    gen_random_uuid(),
    'victoriaroad@pritchardspharmacy.co.uk',
    '$2a$10$PLACEHOLDER_HASH_CHANGE_ME_BEFORE_GO_LIVE',
    'Pritchards',
    'Victoria Road',
    'pharmacy_admin',
    (SELECT id FROM pharmacies WHERE slug = 'pritchards-victoria-road' LIMIT 1),
    true
  )
ON CONFLICT (email) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- 3. Clinicians
-- ══════════════════════════════════════════════════════════════════

INSERT INTO clinicians (id, group_slug, name, gphc_number, role, is_active)
VALUES
  (gen_random_uuid(), 'pritchards', 'Jacqueline Campbell', '2037033', 'Pharmacist', true),
  (gen_random_uuid(), 'pritchards', 'Charlotte Smith', '2085592', 'Pharmacist', true)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- 4. Starter appointment types
-- ══════════════════════════════════════════════════════════════════

INSERT INTO appointment_types (id, group_slug, name, duration_minutes, color, requires_details, sort_order, is_active)
VALUES
  (gen_random_uuid(), 'pritchards', 'Travel Consultation', 30, '#14B8A6', false, 1, true),
  (gen_random_uuid(), 'pritchards', 'Flu Vaccination', 10, '#6366F1', false, 2, true),
  (gen_random_uuid(), 'pritchards', 'Blood Pressure Check', 15, '#DC2626', false, 3, true),
  (gen_random_uuid(), 'pritchards', 'Weight Management', 20, '#F59E0B', false, 4, true),
  (gen_random_uuid(), 'pritchards', 'Common Ailments Service', 15, '#3B82F6', true, 5, true),
  (gen_random_uuid(), 'pritchards', 'Pharmacist Independent Prescribing', 20, '#8B5CF6', true, 6, true),
  (gen_random_uuid(), 'pritchards', 'General Consultation', 15, '#25b4b4', false, 7, true)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- 5. Default availability (example — adjust to actual schedules)
--    Mon–Fri 9:00–17:00 for both clinicians at their primary site
-- ══════════════════════════════════════════════════════════════════

-- Jacqueline at Victoria Road: Mon–Fri 9:00–17:00
INSERT INTO clinician_availability (id, clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
SELECT
  gen_random_uuid(),
  (SELECT id FROM clinicians WHERE gphc_number = '2037033' LIMIT 1),
  (SELECT id FROM pharmacies WHERE slug = 'pritchards-victoria-road' LIMIT 1),
  day,
  '09:00',
  '17:00',
  true
FROM unnest(ARRAY[1,2,3,4,5]) AS day;  -- Mon to Fri

-- Charlotte at Meliden: Mon–Fri 9:00–17:00
INSERT INTO clinician_availability (id, clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
SELECT
  gen_random_uuid(),
  (SELECT id FROM clinicians WHERE gphc_number = '2085592' LIMIT 1),
  (SELECT id FROM pharmacies WHERE slug = 'pritchards-meliden' LIMIT 1),
  day,
  '09:00',
  '17:00',
  true
FROM unnest(ARRAY[1,2,3,4,5]) AS day;  -- Mon to Fri
