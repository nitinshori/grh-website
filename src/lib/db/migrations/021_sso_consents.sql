-- 021_sso_consents.sql
-- First-use consent capture for SSO users (Dan/HubRx): records acceptance
-- of GRH terms + data processing arrangements, versioned so re-consent can
-- be required when documents change. Idempotent.

CREATE TABLE IF NOT EXISTS "user_consents" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "document"    varchar(100) NOT NULL DEFAULT 'terms-dpa',
  "version"     varchar(20) NOT NULL,
  "accepted_at" timestamp NOT NULL DEFAULT now(),
  "ip_address"  varchar(64),
  "user_agent"  text,
  CONSTRAINT "user_consents_unique" UNIQUE ("user_id", "document", "version")
);
CREATE INDEX IF NOT EXISTS "user_consents_user_idx" ON "user_consents" ("user_id");
