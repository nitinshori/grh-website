-- 063: Jonathan McGill's GPhC number for Station Avenue.
--
-- Supplied by Jonathan on 20 Sep 2026 after migration 060 created his
-- login without it. The branch will add their other pharmacists themselves
-- from the Staff page (he is pharmacy_admin).
--
-- Idempotent: safe to re-run.

INSERT INTO clinicians (group_slug, name, gphc_number, role, is_active)
SELECT COALESCE(p.group_slug, p.slug, 'station-avenue'), 'Jonathan McGill', '2033373', 'Pharmacist', TRUE
  FROM pharmacies p
 WHERE (p.slug = 'station-avenue' OR p.name ILIKE '%Station Avenue%')
   AND NOT EXISTS (SELECT 1 FROM clinicians c WHERE c.gphc_number = '2033373')
 ORDER BY (p.slug = 'station-avenue') DESC, p.created_at
 LIMIT 1;
