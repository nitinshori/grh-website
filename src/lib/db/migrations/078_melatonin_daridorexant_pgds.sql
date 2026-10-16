-- 078: Melatonin 5 mg for Adults: Insomnia and Jet Lag (slug melatonin) and
-- Long-Term Insomnia (Daridorexant) (slug daridorexant), version 001 of each,
-- 16 October 2026.
--
-- Signed off by the Medical Director and the Head Pharmacist (16 Oct 2026).
-- Assigned the same way as oral minoxidil (migration 068): approved for every
-- live direct pharmacy; listed as not_approved for Pharmacy Plus Health
-- (3be2791e-d356-415b-99f0-c4ba0e1829f3) until Jane signs them off; and
-- not_approved for evaluation accounts. HubRx-tenant pharmacies receive them
-- through the full catalogue rule in code. Arm A of melatonin and the whole
-- of daridorexant are pharmacists only; that is enforced in the tools.
--
-- Idempotent: safe to re-run; an existing melatonin or daridorexant row is
-- never changed.

-- Live direct pharmacies: approved.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, s.slug, 'approved'
  FROM pharmacies ph
 CROSS JOIN (VALUES ('melatonin'), ('daridorexant')) AS s(slug)
 WHERE ph.is_active
   AND ph.auth_source <> 'hubrx'
   AND ph.id <> '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id AND y.status = 'approved')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = s.slug
   );

-- Pharmacy Plus Health: listed under Non approved PGDs, approved when Jane
-- signs them off.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', s.slug, 'not_approved'
  FROM (VALUES ('melatonin'), ('daridorexant')) AS s(slug)
 WHERE EXISTS (SELECT 1 FROM pharmacies WHERE id = '3be2791e-d356-415b-99f0-c4ba0e1829f3')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds
      WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3' AND pgd_slug = s.slug
   );

-- Everyone else with any assignment at all (evaluation accounts): listed,
-- not usable.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, s.slug, 'not_approved'
  FROM pharmacies ph
 CROSS JOIN (VALUES ('melatonin'), ('daridorexant')) AS s(slug)
 WHERE ph.is_active
   AND ph.auth_source <> 'hubrx'
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id)
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = s.slug
   );
