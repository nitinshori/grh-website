import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'

// Shared access-control helpers for the Pharmacy Plus Health resource hub.
//
// The hub is gated by a shared *access password* for HCPs (no individual
// login), and managed by a separate *admin key*. Historically the gate was
// enforced only in the browser, so the underlying API routes were open to
// anyone who called them directly. These helpers move enforcement server-side:
//
//   - verify-access issues a short-lived, HMAC-signed HTTP-only cookie
//   - resources/download require either that cookie OR a valid admin key
//   - upload/delete require a valid admin key (constant-time comparison)

export const ACCESS_COOKIE = 'pph_access'
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

function signingKey(): string {
  // Dedicated secret if provided, else fall back to the always-present
  // NextAuth secret. Never a hardcoded default — fail closed if neither set.
  const key = process.env.PHARMACY_PLUS_COOKIE_SECRET || process.env.NEXTAUTH_SECRET
  if (!key) {
    throw new Error(
      'pharmacy-plus-access: no signing secret (set PHARMACY_PLUS_COOKIE_SECRET or NEXTAUTH_SECRET)'
    )
  }
  return key
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** Issue a signed access token to store in the gate cookie. */
export function issueAccessToken(): string {
  const exp = Date.now() + ACCESS_COOKIE_MAX_AGE * 1000
  const nonce = randomBytes(9).toString('base64url')
  const payload = `${exp}.${nonce}`
  const sig = createHmac('sha256', signingKey()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/** Verify a gate cookie token: signature valid AND not expired. */
export function verifyAccessToken(token: string | undefined | null): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [exp, nonce, sig] = parts
  const payload = `${exp}.${nonce}`
  const expected = createHmac('sha256', signingKey()).update(payload).digest('base64url')
  if (!safeEqual(sig, expected)) return false
  const expMs = Number(exp)
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false
  return true
}

/** Constant-time check of the admin management key. Fails closed if unset. */
export function verifyAdminKey(provided: string | null | undefined): boolean {
  const expected = process.env.PHARMACY_PLUS_ADMIN_PASSWORD
  if (!expected || !provided) return false
  return safeEqual(provided, expected)
}

/** Constant-time check of the shared HCP access password. Fails closed if unset. */
export function verifyAccessPassword(provided: string | null | undefined): boolean {
  const expected = process.env.PHARMACY_PLUS_ACCESS_PASSWORD
  if (!expected || !provided) return false
  return safeEqual(provided, expected)
}

/** True if the request is allowed to read resources / download files. */
export function isResourceReadAuthorised(request: NextRequest): boolean {
  if (verifyAdminKey(request.headers.get('x-admin-key'))) return true
  return verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value)
}
