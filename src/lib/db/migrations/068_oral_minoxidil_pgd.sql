-- 068: Pattern Hair Loss (Low-Dose Oral Minoxidil) PGD (slug oral-minoxidil), 28 September 2026.
--
-- New off-label PGD for men and women, agreed by the Medical Director and
-- the Head Pharmacist, replacing the catalogue entry withdrawn on 11 September
-- 2026 that had no minoxidil PGD behind it. Assigned the same way as the
-- standalone hepatitis A PGD (migration 064): approved for every live direct
-- pharmacy, listed as not_approved for Pharmacy Plus Health until Jane signs
-- it off, and not_approved for evaluation accounts. HubRx-tenant pharmacies
-- receive it through the full catalogue rule in code. The tool itself is
-- pharmacists only; that is enforced in the tool, not here.
--
-- Idempotent: safe to re-run; an existing oral-minoxidil row is never changed.

-- Live direct pharmacies: approved.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, 'oral-minoxidil', 'approved'
  FROM pharmacies ph
 WHERE ph.is_active
   AND ph.auth_source <> 'hubrx'
   AND ph.id <> '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id AND y.status = 'approved')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = 'oral-minoxidil'
   );

-- Pharmacy Plus Health: listed for review, approved when Jane signs it off.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'oral-minoxidil', 'not_approved'
 WHERE EXISTS (SELECT 1 FROM pharmacies WHERE id = '3be2791e-d356-415b-99f0-c4ba0e1829f3')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds
      WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3' AND pgd_slug = 'oral-minoxidil'
   );

-- Everyone else with any assignment at all (evaluation accounts): listed,
-- not usable, as approval would have left it.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, 'oral-minoxidil', 'not_approved'
  FROM pharmacies ph
 WHERE ph.is_active
   AND ph.auth_source <> 'hubrx'
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id)
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = 'oral-minoxidil'
   );
