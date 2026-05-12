-- Migration 012: training_attempts
--
-- One row per quiz attempt against a training module. Latest passing
-- attempt drives the "is this pharmacist currently certified for PGD X?"
-- check; full history serves as the CPD audit log.

CREATE TABLE IF NOT EXISTS training_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  module_slug VARCHAR(100) NOT NULL,
  module_version VARCHAR(20) NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  score_fraction NUMERIC(5, 4) NOT NULL,
  passed BOOLEAN NOT NULL,
  failed_critical_question_ids JSONB,
  answers JSONB NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_attempts_user_module
  ON training_attempts (user_id, module_slug);

CREATE INDEX IF NOT EXISTS idx_training_attempts_latest_pass
  ON training_attempts (user_id, module_slug, passed, attempted_at DESC);
