#!/usr/bin/env node

/**
 * Runs migrations 006 and 007 against the production Neon DB.
 *
 * Both are additive-only:
 *   - 006: nullable columns on consultation_records, audit_action enum,
 *     audit_logs table.
 *   - 007: nullable TOTP columns on users.
 *
 * Existing production code keeps working unchanged because it doesn't
 * reference any of the new columns or tables.
 *
 * Why each statement is its own tagged template literal: the
 * @neondatabase/serverless `sql.unsafe(text)` helper returns a fragment that
 * only executes when interpolated into a tagged template — passing it to
 * `await` directly is a no-op. Tagged templates always execute, so each
 * statement is hardcoded.
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

async function step(label, fn) {
  try {
    await fn()
    console.log(`  ✓ ${label}`)
  } catch (err) {
    const msg = err.message || String(err)
    if (/already exists|duplicate/i.test(msg)) {
      console.log(`  ⊙ ${label} — already exists, skipping`)
    } else {
      console.error(`  ✗ ${label}\n    ${msg}`)
      throw err
    }
  }
}

async function run() {
  console.log('\n▶ Migration 006 — audit log + soft-delete')

  await step('ALTER consultation_records ADD deleted_at', () =>
    sql`ALTER TABLE consultation_records ADD COLUMN IF NOT EXISTS deleted_at timestamp`)

  await step('ALTER consultation_records ADD deleted_by', () =>
    sql`ALTER TABLE consultation_records ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id) ON DELETE SET NULL`)

  await step('ALTER consultation_records ADD deleted_reason', () =>
    sql`ALTER TABLE consultation_records ADD COLUMN IF NOT EXISTS deleted_reason varchar(255)`)

  await step('CREATE INDEX idx_consultation_records_deleted_at', () =>
    sql`CREATE INDEX IF NOT EXISTS idx_consultation_records_deleted_at ON consultation_records (deleted_at) WHERE deleted_at IS NULL`)

  await step('CREATE TYPE audit_action', async () => {
    // pg doesn't support CREATE TYPE IF NOT EXISTS, so try and swallow if duplicate
    try {
      await sql`CREATE TYPE audit_action AS ENUM (
        'record_create',
        'record_view',
        'record_list',
        'record_export',
        'record_soft_delete',
        'record_purge',
        'login',
        'login_failed',
        'logout',
        'password_change'
      )`
    } catch (err) {
      if (!/already exists|duplicate/i.test(err.message || '')) throw err
    }
  })

  await step('CREATE TABLE audit_logs', () =>
    sql`CREATE TABLE IF NOT EXISTS audit_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE SET NULL,
      user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      user_email varchar(255),
      action audit_action NOT NULL,
      record_id uuid,
      record_count integer,
      details text,
      ip_address varchar(64),
      user_agent text,
      created_at timestamp DEFAULT now() NOT NULL
    )`)

  await step('CREATE INDEX idx_audit_logs_pharmacy_created', () =>
    sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_pharmacy_created ON audit_logs (pharmacy_id, created_at DESC)`)

  await step('CREATE INDEX idx_audit_logs_user_created', () =>
    sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs (user_id, created_at DESC)`)

  await step('CREATE INDEX idx_audit_logs_record_created', () =>
    sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_record_created ON audit_logs (record_id, created_at DESC) WHERE record_id IS NOT NULL`)

  await step('CREATE INDEX idx_audit_logs_action_created', () =>
    sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs (action, created_at DESC)`)

  console.log('\n▶ Migration 007 — 2FA columns')

  await step('ALTER users ADD totp_secret', () =>
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret varchar(64)`)

  await step('ALTER users ADD totp_enabled', () =>
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled boolean DEFAULT false NOT NULL`)

  await step('ALTER users ADD totp_backup_codes', () =>
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_backup_codes text`)

  console.log('\n✅ All migrations applied. Verifying...')

  const verify = async (label, fn) => {
    const r = await fn()
    const ok = r && JSON.stringify(r) !== '"MISSING"' && r !== null
    console.log(`  ${ok ? '✓' : '✗'} ${label}: ${JSON.stringify(r)}`)
  }

  await verify('audit_logs table', async () => {
    const r = await sql`SELECT to_regclass('audit_logs')::text AS exists`
    return r[0]?.exists
  })

  await verify('audit_action enum', async () => {
    const r = await sql`SELECT typname FROM pg_type WHERE typname = 'audit_action'`
    return r[0]?.typname || 'MISSING'
  })

  await verify('consultation_records.deleted_at', async () => {
    const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'consultation_records' AND column_name = 'deleted_at'`
    return r[0]?.column_name || 'MISSING'
  })

  await verify('users.totp_enabled', async () => {
    const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'totp_enabled'`
    return r[0]?.column_name || 'MISSING'
  })

  console.log('\n🎉 Done.')
}

run().catch((err) => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})
