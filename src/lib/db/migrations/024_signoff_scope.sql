-- 024: scope clinical sign-offs so GRH-level sign-offs (Nitin, Chris) are
-- kept separate from pharmacy-level ones (e.g. Janey at Pharmacy Plus
-- Health signing off her pharmacy's own uploaded PGD documents).

ALTER TABLE clinical_signoffs
  ADD COLUMN IF NOT EXISTS scope varchar(64) NOT NULL DEFAULT 'grh';

ALTER TABLE clinical_signoffs
  ADD COLUMN IF NOT EXISTS pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clinical_signoffs_scope_idx
  ON clinical_signoffs (scope, item_type, item_slug, signed_at DESC);
