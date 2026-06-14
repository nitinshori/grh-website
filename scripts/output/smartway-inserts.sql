-- Smartway Pharma Ltd onboarding
-- Pharmacy ID: 3ad45417-7b0b-43cc-a868-6585fd568274

BEGIN;

INSERT INTO pharmacies (id, name, slug, address, email, brand_name, is_active, auth_source) VALUES (
  '3ad45417-7b0b-43cc-a868-6585fd568274',
  'Smartway Pharma Ltd',
  'smartway',
  '10 Lyon Road, London SW19 2RL',
  'support@smartwaypharmacy.co.uk',
  'Smartway Pharmacy',
  true, 'direct')
;

INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active, auth_source, username, must_change_password) VALUES (
  'gphc-5004068@smartway.grh.internal', '$2b$12$6shCWWTNK9QjCAM0mkvFpeWoLlKT/ddWRbR8h3VOMnc4gG8/pqRY.', 'Rachel', 'Edwards', 'pharmacy_admin',
  '3ad45417-7b0b-43cc-a868-6585fd568274', true, 'direct', '5004068', true);

INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active, auth_source, username, must_change_password) VALUES (
  'gphc-2068435@smartway.grh.internal', '$2b$12$mLSxf0SFNINU6yd.VesVG.a7xK7ucG2FbubWKeiYBY.VP380VU5He', 'Dhruv', 'Patel', 'pharmacist',
  '3ad45417-7b0b-43cc-a868-6585fd568274', true, 'direct', '2068435', true);

INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active, auth_source, username, must_change_password) VALUES (
  'gphc-2217378@smartway.grh.internal', '$2b$12$3VUDUdf4tSIH9JrIE4rqpuj7JGbyDGNRUFlCYuNBKFmiyXgm6IjWa', 'Vinesh', 'Solanki', 'pharmacist',
  '3ad45417-7b0b-43cc-a868-6585fd568274', true, 'direct', '2217378', true);

COMMIT;

-- CREDENTIALS (do not commit to git):
--   Rachel Edwards            (pharmacy_admin) — username 5004068 / temp password r3YdvzqScbkK
--   Dhruv Patel               (pharmacist    ) — username 2068435 / temp password 48Ck7dzaHV5d
--   Vinesh Solanki            (pharmacist    ) — username 2217378 / temp password qFTKarhkQpBt
