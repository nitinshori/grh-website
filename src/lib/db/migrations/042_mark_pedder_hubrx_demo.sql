-- 042: read-only demo login for Mark Pedder (HubRx), 14 Aug 2026.
--
-- Mark is briefing the Insights designers and wants to see the platform his
-- third-party pharmacies will land on. He has no login of his own, and Sarah
-- (who does) has been off or onsite.
--
-- Gives him his own HubRx-tenant pharmacy so he sees exactly what a third
-- party sees, with the full catalogue arriving automatically through the
-- auth_source = 'hubrx' rule in pgd-queries. Role is 'pharmacist', the
-- lowest privilege: he can open the catalogue, the consultation tools and
-- training, but not the sign-off register, document uploads or admin.
--
-- No real patient data is involved: the pharmacy is created empty.
--
-- When Insights launches, Mark's account should be matched on his real work
-- email so SSO resolves to this same user. Update the email below to his
-- HubRx address before that point, or the SSO flow will create a second
-- account for him.
--
-- Idempotent: safe to re-run.

-- ── 1. Demo pharmacy on the HubRx tenant ───────────────────────────────
INSERT INTO pharmacies (name, slug, address, is_active, auth_source)
SELECT 'HubRx Demo (Mark Pedder)', 'hubrx-demo-mark', 'HubRx', true, 'hubrx'
 WHERE NOT EXISTS (SELECT 1 FROM pharmacies WHERE slug = 'hubrx-demo-mark');

-- ── 2. Mark's login ────────────────────────────────────────────────────
-- Username Markpph, password as supplied by Nitin (bcrypt, cost 10).
INSERT INTO users (
  email, username, password_hash, first_name, last_name,
  role, pharmacy_id, is_active, auth_source
)
SELECT
  'markpph@getrealhealthpgd.co.uk',
  'Markpph',
  '$2b$10$1WhySKD2zmcsOxPwoFq7fOq6YKsM7Borax85REMgaeWyac1vXm0lK',
  'Mark', 'Pedder',
  'pharmacist',
  (SELECT id FROM pharmacies WHERE slug = 'hubrx-demo-mark'),
  true,
  'hubrx'
 WHERE NOT EXISTS (
   SELECT 1 FROM users WHERE LOWER(username) = 'markpph'
 );

-- Re-running resets the password to the supplied one and re-enables the
-- account, so the login can be restored without a new migration.
UPDATE users
   SET password_hash = '$2b$10$1WhySKD2zmcsOxPwoFq7fOq6YKsM7Borax85REMgaeWyac1vXm0lK',
       is_active = true
 WHERE LOWER(username) = 'markpph';
