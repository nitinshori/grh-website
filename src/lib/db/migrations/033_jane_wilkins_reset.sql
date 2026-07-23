-- 033: upgrade Jane Wilkins (Janey), clinical lead at Pharmacy Plus
-- Health, to pharmacy_admin so her scoped clinical sign-off register
-- and the PPH admin views work.
--
-- NOTE: an earlier version of this migration also reset her password.
-- That was removed before it ever deployed — Jane recovered her own
-- password herself (23 Jul 2026), so this migration deliberately does
-- NOT touch password_hash or must_change_password. Idempotent.

UPDATE users
   SET role = 'pharmacy_admin',
       is_active = true,
       updated_at = now()
 WHERE lower(email) = 'jane.wilkins@pharmacyplushealth.co.uk'
   AND (role <> 'pharmacy_admin' OR is_active = false);
