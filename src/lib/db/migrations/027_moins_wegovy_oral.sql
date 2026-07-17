-- 027: assign the oral Wegovy (semaglutide tablets) PGD to Moin's Chemist.
-- Moin reported (13 Jul 2026) that only injectable GLP-1s appear for his
-- pharmacy — wegovy-oral was published after his catalogue assignment run.
-- Idempotent via the pharmacy_pgd_unique index / WHERE NOT EXISTS.

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug)
SELECT p.id, 'wegovy-oral'
  FROM pharmacies p
 WHERE p.slug = 'moins-chemist'
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgds x
      WHERE x.pharmacy_id = p.id AND x.pgd_slug = 'wegovy-oral'
   );
