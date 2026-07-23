-- 032: publish Wegovy Tablets PGD v002 to Pharmacy Plus Health ONLY.
-- v002 incorporates Janey Tipping's clinical review of 23 Jul 2026
-- (tablet-specific wording, expanded SmPC cautions, renal/hepatic
-- exclusions, referral wording). Approved by Nitin Shori and Chris
-- Pilkington; Janey's signature row is ready for her to sign — she can
-- also sign off digitally via her scoped clinical sign-off register.
-- The GRH master (wegovy-oral.pdf) and all other pharmacies stay on v001.
-- Idempotent.

UPDATE pharmacy_pgd_documents
   SET is_current = false,
       updated_at = now()
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug = 'wegovy-oral'
   AND is_current = true
   AND document_url <> '/pgd-documents/pharmacy/wegovy-oral-pph-v2.pdf';

INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3',
  'wegovy-oral',
  '/pgd-documents/pharmacy/wegovy-oral-pph-v2.pdf',
  'WEGOVY_TABLETS_PGD_V2_23Jul2026.pdf',
  216230,
  COALESCE((SELECT MAX(version) FROM pharmacy_pgd_documents
             WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
               AND pgd_slug = 'wegovy-oral'), 0) + 1,
  'Nitin Shori, Chris Pilkington',
  'v002 — amendments from PPH clinical review (J. Tipping, 23 Jul 2026); awaiting Janey''s signature',
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM pharmacy_pgd_documents
   WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     AND pgd_slug = 'wegovy-oral'
     AND document_url = '/pgd-documents/pharmacy/wegovy-oral-pph-v2.pdf'
);
