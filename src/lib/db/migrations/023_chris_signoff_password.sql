-- 023: set Chris Pilkington's clinical-reviewer login password to a known
-- value (bcrypt hash of 'Chris2026', cost 12) without needing a live admin
-- session. Runs once at build time. Chris should change it on first login.
-- Also ensures the account is active.

UPDATE users
   SET password_hash = '$2b$12$8WYl5gccF6qaPpnp74/b8.iz9EzTQ6ckgQtmbWWggW1dKutdcuemy',
       is_active = true,
       updated_at = now()
 WHERE lower(email) = 'chris@getrealhealthpgd.co.uk';
