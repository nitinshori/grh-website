-- 037: four further PPH-only PGD tools built from Jane Wilkins' signed
-- documents, per Nitin 29 Jul 2026: Cellulitis (shares the skin-infection
-- antibiotic pathway with the type preset), Fungal Skin Infection
-- (miconazole/Trimovate), Psoriasis (calcipotriol/betamethasone) and
-- Period Pain (naproxen/mefenamic acid). Each assigned and approved for
-- Pharmacy Plus Health ONLY, with the signed document registered so it
-- appears on the dashboard and on Jane's/Sarah's sign-off register.
-- Idempotent.

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'cellulitis', 'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgds
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3' AND pgd_slug = 'cellulitis'
);

UPDATE pharmacy_pgds SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug = 'cellulitis' AND status <> 'approved';

INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'cellulitis',
  '/pgd-documents/pharmacy/cellulitis-pph.pdf', 'Jane 2026 PGD cellulitis.pdf', 545147, 1,
  'Jane Wilkins',
  'PPH-signed PGD — tool built 29 Jul 2026',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'cellulitis'
     AND document_url = '/pgd-documents/pharmacy/cellulitis-pph.pdf'
);

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'fungal-infection', 'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgds
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3' AND pgd_slug = 'fungal-infection'
);

UPDATE pharmacy_pgds SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug = 'fungal-infection' AND status <> 'approved';

INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'fungal-infection',
  '/pgd-documents/pharmacy/fungal-infection-pph.pdf', 'Jane 2026 PGD fungal infection.pdf', 467337, 1,
  'Jane Wilkins',
  'PPH-signed PGD — tool built 29 Jul 2026',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'fungal-infection'
     AND document_url = '/pgd-documents/pharmacy/fungal-infection-pph.pdf'
);

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'psoriasis', 'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgds
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3' AND pgd_slug = 'psoriasis'
);

UPDATE pharmacy_pgds SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug = 'psoriasis' AND status <> 'approved';

INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'psoriasis',
  '/pgd-documents/pharmacy/psoriasis-pph.pdf', 'Jane 2026 PGD psoriasis.pdf', 445956, 1,
  'Jane Wilkins',
  'PPH-signed PGD — tool built 29 Jul 2026',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'psoriasis'
     AND document_url = '/pgd-documents/pharmacy/psoriasis-pph.pdf'
);

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'period-pain', 'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgds
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3' AND pgd_slug = 'period-pain'
);

UPDATE pharmacy_pgds SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug = 'period-pain' AND status <> 'approved';

INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'period-pain',
  '/pgd-documents/pharmacy/period-pain-pph.pdf', 'Jane 2026 PGD period pain.pdf', 466857, 1,
  'Jane Wilkins',
  'PPH-signed PGD — tool built 29 Jul 2026',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'period-pain'
     AND document_url = '/pgd-documents/pharmacy/period-pain-pph.pdf'
);
