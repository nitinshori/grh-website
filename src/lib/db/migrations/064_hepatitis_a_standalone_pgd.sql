-- 064: standalone Hepatitis A PGD (slug hepatitis-a), 20 September 2026.
--
-- Hepatitis A vaccination was authorised only inside the Hepatitis A and B
-- (Travel) PGD (hep-ab-travel) and the Travel Health core PGD (travel-core),
-- and pharmacists could not find "the hepatitis A PGD". Nitin: give it a PGD
-- and consultation tool of its own. The clinical content is unchanged, so
-- every pharmacy that already holds either of those two documents gets the
-- standalone one at the same status, and nobody gains access they did not
-- already have. HubRx-tenant pharmacies receive it through the full
-- catalogue rule in code and need no rows.
--
-- Pharmacies that hold neither get a not_approved row so the new service is
-- listed for them, as approval would have done.
--
-- Idempotent: safe to re-run.

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT p.pharmacy_id, 'hepatitis-a', p.status
  FROM (
    SELECT DISTINCT ON (pharmacy_id) pharmacy_id, status
      FROM pharmacy_pgds
     WHERE pgd_slug IN ('hep-ab-travel', 'travel-core')
     ORDER BY pharmacy_id, (status = 'approved') DESC
  ) AS p
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds x
    WHERE x.pharmacy_id = p.pharmacy_id AND x.pgd_slug = 'hepatitis-a'
 );

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, 'hepatitis-a', 'not_approved'
  FROM pharmacies ph
 WHERE ph.is_active
   AND ph.auth_source <> 'hubrx'
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id)
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = 'hepatitis-a'
   );
