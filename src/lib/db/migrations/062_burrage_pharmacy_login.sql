-- 062: Burrage Pharmacy (FAG48): the login that the sign-up flow never made.
--
-- Darawan at Burrage Pharmacy signed up, set up the direct debit, has been
-- charged, and could not log in (17 to 19 Sep 2026). The forgotten-password
-- page did nothing for her because there was no user row to reset: for a
-- direct sign-up the user is created only when the customer completes the
-- /setup-account link emailed at approval, which expires after 7 days. If
-- that email is lost, the pharmacy exists and is billed but nobody can log
-- in, and nothing on the site can recover it.
--
-- This creates the login directly. The pharmacy is the one the onboarding
-- request was approved into (found by contact email), else any pharmacy
-- named Burrage, else a new one built from the request. The user gets a
-- temporary password (bcrypt hash below; Nitin sends it) and
-- must_change_password, so the first login goes straight to
-- /change-password. The onboarding request is marked completed so the old
-- setup link cannot make a second account.
--
-- The general gap is closed in code the same day: /forgot-password now also
-- recognises an approved sign-up with no user and re-sends the setup link.
--
-- Idempotent: safe to re-run; nothing is reset once the user exists.

-- 1. A pharmacy to attach her to, creating one from the request if the
--    approval never happened.
INSERT INTO pharmacies (id, name, slug, group_slug, address, phone, email, is_active, auth_source)
SELECT
  '46b55fab-0d69-4eb9-b06a-d95697a1c2f2',
  COALESCE(r.pharmacy_name, 'Burrage Pharmacy'),
  'burrage-pharmacy',
  'burrage-pharmacy',
  COALESCE(r.pharmacy_address, 'ODS FAG48'),
  COALESCE(r.pharmacy_phone, '02082446969'),
  COALESCE(r.pharmacy_email, 'burragepharmacy1@gmail.com'),
  TRUE,
  'direct'
  FROM (SELECT 1) AS one
  LEFT JOIN LATERAL (
    SELECT * FROM onboarding_requests
     WHERE LOWER(contact_email) = 'burragepharmacy1@gmail.com'
     ORDER BY updated_at DESC LIMIT 1
  ) AS r ON TRUE
 WHERE NOT EXISTS (
   SELECT 1 FROM onboarding_requests
    WHERE LOWER(contact_email) = 'burragepharmacy1@gmail.com' AND pharmacy_id IS NOT NULL
 )
   AND NOT EXISTS (SELECT 1 FROM pharmacies WHERE name ILIKE 'Burrage%' OR slug = 'burrage-pharmacy');

-- A brand-new pharmacy needs its PGD assignments, as approval would have
-- given it. Existing pharmacies are left alone.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '46b55fab-0d69-4eb9-b06a-d95697a1c2f2', p.pgd_slug, 'approved'
  FROM (SELECT DISTINCT pgd_slug FROM pharmacy_pgds) AS p
 WHERE EXISTS (SELECT 1 FROM pharmacies WHERE id = '46b55fab-0d69-4eb9-b06a-d95697a1c2f2')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = '46b55fab-0d69-4eb9-b06a-d95697a1c2f2' AND x.pgd_slug = p.pgd_slug
   );

-- 2. The login.
INSERT INTO users (
  id, email, password_hash, first_name, last_name, role, pharmacy_id,
  is_active, auth_source, must_change_password
)
SELECT
  'a87d8dc5-802c-43cc-b4bc-a2f6565a426a',
  'burragepharmacy1@gmail.com',
  '$2b$12$6M.vlqYVxgLAVxH3fyJ8/.Lab4PKKpl1leb5SIyrF/s2seXcfqvHq',
  COALESCE(r.contact_first_name, 'Darawan'),
  COALESCE(r.contact_last_name, ''),
  'pharmacist',
  COALESCE(
    r.pharmacy_id,
    (SELECT id FROM pharmacies WHERE name ILIKE 'Burrage%' OR slug = 'burrage-pharmacy'
      ORDER BY (slug = 'burrage-pharmacy') DESC, created_at LIMIT 1)
  ),
  TRUE,
  'direct',
  TRUE
  FROM (SELECT 1) AS one
  LEFT JOIN LATERAL (
    SELECT * FROM onboarding_requests
     WHERE LOWER(contact_email) = 'burragepharmacy1@gmail.com'
     ORDER BY (pharmacy_id IS NOT NULL) DESC, updated_at DESC LIMIT 1
  ) AS r ON TRUE
 WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'burragepharmacy1@gmail.com');

-- 3. Close the sign-up so the old setup link cannot create a duplicate.
UPDATE onboarding_requests
   SET status = 'completed',
       setup_token_used_at = COALESCE(setup_token_used_at, NOW()),
       pharmacy_id = COALESCE(pharmacy_id, (SELECT pharmacy_id FROM users WHERE LOWER(email) = 'burragepharmacy1@gmail.com')),
       updated_at = NOW()
 WHERE LOWER(contact_email) = 'burragepharmacy1@gmail.com'
   AND status IN ('approved', 'awaiting_approval')
   AND EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'burragepharmacy1@gmail.com');
