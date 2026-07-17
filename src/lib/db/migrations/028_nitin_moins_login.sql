-- 028: personal test login for Nitin at Moin's Chemist, so he can see
-- exactly what Moin's team sees (dashboard, assigned PGDs, documents).
-- Username login: moinnitin. Password set by Nitin (bcrypt, cost 12) —
-- same build-time pattern as migration 023. Idempotent.

INSERT INTO users
  (email, username, password_hash, first_name, last_name, role, pharmacy_id, is_active, auth_source)
SELECT
  'moinnitin@getrealhealthpgd.co.uk',
  'moinnitin',
  '$2b$12$c7D7Q.zCwK9HQtnpD.Fv5edj/aLkiQ1gWQbFmIjfBdi7bG1RfwyRO',
  'Nitin',
  'Shori (Moins view)',
  'pharmacy_admin',
  p.id,
  true,
  'direct'
FROM pharmacies p
WHERE p.slug = 'moins-chemist'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE lower(email) = 'moinnitin@getrealhealthpgd.co.uk'
       OR lower(username) = 'moinnitin'
  );
