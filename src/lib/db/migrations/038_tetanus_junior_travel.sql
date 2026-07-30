-- 038: Tetanus (Td/IPV, Revaxis) and Junior Travel Vaccines PGDs, signed
-- by Nitin Shori and Chris Pilkington on 30 Jul 2026. Both were raised by
-- Moin's Chemist as gaps in the travel offer (Tetanus and junior travel
-- vaccines unavailable).
--
-- Assignment: approved for every pharmacy that already holds the adult
-- travel core PGD, EXCEPT Pharmacy Plus Health. Per Nitin (30 Jul 2026),
-- PPH gets both on the "Non approved PGDs" list so Jane Wilkins can
-- review them in her own time and approve them herself from the sign-off
-- register when she is satisfied. Fully reversible by flipping status.
--
-- Idempotent: safe to re-run.

-- ── 1. Assign to all pharmacies holding travel-core, approved ──────────
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT DISTINCT p.pharmacy_id, s.slug, 'approved'
  FROM pharmacy_pgds p
 CROSS JOIN (VALUES ('tetanus'), ('junior-travel')) AS s(slug)
 WHERE p.pgd_slug = 'travel-core'
   AND p.pharmacy_id <> '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x
      WHERE x.pharmacy_id = p.pharmacy_id AND x.pgd_slug = s.slug
   );

-- ── 2. Pharmacy Plus Health: assigned but NOT approved ─────────────────
-- Appears on Jane's "Non approved PGDs" page and in the review-only
-- section of her clinical sign-off register.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', s.slug, 'not_approved'
  FROM (VALUES ('tetanus'), ('junior-travel')) AS s(slug)
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds x
    WHERE x.pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
      AND x.pgd_slug = s.slug
 );

UPDATE pharmacy_pgds
   SET status = 'not_approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug IN ('tetanus', 'junior-travel')
   AND status <> 'not_approved';
