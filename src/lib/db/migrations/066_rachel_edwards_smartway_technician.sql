-- 066: Rachel Edwards, Smartway Pharma Ltd, pharmacy technician, GPhC 5004068.
--
-- Rachel, 23 Sep 2026: the consultation declaration should show her as a
-- pharmacy technician and carry her number. /api/me autofills from a
-- clinicians row matched on the user's name and the pharmacy group_slug;
-- she had none. The group_slug is taken from the Smartway pharmacy row so
-- the match cannot drift. The user's stored name must equal "Rachel
-- Edwards" for the match; it does (her declaration printed it).
--
-- Idempotent: safe to re-run.

INSERT INTO clinicians (group_slug, name, gphc_number, role, is_active)
SELECT COALESCE(p.group_slug, p.slug), 'Rachel Edwards', '5004068', 'Pharmacy Technician', TRUE
  FROM pharmacies p
 WHERE p.id = '3ad45417-7b0b-43cc-a868-6585fd568274'
   AND COALESCE(p.group_slug, p.slug) IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM clinicians c
      WHERE c.group_slug = COALESCE(p.group_slug, p.slug) AND c.name = 'Rachel Edwards'
   );

UPDATE clinicians c
   SET gphc_number = '5004068', role = 'Pharmacy Technician', is_active = TRUE
  FROM pharmacies p
 WHERE p.id = '3ad45417-7b0b-43cc-a868-6585fd568274'
   AND c.group_slug = COALESCE(p.group_slug, p.slug)
   AND c.name = 'Rachel Edwards'
   AND (c.gphc_number IS DISTINCT FROM '5004068' OR c.role IS DISTINCT FROM 'Pharmacy Technician');
