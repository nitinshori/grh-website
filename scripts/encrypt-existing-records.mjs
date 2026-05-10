#!/usr/bin/env node
/**
 * One-shot migration: walks every consultation_records row, encrypts any
 * clinical_data that is currently plaintext, and writes it back. Idempotent
 * — rows already encrypted (prefix "v1:") are skipped.
 *
 * Safe to run with the app live. Encryption is row-by-row in small batches.
 *
 *   DATA_ENCRYPTION_KEY=... node scripts/encrypt-existing-records.mjs
 *
 * Set DRY_RUN=1 to count + audit without writing.
 */
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { randomBytes, createCipheriv, scryptSync } from 'crypto'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

if (!process.env.DATA_ENCRYPTION_KEY) {
  console.error('❌ DATA_ENCRYPTION_KEY env var must be set (use the same value as Vercel).')
  console.error('   Look it up:  npx -y vercel@latest env pull .env.production.local')
  process.exit(1)
}
const DRY_RUN = process.env.DRY_RUN === '1'
const KEY = scryptSync(process.env.DATA_ENCRYPTION_KEY, 'grh-pgd-platform-v1', 32)

function encrypt(plaintext) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', KEY, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`
}

const ALL = await sql`
  SELECT id, clinical_data
    FROM consultation_records
   WHERE deleted_at IS NULL
`
console.log(`Inspecting ${ALL.length} live consultation records…`)

let already = 0
let toEncrypt = []
for (const row of ALL) {
  if (typeof row.clinical_data === 'string' && row.clinical_data.startsWith('v1:')) {
    already++
  } else {
    toEncrypt.push(row)
  }
}

console.log(`  already encrypted: ${already}`)
console.log(`  plaintext (will encrypt): ${toEncrypt.length}`)

if (DRY_RUN) {
  console.log('\nDRY_RUN=1 — no rows written.')
  process.exit(0)
}

let done = 0
const batchSize = 25
for (let i = 0; i < toEncrypt.length; i += batchSize) {
  const batch = toEncrypt.slice(i, i + batchSize)
  await Promise.all(batch.map(async (row) => {
    const cipherText = encrypt(row.clinical_data)
    await sql`UPDATE consultation_records SET clinical_data = ${cipherText} WHERE id = ${row.id}`
  }))
  done += batch.length
  process.stdout.write(`\r  encrypting… ${done}/${toEncrypt.length}`)
}
process.stdout.write('\n')
console.log(`✅ Encrypted ${done} row(s). ${already} were already encrypted.`)
