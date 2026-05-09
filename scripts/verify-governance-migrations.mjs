#!/usr/bin/env node

/**
 * Properly checks what's actually in the DB by using tagged-template SQL
 * (which Neon's serverless client always executes) rather than .unsafe()
 * (which can silently build a fragment without executing).
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1) }

const sql = neon(DATABASE_URL)

async function check(label, fn) {
  try {
    const result = await fn()
    console.log(`✓ ${label}:`, JSON.stringify(result))
  } catch (err) {
    console.log(`✗ ${label}: ${err.message || err}`)
  }
}

console.log('\n=== Governance migrations — actual DB state ===\n')

await check('audit_logs table', async () => {
  const r = await sql`SELECT to_regclass('audit_logs')::text AS exists`
  return r[0]
})

await check('audit_action enum', async () => {
  const r = await sql`SELECT typname FROM pg_type WHERE typname = 'audit_action'`
  return r.length > 0 ? 'exists' : 'MISSING'
})

await check('consultation_records.deleted_at column', async () => {
  const r = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'consultation_records' AND column_name = 'deleted_at'`
  return r[0] || 'MISSING'
})

await check('consultation_records.deleted_by column', async () => {
  const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'consultation_records' AND column_name = 'deleted_by'`
  return r[0] || 'MISSING'
})

await check('consultation_records.deleted_reason column', async () => {
  const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'consultation_records' AND column_name = 'deleted_reason'`
  return r[0] || 'MISSING'
})

await check('users.totp_secret column', async () => {
  const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'totp_secret'`
  return r[0] || 'MISSING'
})

await check('users.totp_enabled column', async () => {
  const r = await sql`SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'totp_enabled'`
  return r[0] || 'MISSING'
})

await check('users.totp_backup_codes column', async () => {
  const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'totp_backup_codes'`
  return r[0] || 'MISSING'
})

await check('idx_consultation_records_deleted_at', async () => {
  const r = await sql`SELECT indexname FROM pg_indexes WHERE indexname = 'idx_consultation_records_deleted_at'`
  return r[0] || 'MISSING'
})

await check('idx_audit_logs_pharmacy_created', async () => {
  const r = await sql`SELECT indexname FROM pg_indexes WHERE indexname = 'idx_audit_logs_pharmacy_created'`
  return r[0] || 'MISSING'
})

console.log('\n=== Done ===\n')
