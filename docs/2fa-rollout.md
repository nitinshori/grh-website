# Two-factor authentication — rollout plan

Schema and intent are in place; finishing the rollout is a focused 1–2 day job.

## What's already done

- `users.totp_secret`, `users.totp_enabled`, `users.totp_backup_codes` columns
  added (migration 007).
- DPIA explicitly mentions 2FA as a planned mitigation against credential
  compromise.

## Outstanding work

### 1. Library
Add `otplib` (or similar) and `qrcode` for generating the QR.
```
npm install otplib qrcode
npm install --save-dev @types/qrcode
```

### 2. API routes
- `POST /api/me/2fa/setup` — generates a TOTP secret, returns the otpauth URI
  and a QR code PNG. Does **not** enable 2FA yet.
- `POST /api/me/2fa/verify` — accepts a 6-digit code from the user's
  authenticator. If valid, sets `totp_enabled = true`, generates and returns
  10 one-use backup codes (bcrypt-hashed for storage).
- `POST /api/me/2fa/disable` — disables 2FA after re-verifying the user's
  password.

### 3. UI
- New section on the existing `/dashboard/account` page: "Two-factor
  authentication". Shows the current state (enabled / not), a "Set up" button
  that walks through the QR code → verify → backup codes flow.

### 4. NextAuth integration
Two-step login. After password validation, if `totp_enabled` is true:
- Set a partial session cookie indicating "awaiting TOTP".
- Redirect to `/login/2fa`.
- That page accepts the 6-digit code; if valid, completes the session.

The cleanest way is a custom Credentials provider step or signing the JWT
twice. There are NextAuth examples for this pattern.

### 5. Backup codes
- Generate 10 codes at setup (cryptographically random, displayed once).
- Hash each with bcrypt before storing as JSON array in `totp_backup_codes`.
- On login, accept either a TOTP code or a backup code. Mark used backup
  codes as consumed (e.g., delete from array).

### 6. Rollout strategy
- Optional for all users initially.
- After 30 days, enforce for `pharmacy_admin` and `super_admin` roles.
- After 90 days, enforce for all `pharmacist` users.
- Pharmacy admins get a per-user toggle to enforce 2FA across their pharmacy
  earlier if desired.

## Risk: lockout
Backup codes mitigate phone-loss; a `super_admin`-only "reset 2FA" workflow
should also exist for genuine lockouts. Audit log every reset.
