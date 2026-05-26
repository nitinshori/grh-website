-- Per-pharmacy PGD document overrides.
--
-- The GRH master PGD PDFs live in /public/pgd-documents/<slug>.pdf and are
-- shipped with the build. For customers like Pharmacy Plus Health who have
-- requested changes to specific PGDs and have their own clinical signatories
-- (Janey Tipping + Sarah Passmore in their case), we store a per-pharmacy
-- override here. The override is uploaded to Vercel Blob and referenced by URL.
--
-- Resolution at download time:
--   1. Is there a row in pharmacy_pgd_documents for (pharmacyId, pgdSlug) with
--      is_current=true? Use that URL.
--   2. Otherwise fall back to /pgd-documents/<slug>.pdf from /public.
--
-- The clinical engine (eligibility checks, dose calculators) in the ePGD tool
-- remains canonical for ALL customers — only the downloadable signed PDF is
-- per-pharmacy.

CREATE TABLE IF NOT EXISTS pharmacy_pgd_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  pgd_slug VARCHAR(255) NOT NULL,
  -- Vercel Blob (or any) URL
  document_url TEXT NOT NULL,
  filename VARCHAR(500),
  file_size_bytes INTEGER,
  -- Optional metadata captured at upload
  version INTEGER NOT NULL DEFAULT 1,
  signed_by_names TEXT,   -- e.g. "Janey Tipping, Sarah Passmore"
  notes TEXT,
  is_current BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- One "current" row per (pharmacy, slug) — uploading a new version
-- flips the previous current to is_current=false in the same transaction.
CREATE UNIQUE INDEX IF NOT EXISTS pharmacy_pgd_documents_current_unique
  ON pharmacy_pgd_documents (pharmacy_id, pgd_slug)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS pharmacy_pgd_documents_pharmacy_slug_idx
  ON pharmacy_pgd_documents (pharmacy_id, pgd_slug);
