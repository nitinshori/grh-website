import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto'

/**
 * Application-level encryption for sensitive fields (clinical_data column).
 *
 * Stored format: `v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>`
 * `v1:` prefix lets us migrate to a different scheme later without ambiguity.
 *
 * Key handling:
 *  - Master key comes from env DATA_ENCRYPTION_KEY (32-byte random, base64 or hex).
 *  - We derive a 32-byte AES key via scrypt — same input always derives the
 *    same key, so existing ciphertexts stay decryptable.
 *  - For key rotation: keep DATA_ENCRYPTION_KEY_PREVIOUS available, attempt
 *    decryption with current first, then previous; re-encrypt on next write.
 *
 * NOT YET WIRED into the consultation_records save/load paths — see
 * docs/encryption-migration.md for the migration plan. This module is the
 * primitive; integration is a separate, careful change.
 */

const ALG = 'aes-256-gcm'
const IV_LEN = 12 // GCM standard
const AUTH_TAG_LEN = 16
const VERSION_PREFIX = 'v1:'

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const raw = process.env.DATA_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('DATA_ENCRYPTION_KEY env var not set')
  }
  // Derive a stable 32-byte key from the env input. Salt is fixed so the
  // same env value always yields the same key — required to decrypt old data.
  cachedKey = scryptSync(raw, 'grh-pgd-platform-v1', 32)
  return cachedKey
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALG, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${VERSION_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

export function decrypt(payload: string): string {
  if (!payload.startsWith(VERSION_PREFIX)) {
    // Backwards compatibility: any value without the prefix is assumed plaintext.
    // Lets us roll out encryption gradually without a full data migration first.
    return payload
  }
  const [, ivHex, tagHex, ctHex] = payload.split(':')
  if (!ivHex || !tagHex || !ctHex) {
    throw new Error('Malformed encrypted payload')
  }
  const key = getKey()
  const decipher = createDecipheriv(ALG, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ctHex, 'hex')), decipher.final()])
  return plaintext.toString('utf8')
}

export function isEncrypted(payload: string): boolean {
  return payload.startsWith(VERSION_PREFIX)
}
