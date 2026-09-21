-- 061: HubRx demo accounts lined up with their real HubRx email addresses.
--
-- Mark Pedder, 18 Sep 2026: he and his two Business Development Managers
-- will demonstrate the Insights portal including the SSO click-through into
-- GRH. The SSO resolver (src/lib/sso/resolve-sso-user.ts) matches a token
-- on external_id first and then on email, and an existing user keeps their
-- pharmacy. Mark's demo login (migration 042) sits on a GRH address, so an
-- Insights token carrying his real email would have created a second
-- account. This moves his email to the real one; his username Markpph and
-- password are unchanged, so the direct login still works.
--
-- The two BDMs get accounts on the same demo pharmacy (HubRx tenant, full
-- catalogue, no real patient data), role pharmacist. Locked passwords with
-- single-use set-password tokens, so they can also log in directly for a
-- demo without the click-through, as Mark does.
--
-- Idempotent: safe to re-run.

-- Mark's email, only if nobody else already holds the address.
UPDATE users
   SET email = 'mark.pedder@hubrx.co.uk',
       updated_at = NOW()
 WHERE LOWER(username) = 'markpph'
   AND LOWER(email) <> 'mark.pedder@hubrx.co.uk'
   AND NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'mark.pedder@hubrx.co.uk');

INSERT INTO users (
  id, email, password_hash, first_name, last_name, role, pharmacy_id,
  is_active, auth_source, setup_token_hash, setup_token_expires_at
)
SELECT
  '684e986c-b948-4240-a043-b3be3206315c',
  'taha.al-attraqchi@hubrx.co.uk',
  '$2b$10$43v3PtU22T5fREmHwtPAAeDy9xsQCEGGrhyoPkcTq9kqtCbfhVUWO',
  'Taha', 'Al-Attraqchi',
  'pharmacist',
  (SELECT id FROM pharmacies WHERE slug = 'hubrx-demo-mark'),
  TRUE,
  'hubrx',
  '$2b$10$iZyfPzMVW.zYZssOj5foqOMQtoXAfyMN/U7sOlhkHSHw9x3dlSLJO',
  NOW() + INTERVAL '21 days'
 WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'taha.al-attraqchi@hubrx.co.uk')
   AND EXISTS (SELECT 1 FROM pharmacies WHERE slug = 'hubrx-demo-mark');

INSERT INTO users (
  id, email, password_hash, first_name, last_name, role, pharmacy_id,
  is_active, auth_source, setup_token_hash, setup_token_expires_at
)
SELECT
  '98e0168c-c0fb-4c35-8b69-35812bd75eb3',
  'endrit.zeqiri@hubrx.co.uk',
  '$2b$10$qDxf.S1rLmA0ALzfPU4ZzeKol/oM/W/FuVOyAuYkrmEIH7.DLJphG',
  'Endrit', 'Zeqiri',
  'pharmacist',
  (SELECT id FROM pharmacies WHERE slug = 'hubrx-demo-mark'),
  TRUE,
  'hubrx',
  '$2b$10$496UdbjndcSrWmUeZXA1Pe5gNpdBVIZ9ygBSXrVt8lwLrDlvN4Ufm',
  NOW() + INTERVAL '21 days'
 WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = 'endrit.zeqiri@hubrx.co.uk')
   AND EXISTS (SELECT 1 FROM pharmacies WHERE slug = 'hubrx-demo-mark');
