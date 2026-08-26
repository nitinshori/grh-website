-- 047: time-limited user accounts.
--
-- Nitin, 26 Aug 2026: Rakesh Patel at Bachu's Pharmacy wants to work
-- through a consultation himself before committing. He should get a login
-- that stops working at 8pm on 27 Aug, 24 hours after it is issued.
--
-- Until now the only lever was is_active, which someone has to remember to
-- switch off. Nobody remembers. An evaluation login that quietly stays
-- live for months is exactly the sort of thing that is discovered during
-- an audit rather than before one.
--
-- access_expires_at is checked on every authenticated request by the same
-- middleware that enforces is_active, so an expired account is signed out
-- within a minute of expiry rather than at next login. NULL means no
-- expiry, which is every existing account.
--
-- view_only marks an account as an evaluation account. It shows the whole
-- ePGD catalogue on the index so a prospect can see the range on offer,
-- while only the PGDs their pharmacy actually holds will open; the rest
-- render as inert cards. This is presentation, not a security boundary.
-- Real access is enforced per tool by PgdGate, and note that
-- /pgd-documents is currently served without authentication at all.
--
-- Idempotent: safe to re-run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS view_only BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN users.access_expires_at IS
  'Account stops working at this time. NULL means never expires. Enforced per-request in middleware alongside is_active.';

COMMENT ON COLUMN users.view_only IS
  'Evaluation account: shows the full ePGD catalogue with unheld PGDs rendered inert. Presentation only, not a security boundary.';
