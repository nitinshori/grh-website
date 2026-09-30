-- 071: link Irfan Fazal's three pharmacies as one group, and correct
-- Bridgegate's contact address.
--
-- Kristal Pharmacy, Manor Pharmacy and Bridgegate Chemist (My Local
-- Chemist, Irfan Fazal, GPhC 2086008) signed up one at a time on 24 and
-- 29 Sep 2026, before the multi-branch wizard existed, so each got its own
-- group slug. On 30 Sep Sabith (Irfan's PA) asked for branches under one
-- account with different clinicians per branch: the group model.
--
--   group_slug 'my-local-chemist' on all three
--   irfan.fazal@ becomes pharmacy_admin (group dashboard, staff at every
--   branch); the two accounts.* logins stay as pharmacists at their branch
--   Bridgegate's onboarding contact_email corrected to accounts.pj@ (the
--   user row was changed by hand the same day; this keeps "Resend setup
--   link" from recreating the old address)
--
-- A further Bridgegate branch will be approved with joinGroupSlug
-- 'my-local-chemist'. Idempotent.

UPDATE pharmacies
   SET group_slug = 'my-local-chemist', updated_at = now()
 WHERE id IN (
   '1e9c6615-d759-447e-bfc9-d94fd7f43ade',  -- Kristal Pharmacy
   '29761960-bdfc-4081-88d4-41bbb6393241',  -- Manor Pharmacy
   '9c6f55d4-3ca0-42cc-affa-f2fc5eb7d199'   -- Bridgegate Chemist
 )
   AND (group_slug IS DISTINCT FROM 'my-local-chemist');

UPDATE users
   SET role = 'pharmacy_admin', updated_at = now()
 WHERE id = '99cc0e71-9e02-48ad-9aea-80707b286189'  -- irfan.fazal@, Kristal
   AND role = 'pharmacist';

UPDATE onboarding_requests
   SET contact_email = 'accounts.pj@mylocalchemist.co.uk', updated_at = now()
 WHERE pharmacy_id = '9c6f55d4-3ca0-42cc-affa-f2fc5eb7d199'
   AND contact_email = 'accounts.duk@mylocalchemist.co.uk';
