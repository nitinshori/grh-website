-- 031: per-pharmacy PGD approval status + PPH restricted to Jane's
-- signed-off set (19 Jul 2026).
--
-- Jane (clinical lead, Pharmacy Plus Health) has reviewed and signed off
-- a specific subset of the catalogue ("Jane 2026 PGD" pack). Everything
-- else stays assigned but flagged 'not_approved': hidden from the
-- dashboard and blocked from tool/document access, listed only on the
-- new "Non approved PGDs" page. Fully reversible by flipping status.
--
-- Approved set (15): her 13 signed conditions mapped to platform slugs,
-- plus wegovy (injectable, her pack) and wegovy-oral (countersigned
-- 10 Jul). Notes: "androgenetic alopecia" is her finasteride PGD with
-- male-only inclusion criteria → hair-loss; "shingles" → shingles-vaccine
-- per Nitin; impetigo explicitly NOT approved (her broader skin-infection
-- PGD will replace it once built as a platform tool).

ALTER TABLE pharmacy_pgds
  ADD COLUMN IF NOT EXISTS status varchar(16) NOT NULL DEFAULT 'approved';

UPDATE pharmacy_pgds
   SET status = 'not_approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug NOT IN (
     'acne',
     'chickenpox',
     'cold-sores',
     'covid-booster',
     'eczema',
     'hair-loss',
     'hpv',
     'mounjaro',
     'period-delay',
     'pneumococcal',
     'rosacea',
     'rsv',
     'shingles-vaccine',
     'wegovy',
     'wegovy-oral'
   );

-- Ensure the approved set is present and approved (idempotent).
UPDATE pharmacy_pgds
   SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug IN (
     'acne','chickenpox','cold-sores','covid-booster','eczema','hair-loss',
     'hpv','mounjaro','period-delay','pneumococcal','rosacea','rsv',
     'shingles-vaccine','wegovy','wegovy-oral'
   );
