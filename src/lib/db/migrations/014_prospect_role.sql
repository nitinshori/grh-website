-- 014_prospect_role.sql
-- Adds 'prospect' to the user_role enum.
--
-- Prospects can browse the platform — dashboard, ePGD consultation
-- tools, training previews — but cannot download the signed PGD
-- documents (handled in the UI components by checking session.role).
--
-- Used for interested pharmacies evaluating the product, e.g. Syed at
-- iPharmac and a shared demo account for sales walkthroughs.
--
-- ALTER TYPE ... ADD VALUE is idempotent via IF NOT EXISTS (PG 9.6+).

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'prospect';
