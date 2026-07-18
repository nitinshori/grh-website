-- 029: personal test login for Nitin at Pharmacy Plus Health, so he can
-- see exactly what PPH's team sees (dashboard, assigned PGDs, documents,
-- Jane's scoped views). Username login: pphnitin. Password set by Nitin
-- (bcrypt, cost 12) — same pattern as migrations 023/028. Idempotent.

INSERT INTO users
  (email, username, password_hash, first_name, last_name, role, pharmacy_id, is_active, auth_source)
SELECT
  'pphnitin@getrealhealthpgd.co.uk',
  'pphnitin',
  '$2b$12$OMGj8zojzbxYn3NVMlRRWuCbzxgD8ZgT6THJz2ydQolWiSXrsK7o2',
  'Nitin',
  'Shori (PPH view)',
  'pharmacy_admin',
  '3be2791e-d356-415b-99f0-c4ba0e1829f3',
  true,
  'direct'
WHERE EXISTS (
    SELECT 1 FROM pharmacies WHERE id = '3be2791e-d356-415b-99f0-c4ba0e1829f3'
  )
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE lower(email) = 'pphnitin@getrealhealthpgd.co.uk'
       OR lower(username) = 'pphnitin'
  );
