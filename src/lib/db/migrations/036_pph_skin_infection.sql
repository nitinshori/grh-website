-- 036: Skin Infection PGD for Pharmacy Plus Health, per Nitin 29 Jul 2026.
-- New ePGD tool built from PPH's signed PGD (flucloxacillin first line,
-- clarithromycin if penicillin-allergic, doxycycline 12+). Assigned and
-- approved for PPH ONLY; no other pharmacy gets the slug, and there is
-- no GRH master document. PPH's signed document is registered against
-- their pharmacy so it shows on the dashboard and Jane's sign-off
-- register. Idempotent.

INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', 'skin-infection', 'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgds
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'skin-infection'
);

UPDATE pharmacy_pgds SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug = 'skin-infection' AND status <> 'approved';

INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3',
  'skin-infection',
  '/pgd-documents/pharmacy/skin-infection-pph.pdf',
  'Jane 2026 PGD skin infection.pdf',
  548589,
  1,
  'Jane Wilkins',
  'PPH-signed Skin Infection PGD (flucloxacillin/clarithromycin/doxycycline) — tool built 29 Jul 2026',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'skin-infection'
     AND document_url = '/pgd-documents/pharmacy/skin-infection-pph.pdf'
);
