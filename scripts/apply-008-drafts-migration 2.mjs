#!/usr/bin/env node
/**
 * Apply 008_consultation_drafts.sql to the production DB.
 * Idempotent (uses CREATE TABLE IF NOT EXISTS).
 */
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const migration = readFileSync(
  join(__dir, '..', 'src', 'lib', 'db', 'migrations', '008_consultation_drafts.sql'),
  'utf8'
)

console.log('Applying 008_consultation_drafts.sql to:', process.env.DATABASE_URL.match(/@([^/:]+)/)?.[1])
console.log()

// Split on semicolon-newline (drizzle-style migrations) so each statement runs
// individually (Neon serverless doesn't support multi-statement queries).
const statements = migration
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

for (const stmt of statements) {
  try {
    await sql.query(stmt + ';')
    console.log('  ✓', stmt.split('\n')[0].slice(0, 80))
  } catch (e) {
    console.error('  ✗', stmt.split('\n')[0].slice(0, 80))
    console.error('    ', e.message)
    process.exit(1)
  }
}

// Verify the table exists
const r = await sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name='consultation_drafts'`
console.log()
console.log(r[0].n === 1 ? '✅ consultation_drafts table is present.' : '⚠️  Table not found after migration!')
