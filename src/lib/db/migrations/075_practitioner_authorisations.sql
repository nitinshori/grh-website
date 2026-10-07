-- 075: practitioner authorisations (7 Oct 2026)
--
-- Why: under NICE MPG2 the PGD is authorised by GRH's doctor, pharmacist
-- and organisation; what each pharmacist owes is a signed statement that
-- they have read the PGD and agree to work under it, countersigned by the
-- pharmacy's authorising manager, and the register must be producible at
-- inspection. Delmergate (Andrew Woolnough) was signing every PDF by hand
-- and uploading them one by one and asked for a way to do it in bulk.
--
-- One row per signature. A signature is for one PGD version; when the
-- document is reissued the row stays (history) and a new signature is
-- needed. Rows are never deleted: revoked_at marks a withdrawal.

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'practitioner_signed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'practitioner_countersigned';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'practitioner_authorisation_revoked';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'authorisation_register_export';

-- GPhC registration number, captured the first time a pharmacist signs.
ALTER TABLE users ADD COLUMN IF NOT EXISTS gphc_number varchar(20);

CREATE TABLE IF NOT EXISTS practitioner_authorisations (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pharmacy_id             uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  pgd_slug                varchar(255) NOT NULL,
  pgd_title               varchar(255) NOT NULL,
  pgd_version             varchar(50) NOT NULL,          -- e.g. v009 (GRH master) or upload v2
  document_source         varchar(20) NOT NULL,          -- master | override
  document_ref            text NOT NULL,                 -- master filename or override row id: the document's identity
  declaration             text NOT NULL,
  signed_name             varchar(255) NOT NULL,
  gphc_number             varchar(20),
  signed_at               timestamptz NOT NULL DEFAULT now(),
  ip_address              varchar(64),
  user_agent              text,
  countersigned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  countersigned_name      varchar(255),
  countersigned_at        timestamptz,
  revoked_at              timestamptz,
  revoked_by_user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  revoke_reason           text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- One live signature per practitioner per document (a master file is the
-- same document at every branch; a pharmacy's own upload is its own).
CREATE UNIQUE INDEX IF NOT EXISTS practitioner_authorisations_live
  ON practitioner_authorisations (user_id, pgd_slug, document_ref) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS practitioner_authorisations_pharmacy_idx
  ON practitioner_authorisations (pharmacy_id, signed_at DESC);
CREATE INDEX IF NOT EXISTS practitioner_authorisations_user_idx
  ON practitioner_authorisations (user_id, pgd_slug, signed_at DESC);
