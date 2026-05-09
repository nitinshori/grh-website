/**
 * Single source of truth for password requirements. Imported by every
 * endpoint that creates or updates a password (admin user create/update,
 * change-password, setup-account). Keep these rules consistent so we don't
 * accidentally accept a weaker password through one path.
 */

export const MIN_LENGTH = 12
export const BCRYPT_COST = 12

export interface PasswordValidation {
  ok: boolean
  errors: string[]
}

/**
 * NIST SP 800-63B-style sanity checks: length is the dominant factor;
 * complexity rules are weak signals so we keep them light.
 */
export function validatePassword(password: string, opts?: { allowShorterForLegacy?: boolean }): PasswordValidation {
  const errors: string[] = []
  const min = opts?.allowShorterForLegacy ? 8 : MIN_LENGTH
  if (typeof password !== 'string') return { ok: false, errors: ['Password is required'] }
  if (password.length < min) errors.push(`Password must be at least ${min} characters`)
  if (password.length > 200) errors.push('Password is too long')
  // At least 3 of: lowercase, uppercase, digit, special
  let classes = 0
  if (/[a-z]/.test(password)) classes++
  if (/[A-Z]/.test(password)) classes++
  if (/[0-9]/.test(password)) classes++
  if (/[^a-zA-Z0-9]/.test(password)) classes++
  if (classes < 3) errors.push('Password must contain a mix of upper case, lower case, numbers and symbols (3 of 4)')
  // Reject obvious common passwords (very short list — doesn't replace HIBP)
  const lower = password.toLowerCase()
  const banned = ['password', 'pharmacy', 'qwerty', 'letmein', '12345678', 'admin']
  if (banned.some((b) => lower.includes(b))) errors.push('Password contains a banned phrase. Choose something less guessable.')
  return { ok: errors.length === 0, errors }
}
