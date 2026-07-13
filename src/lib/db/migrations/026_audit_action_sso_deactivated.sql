-- 026: new audit action for the SSO deactivation webhook
-- (POST /api/sso/deactivate — see GRH ↔ HubRx SSO Integration Spec).
-- PG12+ allows ADD VALUE inside a transaction as long as the new value
-- isn't used within the same transaction, which it isn't here.

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'sso_user_deactivated';
