-- 064: standalone Hepatitis A PGD (slug hepatitis-a), 20 September 2026.
--
-- Hepatitis A vaccination was authorised only inside the Hepatitis A and B
-- (Travel) PGD (hep-ab-travel) and the Travel Health core PGD (travel-core),
-- and pharmacists could not find "the hepatitis A PGD". Nitin: give it a PGD
-- and consultation tool of its own, signed, and add it to all accounts.
--
-- So: approved for every active pharmacy that already holds at least one
-- approved PGD (a live customer), with one exception. Pharmacy Plus Health
-- runs on its own model (migrations 031 and 046): every catalogue PGD is
-- assigned to them as not_approved and moves to approved only when Jane
-- Wilkins and Sarah sign it off on their register. This new document goes
-- to them the same way, for review. Evaluation and demo pharmacies, which
-- hold nothing approved or are HubRx-tenant, are untouched. HubRx-tenant
-- pharmacies receive it through the full catalogue rule in code and need
-- no rows.
--
-- Idempotent: safe to re-run; an existing hepatitis-a row is never changed.

-- Live direct pharmacies: approved.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, 'hepatitis-a', 'approved'
  FROM pharmacies ph
 WHERE ph.is_active
   AND ph.auth_source <> 'hubrx'
   AND ph.id <> '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id AND y.status = 'approved')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = 'hepatitis-a'
   );

-- Pharmacy Plus Health: listed for review, approved when Jane signs it off.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'hepatitis-a', 'not_approved'
 WHERE EXISTS (SELECT 1 FROM pharmacies WHERE id = '3be2791e-d356-415b-99f0-c4ba0e1829f3')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds
      WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3' AND pgd_slug = 'hepatitis-a'
   );

-- Everyone else with any assignment at all (evaluation accounts): listed,
-- not usable, as approval would have left it.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT ph.id, 'hepatitis-a', 'not_approved'
  FROM pharmacies ph
 WHERE ph.is_active
   AND ph.auth_source <> 'hubrx'
   AND EXISTS (SELECT 1 FROM pharmacy_pgds y WHERE y.pharmacy_id = ph.id)
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x WHERE x.pharmacy_id = ph.id AND x.pgd_slug = 'hepatitis-a'
   );
