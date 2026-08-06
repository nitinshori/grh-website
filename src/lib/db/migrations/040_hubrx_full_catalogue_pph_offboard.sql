-- 040: HubRx takes the full catalogue; Pharmacy Plus Health's own
-- pharmacies come off the HubRx portal (Jane Wilkins, 6 Aug 2026).
--
-- PPH will run their own pharmacies from their company intranet, signing
-- the PGDs themselves and recording consultations in Jelly/CMS. Their
-- HubRx third-party pharmacies, existing and future, carry on here and
-- should see everything GRH offers.
--
-- The key change is PPH's auth_source. It is currently 'hubrx', which is
-- why their dashboard carries HubRx branding and why, under the new rule
-- in pgd-queries, they would otherwise inherit the whole catalogue.
-- Setting it to 'direct' takes them out of the HubRx portal exactly as
-- Jane asked, while leaving the account fully working.
--
-- Deliberately NOT deactivated: Jane and Sarah keep their logins so they
-- can download their signed PGDs whenever they need them. Their approved
-- PGD assignments, documents, consultation records and sign-offs are all
-- untouched.
--
-- Catalogue access for HubRx pharmacies is handled in code, not here:
-- pgd-queries grants the full catalogue to any pharmacy with
-- auth_source = 'hubrx', so a third party that SSOs in next month gets it
-- automatically, as does any PGD added later.
--
-- Reversible: set auth_source back to 'hubrx' to restore the previous
-- arrangement.
--
-- Idempotent: safe to re-run.

-- ── PPH's own pharmacies leave the HubRx portal ────────────────────────
-- Matched on the known PPH id and on the name, but only where there is no
-- external_id, so a genuine HubRx SSO pharmacy can never be caught by it.
UPDATE pharmacies
   SET auth_source = 'direct',
       updated_at = NOW()
 WHERE auth_source = 'hubrx'
   AND external_id IS NULL
   AND (
     id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     OR name ILIKE 'Pharmacy Plus Health%'
   );

-- Users carry their own auth_source for session branding; bring PPH's
-- people across too so their portal matches their pharmacy.
UPDATE users
   SET auth_source = 'direct'
 WHERE auth_source = 'hubrx'
   AND pharmacy_id IN (
     SELECT id FROM pharmacies
      WHERE id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
         OR name ILIKE 'Pharmacy Plus Health%'
   );
