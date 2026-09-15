-- 059: Lighthouse Pharmacy (HubRx third party) and Tina Obi-Uzom's login.
--
-- Mark Pedder (HubRx), 11 Sep 2026: another branch wants to start on the
-- PGDs before the HubRx portal V2 ships in a week or so, and asked for direct
-- access as for the earlier branch. Dr Vivienne Heyhoe (Lighthouse Pharmacy)
-- confirmed on 15 Sep 2026 that the account is for their services lead,
-- Tina Obi-Uzom, GPhC 2040821, pharmacy.ft720@nhs.net.
--
-- Pharmacy: auth_source = 'hubrx', so the full catalogue arrives through the
-- rule in pgd-queries (no pharmacy_pgds rows needed) and the dashboard shows
-- the HubRx tenant branding, exactly as a third party sees it after SSO.
-- external_id stays NULL until Insights sends one; when the branch SSOs in
-- through portal V2, match it to this pharmacy rather than creating a twin.
-- The ODS code FT720 is recorded in the address field until we have the
-- postal address.
--
-- User: pharmacy_admin, so Tina can invite her own staff from the dashboard.
-- No password is set here. The account is created locked (random hash) with
-- a single-use setup token, the same mechanism the pharmacy-admin invite
-- uses: she follows the /set-password link and chooses her own password.
-- Only the bcrypt hash of the token is in this file; the link itself was
-- given to Nitin to send. The token expires 21 days after this migration
-- runs. If it expires, a pharmacy admin or super admin can resend from the
-- staff page (POST /api/dashboard/staff/[id]).
--
-- Clinician row: her GPhC number, for the booking and sign-off records that
-- read clinicians by group_slug.
--
-- Idempotent: safe to re-run. The user insert is skipped if the email
-- already exists, and re-running does not reissue the setup token.

INSERT INTO pharmacies (id, name, slug, group_slug, address, email, is_active, auth_source)
SELECT
  '555e6b35-6246-4c33-b91d-1a1a7d21ea9c',
  'Lighthouse Pharmacy',
  'lighthouse-pharmacy',
  'lighthouse-pharmacy',
  'ODS FT720 (postal address to follow)',
  'pharmacy.ft720@nhs.net',
  TRUE,
  'hubrx'
 WHERE NOT EXISTS (SELECT 1 FROM pharmacies WHERE slug = 'lighthouse-pharmacy');

INSERT INTO users (
  id, email, password_hash, first_name, last_name, role, pharmacy_id,
  is_active, auth_source, setup_token_hash, setup_token_expires_at
)
SELECT
  'e291ec71-8622-46a8-8fb8-8364ee1df333',
  'pharmacy.ft720@nhs.net',
  '$2b$10$P2RZ8aRkwDkUEXJ8TmSWzOuX2G0adNVN0vJTxu3ctdIx0kWaG1fAy',
  'Tina', 'Obi-Uzom',
  'pharmacy_admin',
  (SELECT id FROM pharmacies WHERE slug = 'lighthouse-pharmacy'),
  TRUE,
  'hubrx',
  '$2b$10$6S9vP4vv1cS82hGQ6Vhf.eONOH471hkwFAaPR1H2N/TErWipEocs.',
  NOW() + INTERVAL '21 days'
 WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'pharmacy.ft720@nhs.net');

INSERT INTO clinicians (group_slug, name, gphc_number, role, is_active)
SELECT 'lighthouse-pharmacy', 'Tina Obi-Uzom', '2040821', 'Pharmacist', TRUE
 WHERE NOT EXISTS (
   SELECT 1 FROM clinicians WHERE group_slug = 'lighthouse-pharmacy' AND gphc_number = '2040821'
 );
