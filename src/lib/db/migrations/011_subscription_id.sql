ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS gocardless_subscription_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS monthly_fee_pence INTEGER;
