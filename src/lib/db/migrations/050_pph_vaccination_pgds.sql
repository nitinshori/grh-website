-- 050: PPH's own chickenpox, shingles and meningitis B PGDs.
--
-- Janey Tipping, 27 Aug 2026, sent five finalised vaccination PGDs "which
-- Chris emailed to me on 6/04/2026" plus the MenB version "already live in
-- our branches". Nitin's call: PPH only.
--
-- Only three of the five are registered here. RSV and HPV were compared
-- against the live masters and are the same documents, 93% and 91% textually
-- identical with the remainder being page numbers landing in a different
-- place. Registering those would have given PPH an identical document with a
-- nearer expiry date, so they are deliberately left on the master.
--
-- The three below are genuinely different:
--
--   chickenpox      Adds occupational indications (healthcare workers and
--                   others exposed at work), a breastfeeding exclusion, the
--                   salicylate and Reye's syndrome warning, and the aciclovir
--                   interaction with its timings. None of that is in the
--                   master. 18 pages against the master's 14.
--   shingles        Removes Zostavax entirely and states Shingrix as the only
--                   vaccine in use, where the master still lists Zostavax and
--                   the 70 to 79 cohort. Adds the JCVI move to offering at 60
--                   from 1 Sept 2023. This is the clinically current one.
--   meningitis-b    Not an update, a different document: 7% similar. Bexsero
--                   only where the master covers Bexsero and Trumenba, aged 2
--                   and over, framed as a private service with eligible
--                   infants referred to the NHS programme. Narrower scope,
--                   which is exactly why it is PPH only.
--
-- EXPIRY, and it is short. These carry the dates Chris issued in February,
-- not the 31/7/27 the estate was re-dated to: chickenpox expires 30/9/26 and
-- shingles 31/10/26. Nitin has accepted that in order to get the better
-- clinical content to PPH now, on the basis that they are renewed before
-- October. Whoever picks this up next: those two dates are the reason to.
--
-- The MenB document arrived as a .docx and was converted to PDF. Its
-- valid-from and expiry cells are blank in the original, so there is no date
-- to lose in conversion, but it is worth knowing that it has none.
--
-- No signatures from Janey or Sarah appear in any of the five, despite the
-- covering email describing a password to add them. That matches every other
-- document on the platform, where the pharmacy adoption block is left for the
-- branch to complete, so it is recorded rather than treated as a blocker.
--
-- Idempotent: safe to re-run.

-- Make sure the three are approved for PPH, not merely visible for review.
INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug, status)
SELECT '3be2791e-d356-415b-99f0-c4ba0e1829f3', s.slug, 'approved'
  FROM (VALUES ('chickenpox'), ('shingles-vaccine'), ('meningitis-b')) AS s(slug)
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgds
    WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
      AND pgd_slug = s.slug
 );

UPDATE pharmacy_pgds SET status = 'approved'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND pgd_slug IN ('chickenpox', 'shingles-vaccine', 'meningitis-b')
   AND status <> 'approved';

-- Register PPH's copies. resolvePgdDocumentUrl returns these to a PPH
-- pharmacist and the GRH master to everyone else.
INSERT INTO pharmacy_pgd_documents
  (pharmacy_id, pgd_slug, document_url, filename, file_size_bytes,
   version, signed_by_names, notes, is_current, uploaded_by)
SELECT
  '3be2791e-d356-415b-99f0-c4ba0e1829f3',
  d.slug,
  d.url,
  d.filename,
  d.bytes,
  1,
  'Chris Pilkington, Nitin Shori',
  d.notes,
  true,
  (SELECT id FROM users WHERE lower(email) = 'admin@getrealhealthpgd.co.uk' LIMIT 1)
  FROM (VALUES
    ('chickenpox',
     '/pgd-documents/pharmacy/chickenpox-pph.pdf',
     'CHICKENPOX Final.pdf',
     471285,
     'PPH copy, sent by Janey 27 Aug 2026. Adds occupational indications, breastfeeding exclusion, salicylate/Reye''s warning and the aciclovir interaction. Expires 30/9/26 — renew before then.'),
    ('shingles-vaccine',
     '/pgd-documents/pharmacy/shingles-vaccine-pph.pdf',
     'SHINGLES FINAL.pdf',
     418788,
     'PPH copy, sent by Janey 27 Aug 2026. Shingrix only, Zostavax removed, JCVI age 60 rollout added. Expires 31/10/26 — renew before then.'),
    ('meningitis-b',
     '/pgd-documents/pharmacy/meningitis-b-pph.pdf',
     'MENINGITIS_B_AMENDED_v2 2026-1.docx (converted to PDF)',
     359180,
     'PPH version already live in their branches. Bexsero only, age 2+, private service with infants referred to the NHS programme. Narrower than the GRH master, which also covers Trumenba.')
  ) AS d(slug, url, filename, bytes, notes)
 WHERE NOT EXISTS (
   SELECT 1 FROM pharmacy_pgd_documents
    WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
      AND pgd_slug = d.slug
      AND document_url = d.url
 );
