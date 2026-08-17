-- 043: three PGDs signed 14 Aug 2026 released to the catalogue.
--
-- Signed by Nitin Shori and Chris Pilkington after clinical review:
--   MenB v002    reissued to cover Bexsero (from 2 months) and Trumenba
--                (from 10 years), prompted by PPH's meeting with Pfizer
--   Foundayo     orforglipron, MHRA authorised 10 Aug 2026
--   Yellow fever Stamaril, replacing the withdrawn MenACWY clone
--
-- Per Nitin: all three go to everyone. HubRx pharmacies pick them up
-- automatically through the auth_source rule in pgd-queries, so no rows
-- are needed for them; this migration covers pharmacies assigned by row.
--
-- MenB already exists for most pharmacies as a slug, so nothing changes
-- there: the document behind it is now v002.
--
-- Idempotent: safe to re-run.

-- ── Foundayo to every pharmacy that already holds a weight PGD ─────────
-- Matched on wegovy-oral, so a pharmacy offering oral weight management
-- gets the new oral option, and one that does not is unaffected.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT DISTINCT p.pharmacy_id, 'foundayo', 'approved'
  FROM pharmacy_pgds p
 WHERE p.pgd_slug = 'wegovy-oral'
   AND p.status = 'approved'
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x
      WHERE x.pharmacy_id = p.pharmacy_id AND x.pgd_slug = 'foundayo'
   );

-- ── Yellow fever: assigned, but NOT approved by default ────────────────
-- Yellow fever may only be given at a NaTHNaC designated Yellow Fever
-- Vaccination Centre. Approving it for a pharmacy that has no designation
-- would put a service in front of them that they cannot lawfully provide,
-- so it is listed as not approved and switched on per pharmacy once
-- designation is confirmed. The tool itself also refuses to proceed until
-- the pharmacist confirms designation.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT DISTINCT p.pharmacy_id, 'yellow-fever', 'not_approved'
  FROM pharmacy_pgds p
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds x
    WHERE x.pharmacy_id = p.pharmacy_id AND x.pgd_slug = 'yellow-fever'
 );

-- ── Pharmacy Plus Health: MenB and Foundayo only ───────────────────────
-- Per Nitin, 14 Aug 2026: Jane gets the updated MenB and Foundayo. Yellow
-- fever is not for PPH.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', s.slug, 'approved'
  FROM (VALUES ('meningitis-b'), ('foundayo')) AS s(slug)
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds
    WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
      AND pgd_slug = s.slug
 );

UPDATE pharmacy_pgds
   SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug IN ('meningitis-b', 'foundayo')
   AND status <> 'approved';

-- Yellow fever stays off for PPH.
UPDATE pharmacy_pgds
   SET status = 'not_approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug = 'yellow-fever'
   AND status <> 'not_approved';
