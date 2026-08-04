-- 039: Vitamin B12 and folate PGD v003, signed 30 Jul 2026.
--
-- The document now covers three medicines: hydroxocobalamin injection,
-- cyanocobalamin 50 microgram tablets and folic acid 5mg tablets. Per
-- Nitin (30 Jul 2026), it goes out to every pharmacy.
--
-- b12-injection: assign approved to any pharmacy that does not already
-- hold it. PPH already holds it approved (migration 035) and is left
-- untouched.
--
-- folic-acid: newly added to the catalogue, with an ePGD tool that
-- already exists. Assigned approved to every pharmacy EXCEPT Pharmacy
-- Plus Health, which is restricted to Jane's signed-off set; PPH gets it
-- as 'not_approved' so it appears on their Non approved PGDs page for
-- Jane to approve herself once she has read v003.
--
-- Idempotent: safe to re-run.

-- ── 1. b12-injection to every pharmacy ─────────────────────────────────
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT DISTINCT p.pharmacy_id, 'b12-injection', 'approved'
  FROM pharmacy_pgds p
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds x
    WHERE x.pharmacy_id = p.pharmacy_id AND x.pgd_slug = 'b12-injection'
 );

-- ── 2. folic-acid to every pharmacy except PPH ─────────────────────────
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT DISTINCT p.pharmacy_id, 'folic-acid', 'approved'
  FROM pharmacy_pgds p
 WHERE p.pharmacy_id <> '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x
      WHERE x.pharmacy_id = p.pharmacy_id AND x.pgd_slug = 'folic-acid'
   );

-- ── 3. folic-acid for PPH, pending Jane's own approval ─────────────────
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'folic-acid', 'not_approved'
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds
    WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
      AND pgd_slug = 'folic-acid'
 );
