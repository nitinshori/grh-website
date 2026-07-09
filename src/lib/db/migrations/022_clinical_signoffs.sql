-- 022: clinical sign-off register (Chris's review area, Jul 2026).
-- One row per digital sign-off of a platform item: a signed PGD document,
-- an ePGD consultation tool, or a training module. Items are signed off
-- one by one; re-signing after a version change inserts a new row so the
-- full history is retained.

CREATE TABLE IF NOT EXISTS clinical_signoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type varchar(32) NOT NULL,           -- 'pgd_document' | 'epgd_tool' | 'training_module'
  item_slug varchar(255) NOT NULL,
  item_title varchar(500),
  item_version varchar(100),                -- e.g. document filename, tool review label, module version
  signed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  signed_by_name varchar(255) NOT NULL,
  signed_by_role varchar(255),              -- free text, e.g. 'Pharmacist Independent Prescriber'
  declaration text NOT NULL,
  ip_address varchar(64),
  user_agent text,
  signed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clinical_signoffs_item_idx
  ON clinical_signoffs (item_type, item_slug, signed_at DESC);
