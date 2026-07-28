-- 034: Jane Wilkins (GPhC 2043424) corrections, per Nitin 28 Jul 2026.
--
-- 1. Unblock her account: she is being shown the SSO first-use consent
--    screen, which only gates users whose auth_source is a partner
--    tenant. She is a direct GRH user, so normalise her auth_source and
--    record her consent for the current version so no variant of the
--    gate can hold her again. (Consent version matches CONSENT_VERSION
--    in src/lib/consent.ts: '2026-07'.)
-- 2. Correct the clinical-lead attribution in PPH's document records:
--    signed_by_names and notes previously said "Janey Tipping"; the
--    clinical lead is Jane Wilkins, GPhC 2043424 (GPhC register
--    checked). Document files are corrected in the same deploy.
-- Idempotent throughout.

UPDATE users
   SET auth_source = 'direct',
       updated_at = now()
 WHERE lower(email) = 'jane.wilkins@pharmacyplushealth.co.uk'
   AND auth_source <> 'direct';

INSERT INTO user_consents (user_id, document, version, user_agent)
SELECT u.id, 'terms-dpa', '2026-07', 'recorded-by-migration-034 (direct user incorrectly gated)'
  FROM users u
 WHERE lower(u.email) = 'jane.wilkins@pharmacyplushealth.co.uk'
   AND NOT EXISTS (
     SELECT 1 FROM user_consents c
      WHERE c.user_id = u.id AND c.document = 'terms-dpa' AND c.version = '2026-07'
   );

UPDATE pharmacy_pgd_documents
   SET signed_by_names = replace(signed_by_names, 'Janey Tipping', 'Jane Wilkins'),
       notes = replace(coalesce(notes, ''), 'J. Tipping', 'J. Wilkins'),
       updated_at = now()
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND (signed_by_names LIKE '%Tipping%' OR notes LIKE '%Tipping%');
