#!/usr/bin/env node

/**
 * One-shot migration: copies the existing Neon DB (us-east-1) to a new Neon DB
 * (eu-west-2) for UK GDPR data residency.
 *
 * What it does:
 *   1. Verifies both DATABASE_URL (source) and DATABASE_URL_NEW (target)
 *      are present and reachable.
 *   2. Verifies the target is in a UK/EU region (won't proceed otherwise).
 *   3. Verifies the target is empty (won't overwrite existing data).
 *   4. Captures source row counts for the tables we care about.
 *   5. Runs pg_dump (schema + data) → pipes through psql into target.
 *   6. Verifies target row counts match source.
 *
 * Does NOT change Vercel env vars. The cutover (Vercel + redeploy) is a
 * separate step you do once this confirms success.
 *
 * Run:  node scripts/migrate-db-to-uk.mjs
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { spawnSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const OLD = process.env.DATABASE_URL
const NEW = process.env.DATABASE_URL_NEW
if (!OLD) { console.error('❌ DATABASE_URL missing'); process.exit(1) }
if (!NEW) { console.error('❌ DATABASE_URL_NEW missing — add it to .env.local first'); process.exit(1) }
if (OLD === NEW) { console.error('❌ source and target are identical'); process.exit(1) }

// ── Region check on the target ──────────────────────────────
const newHost = NEW.match(/@([^/:]+)/)?.[1]
const newRegion = newHost?.match(/\.([a-z]{2}-[a-z]+-\d+)\./)?.[1]
console.log(`Target host:   ${newHost}`)
console.log(`Target region: ${newRegion}`)
if (!newRegion || !/^eu-/.test(newRegion)) {
  console.error('❌ Target is not in an EU region. Aborting to prevent moving PHI to non-EU.')
  process.exit(1)
}
console.log('✅ Target is UK/EU.\n')

const oldDb = neon(OLD)
const newDb = neon(NEW)

// ── Pre-flight ───────────────────────────────────────────────
console.log('Pre-flight checks...')

// Source reachable
const srcVer = await oldDb`SELECT version()`
console.log(`  source online: ${srcVer[0].version.split(' ')[0]} ${srcVer[0].version.match(/PostgreSQL \d+\.\d+/)?.[0]}`)

// Target reachable + empty
const tgtTables = await newDb`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`
console.log(`  target online: ${tgtTables[0].n} table(s) currently in target public schema`)
if (tgtTables[0].n > 0) {
  console.error('❌ Target has tables already. Use a fresh empty database. Aborting.')
  process.exit(1)
}
console.log('✅ Target is empty.\n')

// ── Source row counts ────────────────────────────────────────
async function countRows(db, label) {
  const tables = ['pharmacies', 'users', 'pharmacy_pgds', 'clinicians', 'audit_logs', 'consultation_records', 'pgd_consultations', 'voice_calls', 'appointment_types', 'clinician_availability', 'appointments']
  const counts = {}
  for (const t of tables) {
    try {
      // Validate table exists first to avoid errors
      const exists = await db`SELECT to_regclass(${t})::text AS r`
      if (!exists[0].r) { counts[t] = 'missing'; continue }
      const r = await db.query(`SELECT count(*)::int AS n FROM ${t}`)
      counts[t] = (r[0] || r.rows?.[0])?.n ?? '?'
    } catch (err) {
      counts[t] = `err: ${err.message?.split('\n')[0]}`
    }
  }
  console.log(`${label}:`)
  for (const [t, n] of Object.entries(counts)) console.log(`  ${t}: ${n}`)
  return counts
}

const sourceCounts = await countRows(oldDb, 'Source counts (us-east-1)')
console.log()

// ── Run pg_dump | psql ───────────────────────────────────────
console.log('Running pg_dump → psql ...\n')

const dumpArgs = [
  OLD,
  '--no-owner',
  '--no-acl',
  '--no-publications',
  '--no-subscriptions',
]
// Verify pg_dump version >= server version BEFORE running
const dumpVer = spawnSync('pg_dump', ['--version'], { encoding: 'utf8' })
const dumpVerStr = (dumpVer.stdout || '').match(/\d+\.\d+/)?.[0]
const serverVerStr = srcVer[0].version.match(/PostgreSQL (\d+\.\d+)/)?.[1]
if (dumpVerStr && serverVerStr) {
  const [dMaj] = dumpVerStr.split('.').map(Number)
  const [sMaj] = serverVerStr.split('.').map(Number)
  console.log(`pg_dump ${dumpVerStr}, server ${serverVerStr}`)
  if (dMaj < sMaj) {
    console.error(`❌ pg_dump (v${dumpVerStr}) is older than the server (v${serverVerStr}).`)
    console.error('   Install a newer client:  brew install postgresql@17')
    console.error('   Then re-run with:        export PATH="$(brew --prefix postgresql@17)/bin:$PATH"')
    process.exit(1)
  }
}

// Use set -o pipefail so a pg_dump failure surfaces as a non-zero exit
const result = spawnSync('bash', [
  '-c',
  `set -o pipefail; pg_dump "${OLD}" --no-owner --no-acl --no-publications --no-subscriptions | psql -v ON_ERROR_STOP=1 "${NEW}"`,
], { stdio: ['ignore', 'inherit', 'inherit'] })

if (result.status !== 0) {
  console.error(`\n❌ pg_dump | psql exited with code ${result.status}`)
  process.exit(1)
}

console.log('\n✅ Dump+restore completed.\n')

// ── Verify target ────────────────────────────────────────────
const targetCounts = await countRows(newDb, 'Target counts (eu-west-2)')
console.log()

const mismatches = Object.keys(sourceCounts).filter((t) => sourceCounts[t] !== targetCounts[t])
if (mismatches.length > 0) {
  console.warn('⚠️  Row counts differ for:')
  for (const t of mismatches) console.warn(`  ${t}: source=${sourceCounts[t]}, target=${targetCounts[t]}`)
  process.exit(2)
}

console.log('✅ All row counts match.\n')
console.log('Next steps:')
console.log('  1. In Vercel → Settings → Environment Variables, update DATABASE_URL')
console.log('     for Production, Preview, and Development to the new eu-west-2 URL.')
console.log('  2. Trigger a redeploy (or push any commit; Vercel will auto-deploy).')
console.log('  3. Verify Moin\'s site loads.')
console.log('  4. Keep the old us-east-1 project around for 7 days as a safety net,')
console.log('     then delete it from Neon console.')
