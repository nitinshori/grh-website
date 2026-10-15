-- 078: Melatonin 5 mg for Adults: Insomnia and Jet Lag (slug melatonin) and
-- Long-Term Insomnia (Daridorexant) (slug daridorexant), version 001 of each,
-- 16 October 2026.
--
-- Both PGDs are listed for every pharmacy and approved for none. Each
-- pharmacy is approved individually by the Medical Director in Admin, PGD
-- Matrix, once the Head Pharmacist has signed both documents (15/16 Oct
-- 2026). Until then every active pharmacy that has any pharmacy_pgds row
-- (including Pharmacy Plus Health, 3be2791e-d356-415b-99f0-c4ba0e1829f3)
-- sees them under Non approved PGDs and cannot open the tools or documents.
-- Arm A of melatonin and the whole of daridorexant are pharmacists only;
-- that is enforced in the tools, not here.
--
-- Idempotent: safe to re-run; an existing melatonin or daridorexant row is
-- never changed.

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, s.slug, 'not_approved'
  FROM pharmacies ph
 CROSS JOIN (VALUES ('melatonin'), ('daridorexant')) AS s(slug)
 WHERE ph.is_active
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id)
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = s.slug
   );
