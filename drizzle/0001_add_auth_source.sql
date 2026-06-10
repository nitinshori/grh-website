-- Add tenant / partner attribution to pharmacies + users.
--
-- Backfill all existing rows to 'direct' (everyone today signed up
-- through /onboard, admin console, or pharmacy-admin invite). New
-- HubRx pharmacies + users will arrive via the SSO endpoint with
-- auth_source = 'hubrx' and external_id = <HubRx side id>.

ALTER TABLE pharmacies
  ADD COLUMN IF NOT EXISTS auth_source varchar(32) NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS external_id varchar(255);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_source varchar(32) NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS external_id varchar(255);

-- Index for lookup-by-(auth_source, external_id) — the SSO endpoint
-- uses this to resolve a returning HubRx user / pharmacy in O(1).
CREATE INDEX IF NOT EXISTS pharmacies_auth_source_external_id_idx
  ON pharmacies (auth_source, external_id);

CREATE INDEX IF NOT EXISTS users_auth_source_external_id_idx
  ON users (auth_source, external_id);
