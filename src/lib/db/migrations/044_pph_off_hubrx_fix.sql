-- 044: actually move Pharmacy Plus Health off the HubRx portal.
--
-- Migration 040 was written to do this on 6 Aug but never took effect. It
-- carried a guard, "AND external_id IS NULL", intended to stop a genuine
-- HubRx SSO pharmacy being caught by the name match. PPH came in through
-- SSO and therefore HAS an external_id, so the guard excluded the very
-- pharmacy the migration was written for. Confirmed on 19 Aug: the admin
-- pharmacy list still shows PPH with source HubRx.
--
-- This targets the known PPH id explicitly, which is unambiguous and needs
-- no guard. Nothing else is touched.
--
-- external_id is deliberately left in place for the audit trail. SSO
-- resolution matches on auth_source AND external_id together, so with
-- auth_source now 'direct' an incoming HubRx token will no longer resolve
-- to this pharmacy. If anyone at PPH ever does SSO in through Insights
-- they would be given a fresh empty pharmacy rather than this one, which
-- is the intended separation but worth knowing.
--
-- Reversible: set auth_source back to 'hubrx' to undo.
--
-- Idempotent: safe to re-run.

UPDATE pharmacies
   SET auth_source = 'direct',
       updated_at = NOW()
 WHERE id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND auth_source <> 'direct';

-- Users carry their own auth_source for session branding, so bring PPH's
-- people across too or their portal keeps rendering as HubRx.
UPDATE users
   SET auth_source = 'direct'
 WHERE pharmacy_id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
   AND auth_source <> 'direct';
