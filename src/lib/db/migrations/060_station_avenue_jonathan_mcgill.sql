-- 060: Station Avenue (HubRx third party) and Jonathan McGill's login.
--
-- Mark Pedder (HubRx), 16 Sep 2026: Jonathan McGill at the Station Avenue
-- branch was expected to have direct access "the other week" ahead of the
-- HubRx portal V2, and has told HubRx he is still waiting. Nothing in the
-- repository, the migrations or the session history shows an account for
-- him, so this creates one on the same pattern as 059 (Lighthouse).
--
-- Guarded twice: the pharmacy is skipped if a pharmacy with this slug OR a
-- name containing "Station Avenue" already exists (in case it was created
-- by hand in the admin console), and the user is skipped if the email
-- already exists. The user attaches to whichever Station Avenue pharmacy
-- row is found. GPhC number to be added to clinicians when known.
--
-- Password: none set here. Locked account plus a single-use set-password
-- token (hash only in this file), valid 21 days from the build.
--
-- Idempotent: safe to re-run.

INSERT INTO pharmacies (id, name, slug, group_slug, email, is_active, auth_source)
SELECT
  '342fd3f5-3ae3-4ee0-a657-d42b91404070',
  'Station Avenue Pharmacy',
  'station-avenue',
  'station-avenue',
  'jonathanmcgill106@gmail.com',
  TRUE,
  'hubrx'
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacies WHERE slug = 'station-avenue' OR name ILIKE '%Station Avenue%'
 );

INSERT INTO users (
  id, email, password_hash, first_name, last_name, role, pharmacy_id,
  is_active, auth_source, setup_token_hash, setup_token_expires_at
)
SELECT
  '6e5e9ea0-2a01-4ace-9b36-eda3c812ec66',
  'jonathanmcgill106@gmail.com',
  '$2b$10$CRNr8xGORuKqcAm0JvWgqOv5SBS7GoATmpGAXS/CYOcv5m4HtufcC',
  'Jonathan', 'McGill',
  'pharmacy_admin',
  (SELECT id FROM pharmacies
     WHERE slug = 'station-avenue' OR name ILIKE '%Station Avenue%'
     ORDER BY (slug = 'station-avenue') DESC, created_at
     LIMIT 1),
  TRUE,
  'hubrx',
  '$2b$10$HJR7uWsjGEYjPjCOoXUqauOnTwd2jUO0DUTGndB9PPRmJXQM2dtoK',
  NOW() + INTERVAL '21 days'
 WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'jonathanmcgill106@gmail.com');
