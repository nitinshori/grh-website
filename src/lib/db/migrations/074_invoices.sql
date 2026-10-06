-- 074: monthly invoices per branch (6 Oct 2026)
--
-- Why: pharmacies on GoCardless only ever received GoCardless's own payment
-- notifications, which are not invoices (My Local Chemist asked where the
-- invoices were, 5 Oct 2026), and pharmacies not on GoCardless at all
-- (Smartway) had no bill of any kind.
--
-- What:
--   pharmacy_subscriptions.billing_method   'direct_debit' (GoCardless) or
--                                           'bank_transfer' (invoice, 14 days)
--   pharmacy_subscriptions.billing_*        who the invoice is addressed to,
--                                           when set; otherwise the pharmacy
--   pharmacy_subscriptions.invoice_from     first month to invoice
--   invoices                                one row per branch per month,
--                                           numbered GRH-<n> from a sequence,
--                                           never deleted (void instead)
--
-- Get Real Health Limited is not VAT registered (Nitin, 6 Oct 2026): no VAT
-- line anywhere. Idempotent: safe to re-run.

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invoice_issued';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'invoice_updated';

ALTER TABLE pharmacy_subscriptions
  ADD COLUMN IF NOT EXISTS billing_method  varchar(20) NOT NULL DEFAULT 'direct_debit',
  ADD COLUMN IF NOT EXISTS billing_name    varchar(255),
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS billing_email   varchar(255),
  ADD COLUMN IF NOT EXISTS invoice_from    date;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

CREATE TABLE IF NOT EXISTS invoices (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number       varchar(20) NOT NULL UNIQUE,
  pharmacy_id          uuid NOT NULL REFERENCES pharmacies(id) ON DELETE RESTRICT,
  subscription_row_id  uuid REFERENCES pharmacy_subscriptions(id) ON DELETE SET NULL,
  bill_to_name         varchar(255) NOT NULL,
  bill_to_address      text,
  bill_to_email        varchar(255),
  period_start         date NOT NULL,
  period_end           date NOT NULL,
  issued_on            date NOT NULL,
  due_on               date NOT NULL,
  description          text NOT NULL,
  amount_pence         integer NOT NULL CHECK (amount_pence >= 0),
  payment_method       varchar(20) NOT NULL CHECK (payment_method IN ('direct_debit', 'bank_transfer')),
  status               varchar(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'void')),
  paid_at              timestamptz,
  paid_note            text,
  gocardless_payment_id varchar(100),
  emailed_at           timestamptz,
  emailed_to           varchar(255),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- One live invoice per branch per month; a voided one may be re-issued.
CREATE UNIQUE INDEX IF NOT EXISTS invoices_pharmacy_period_live
  ON invoices (pharmacy_id, period_start) WHERE status <> 'void';
CREATE INDEX IF NOT EXISTS invoices_pharmacy_idx ON invoices (pharmacy_id, period_start DESC);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status, due_on);
