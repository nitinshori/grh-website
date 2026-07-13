-- 025: register the pharmacy-countersigned oral Wegovy (semaglutide tablets)
-- PGDs against Pharmacy Plus Health and Smartway Pharma, served from
-- /public (committed to the repo) rather than blob storage. Runs once at
-- build time; idempotent via WHERE NOT EXISTS.
--   PPH copy:      signed Nitin Shori + Chris Pilkington + Janey Tipping (10 Jul 2026)
--   Smartway copy: signed Nitin Shori + Chris Pilkington + Rachel (Smartway) (10 Jul 2026)

-- Retire any existing current oral-Wegovy rows for these pharmacies first.
UPDATE pharmacy_pgd_documents
   SET is_current = false,
       updated_at = now()
 WHERE pgd_slug = 'wegovy-oral'
   AND is_current = true
   AND pharmacy_id IN ('3be2791e-d356-415b-99f0-c4ba0e1829f3',
                       '3ad45417-7b0b-43cc-a868-6585fd568274')
   AND NOT EXISTS (
     SELECT 1 FROM pharmacy_pgd_documents d2
      WHERE d2.pgd_slug = 'wegovy-oral'
        AND d2.pharmacy_id = pharmacy_pgd_documents.pharmacy_id
        AND d2.document_url LIKE '/pgd-documents/pharmacy/%'
   );

-- Pharmacy Plus Health
INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3',
  'wegovy-oral',
  '/pgd-documents/pharmacy/wegovy-oral-pph-signed.pdf',
  'WEGOVY_TABLETS_PGD_V1_SIGNED_10Jul2026.pdf',
  213483,
  COALESCE((SELECT MAX(version) FROM pharmacy_pgd_documents
             WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
               AND pgd_slug = 'wegovy-oral'), 0) + 1,
  'Nitin Shori, Chris Pilkington, Janey Tipping',
  'Pharmacy-countersigned copy, added via migration 025 (13 Jul 2026)',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'wegovy-oral'
     AND document_url = '/pgd-documents/pharmacy/wegovy-oral-pph-signed.pdf'
);

-- Smartway Pharma Ltd
INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3ad45417-7b0b-43cc-a868-6585fd568274',
  'wegovy-oral',
  '/pgd-documents/pharmacy/wegovy-oral-smartway-signed.pdf',
  'WEGOVY_TABLETS_PGD_V1_SIGNED_RACHEL_10Jul2026.pdf',
  211706,
  COALESCE((SELECT MAX(version) FROM pharmacy_pgd_documents
             WHERE pharmacy_id = '3ad45417-7b0b-43cc-a868-6585fd568274'
               AND pgd_slug = 'wegovy-oral'), 0) + 1,
  'Nitin Shori, Chris Pilkington, Rachel (Smartway)',
  'Pharmacy-countersigned copy, added via migration 025 (13 Jul 2026)',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3ad45417-7b0b-43cc-a868-6585fd568274'
     AND pgd_slug = 'wegovy-oral'
     AND document_url = '/pgd-documents/pharmacy/wegovy-oral-smartway-signed.pdf'
);
