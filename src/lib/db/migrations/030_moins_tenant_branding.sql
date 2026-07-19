-- 030: switch Moin's Chemist onto its own branded tenant ('moins').
-- The credentials login derives the session's authSource from the
-- pharmacy's auth_source, and the proxy's "identity beats hostname"
-- override then themes the whole authenticated experience with Moin's
-- logo and colours (src/lib/tenants.ts) — same mechanism as PPH/HubRx.
-- Idempotent.

UPDATE pharmacies
   SET auth_source = 'moins',
       updated_at = now()
 WHERE slug = 'moins-chemist'
   AND auth_source IS DISTINCT FROM 'moins';
