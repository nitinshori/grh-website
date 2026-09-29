-- 069: multi-branch sign-up, per-branch billing, and scheduled fee changes.
--
-- Delmergate (29 Sep 2026): a four-branch group wanted one sign-up, one
-- Direct Debit, a first-year group rate and the standard rate from year two.
-- Until now every branch had to go through /onboard on its own, the fee was
-- typed once at approval and never recorded anywhere editable, and branches
-- could only be grouped by hand-written SQL.
--
-- Changes:
--   onboarding_requests.branches       extra branches captured by the wizard
--                                      (JSON array; the primary pharmacy stays
--                                      in the existing pharmacy_* columns)
--   onboarding_requests.group_name     optional trading name for the group
--   onboarding_requests.group_slug     the pharmacies.group_slug given to
--                                      every branch at approval
--   onboarding_requests.fee_change_*   the scheduled fee change agreed at
--                                      approval (applied to every branch)
--   pharmacy_subscriptions             one row per billed branch: mandate,
--                                      GoCardless subscription, current fee,
--                                      scheduled change. Editable from
--                                      /admin/billing; the daily cron applies
--                                      due changes.
--
-- Idempotent: safe to re-run.

-- Audit actions for the billing page and the fee-change cron. PG12+ allows
-- ADD VALUE inside a transaction as long as the value is not used in the
-- same transaction (the pattern migration 026 relies on).
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'billing_edited';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'billing_fee_change_applied';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'billing_subscription_retried';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'billing_cancelled';

ALTER TABLE onboarding_requests
  ADD COLUMN IF NOT EXISTS branches jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS group_name varchar(255),
  ADD COLUMN IF NOT EXISTS group_slug varchar(100),
  ADD COLUMN IF NOT EXISTS fee_change_pence integer,
  ADD COLUMN IF NOT EXISTS fee_change_on date,
  ADD COLUMN IF NOT EXISTS fee_note text;

CREATE TABLE IF NOT EXISTS pharmacy_subscriptions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id                 uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  onboarding_id               uuid REFERENCES onboarding_requests(id) ON DELETE SET NULL,
  gocardless_mandate_id       varchar(100),
  gocardless_subscription_id  varchar(100),
  subscription_error          text,
  monthly_fee_pence           integer NOT NULL,
  fee_change_pence            integer,
  fee_change_on               date,
  fee_change_applied_at       timestamptz,
  cancelled_at                timestamptz,
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pharmacy_subscriptions_pharmacy_idx
  ON pharmacy_subscriptions (pharmacy_id);

-- Backfill: every sign-up approved before this migration billed one branch
-- at the fee typed at approval. Give it a row so the billing page and the
-- MRR tile see the whole estate, not just new sign-ups.
INSERT INTO pharmacy_subscriptions
  (pharmacy_id, onboarding_id, gocardless_mandate_id, gocardless_subscription_id, monthly_fee_pence, notes)
SELECT DISTINCT ON (o.pharmacy_id)
       o.pharmacy_id, o.id, o.gocardless_mandate_id, o.gocardless_subscription_id, o.monthly_fee_pence,
       'Backfilled from onboarding request at migration 069'
FROM onboarding_requests o
WHERE o.pharmacy_id IS NOT NULL
  AND o.monthly_fee_pence IS NOT NULL
  AND o.status IN ('approved', 'completed')
ORDER BY o.pharmacy_id, o.approved_at DESC NULLS LAST, o.created_at DESC
ON CONFLICT (pharmacy_id) DO NOTHING;
