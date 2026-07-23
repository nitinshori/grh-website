-- 033: restore access for Jane Wilkins (Janey), clinical lead at
-- Pharmacy Plus Health. Sets a temporary password (bcrypt, cost 12 —
-- Nitin passes it to her directly), forces a password change at first
-- login, and upgrades her to pharmacy_admin so her scoped clinical
-- sign-off register and the PPH admin views work. Same build-time
-- pattern as migrations 023/028/029. Idempotent by nature (UPDATE).

UPDATE users
   SET password_hash = '$2b$12$sEFGVV6RUX4Xx13u8vATT.s23AY5NwGeIlDo9vQBqlvDrJj7EpIui',
       must_change_password = true,
       role = 'pharmacy_admin',
       is_active = true,
       updated_at = now()
 WHERE lower(email) = 'jane.wilkins@pharmacyplushealth.co.uk';
