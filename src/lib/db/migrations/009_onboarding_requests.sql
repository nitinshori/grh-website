-- Self-serve pharmacy onboarding: requests start in `started`, move through
-- `dd_pending` (customer at GoCardless), `awaiting_approval` (mandate active,
-- waiting for admin), then either `approved` (admin clicks approve, pharmacy
-- + first user created, set-password email sent) or `rejected`.
-- Once the new owner sets their password, status flips to `completed`.

CREATE TYPE onboarding_status AS ENUM (
  'started',
  'dd_pending',
  'awaiting_approval',
  'approved',
  'rejected',
  'completed'
);

CREATE TABLE IF NOT EXISTS onboarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status onboarding_status NOT NULL DEFAULT 'started',

  -- Pharmacy details (entered in step 1)
  pharmacy_name VARCHAR(255) NOT NULL,
  pharmacy_address TEXT,
  pharmacy_postcode VARCHAR(20),
  pharmacy_phone VARCHAR(50),
  pharmacy_email VARCHAR(255),
  pharmacy_gphc VARCHAR(50),       -- premises GPhC registration number
  pharmacy_ods_code VARCHAR(20),   -- e.g. "FXXXX" — looked up via NHS ODS

  -- Primary contact / responsible pharmacist (step 2)
  contact_first_name VARCHAR(100) NOT NULL,
  contact_last_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  contact_gphc VARCHAR(50),        -- personal GPhC number
  contact_role VARCHAR(50),        -- e.g. "owner", "superintendent", "manager"

  -- GoCardless artefacts (filled in across the DD step + webhook)
  gocardless_redirect_flow_id VARCHAR(100),
  gocardless_customer_id VARCHAR(100),
  gocardless_mandate_id VARCHAR(100),
  gocardless_mandate_status VARCHAR(50),  -- pending_submission, submitted, active, cancelled, ...

  -- Set when admin approves and provisions the pharmacy
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  rejected_reason TEXT,

  -- Token used by the new owner to set their password (single-use, expiring).
  -- Stored as bcrypt of the random token so leaked DB rows can't be replayed.
  setup_token_hash VARCHAR(255),
  setup_token_expires_at TIMESTAMP,
  setup_token_used_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_requests (status);
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_requests (contact_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_created ON onboarding_requests (created_at DESC);
