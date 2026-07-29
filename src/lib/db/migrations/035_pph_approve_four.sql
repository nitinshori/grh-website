-- 035: approve three further PGDs for Pharmacy Plus Health, per Nitin
-- 29 Jul 2026 (Jane Wilkins' request): Meningitis B, Flu (to be
-- reviewed for the 2026/27 season before use) and Chest. Ear is
-- deliberately NOT approved yet — the platform tool is built for
-- ciprofloxacin drops while PPH's signed document is the
-- dexamethasone/neomycin/acetic-acid spray; approval follows once the
-- tool matches. Idempotent.

-- trt and b12-injection are also approved: Jane and Chris completed the
-- clinical review of both (testing regimens, cautions, exclusions) and
-- the updated v003/v002 masters ship in this same deploy.
UPDATE pharmacy_pgds
   SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug IN ('meningitis-b', 'flu', 'chest-service', 'trt', 'b12-injection')
   AND status <> 'approved';
