-- Capture partial onboarding data step-by-step instead of only at GoCardless time.
--
-- Before this migration: the /onboard form only POSTed when the customer
-- clicked "Continue to direct debit" on step 3. If they bailed at step 1 or 2
-- we got nothing. Now we save after each Next click so leads are captured
-- regardless of whether they finish.
--
-- Contact fields are now nullable because step 1 only collects pharmacy
-- details. `last_step_completed` tracks how far through they got:
--   0 = no data yet (shouldn't happen — we always start at 1)
--   1 = pharmacy details captured
--   2 = pharmacist details captured
--   3 = DD started (mandate flow initiated)

ALTER TABLE onboarding_requests
  ALTER COLUMN contact_first_name DROP NOT NULL,
  ALTER COLUMN contact_last_name DROP NOT NULL,
  ALTER COLUMN contact_email DROP NOT NULL;

ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS last_step_completed SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS onboarding_requests_last_step_idx
  ON onboarding_requests (last_step_completed, created_at DESC);
