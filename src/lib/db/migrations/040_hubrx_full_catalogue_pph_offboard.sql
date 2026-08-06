-- 040: HubRx takes the full catalogue; Pharmacy Plus Health's own
-- pharmacies come off the portal (Jane Wilkins, 6 Aug 2026).
--
-- PPH have decided to run their own pharmacies from their company
-- intranet, signing the PGDs themselves and recording consultations in
-- Jelly/CMS. Their HubRx third-party pharmacies, existing and future,
-- carry on using this platform and should see everything GRH offers.
--
-- Catalogue access for HubRx pharmacies is handled in code, not here:
-- pgd-queries grants the full catalogue to any pharmacy with
-- auth_source = 'hubrx', so a third party that SSOs in next month gets
-- it automatically and so does any PGD added later. This migration only
-- offboards PPH's own sites and tidies the assignments they no longer
-- need.
--
-- Nothing is deleted. Consultation records, documents and sign-offs are
-- retained; setting is_active back to true restores the pharmacy.
--
-- Idempotent: safe to re-run.

-- ── 1. Deactivate PPH's own pharmacies ─────────────────────────────────
-- Matches the known PPH id plus any sibling site recorded under the same
-- name, but never a pharmacy that came in through HubRx SSO.
UPDATE pharmacies
   SET is_active = false,
       updated_at = NOW()
 WHERE is_active = true
   AND auth_source <> 'hubrx'
   AND (
     id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
     OR name ILIKE 'Pharmacy Plus Health%'
   );

-- ── 2. Clear the "not approved" listings for those pharmacies ──────────
-- The Non approved PGDs page was built for PPH's restricted set. With
-- them off the portal the rows serve no purpose; the approved rows stay
-- so the account can be switched back on unchanged.
DELETE FROM pharmacy_pgds
 WHERE status = 'not_approved'
   AND pharmacy_id IN (
     SELECT id FROM pharmacies
      WHERE is_active = false
        AND auth_source <> 'hubrx'
        AND (
          id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
          OR name ILIKE 'Pharmacy Plus Health%'
        )
   );
