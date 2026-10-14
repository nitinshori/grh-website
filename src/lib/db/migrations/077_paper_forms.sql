-- 077: paper patient forms (14 Oct 2026)
--
-- Why: pharmacies print the blank patient forms for patients to complete
-- by hand. The Medical Director approved (a) attaching a scan or photo of
-- the completed paper form to a saved ePGD consultation record and (b) a
-- paper-only consultation record, for consultations done on paper, which
-- must carry at least one scan of the paper form.
--
-- What: paper_consultations (one row per paper-only consultation, soft
-- delete on the same rules as consultation_records) and
-- consultation_attachments (files in the PRIVATE Blob store, each owned by
-- exactly one tool record or one paper consultation). The new audit values
-- are only used by the app at runtime, never in this file.

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'paper_consultation_recorded';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'consultation_attachment_added';

CREATE TABLE IF NOT EXISTS paper_consultations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id         uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  created_by_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  pgd_slug            varchar(255) NOT NULL,
  consultation_date   date NOT NULL,
  patient_name        varchar(255) NOT NULL,
  patient_dob         date NOT NULL,
  outcome             varchar(20) NOT NULL
                      CHECK (outcome IN ('supplied', 'administered', 'referred', 'not_supplied')),
  product             varchar(255),
  dose                varchar(255),
  batch               varchar(100),
  batch_expiry        date,
  pharmacist_name     varchar(255) NOT NULL,
  pharmacist_gphc     varchar(50) NOT NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  deleted_reason      varchar(255)
);
CREATE INDEX IF NOT EXISTS paper_consultations_pharmacy_idx
  ON paper_consultations (pharmacy_id, consultation_date DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS consultation_attachments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id             uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  consultation_record_id  uuid REFERENCES consultation_records(id) ON DELETE CASCADE,
  paper_consultation_id   uuid REFERENCES paper_consultations(id) ON DELETE CASCADE,
  blob_url                text NOT NULL,
  file_name               varchar(255) NOT NULL,
  content_type            varchar(100) NOT NULL,
  size_bytes              integer NOT NULL,
  uploaded_by_user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consultation_attachments_one_parent CHECK (
    (consultation_record_id IS NOT NULL)::int + (paper_consultation_id IS NOT NULL)::int = 1
  )
);
CREATE INDEX IF NOT EXISTS consultation_attachments_record_idx
  ON consultation_attachments (consultation_record_id) WHERE consultation_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS consultation_attachments_paper_idx
  ON consultation_attachments (paper_consultation_id) WHERE paper_consultation_id IS NOT NULL;
