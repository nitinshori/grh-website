#!/usr/bin/env node

/**
 * One-shot cleanup:
 *   1. Hard-delete the 4 test consultation records I created during smoke
 *      testing (Sarah PeriodVerify, Test PatientForSmokeTest,
 *      Test MounjaroPatient, Test MeningitisPatient).
 *   2. Remove orphan pharmacy_pgds rows where the slug no longer exists in
 *      the canonical PGD list (src/lib/pgd-access.ts).
 *
 * Idempotent. Touches nothing else. Logs every action.
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const sql = neon(process.env.DATABASE_URL)

// ── 1. Test records ───────────────────────────────────────────
console.log('1. Test consultation records')

const testPatients = [
  { firstName: 'Sarah', lastName: 'PeriodVerify' },
  { firstName: 'Test', lastName: 'PatientForSmokeTest' },
  { firstName: 'Test', lastName: 'MounjaroPatient' },
  { firstName: 'Test', lastName: 'MeningitisPatient' },
  { firstName: 'Test', lastName: 'PPHPeriod' },
  { firstName: 'Test', lastName: 'EarPatient' },
  { firstName: 'Test', lastName: 'FluPatient' },
  { firstName: 'Test', lastName: 'MeningitisAM' },
  { firstName: 'Test', lastName: 'MeningitisFresh' },
  { firstName: 'Test', lastName: 'MeningitisVerify' },
  { firstName: 'Jane', lastName: 'MeningitisVerify' },
  { firstName: 'Test', lastName: 'UTITestMorning' },
]

let deletedRecords = 0
for (const p of testPatients) {
  const r = await sql`
    DELETE FROM consultation_records
    WHERE patient_first_name = ${p.firstName} AND patient_last_name = ${p.lastName}
    RETURNING id, pgd_slug, patient_first_name, patient_last_name
  `
  if (r.length > 0) {
    for (const row of r) {
      console.log(`  ✓ deleted ${row.patient_first_name} ${row.patient_last_name} (${row.pgd_slug})`)
      deletedRecords++
    }
  }
}
console.log(`  → ${deletedRecords} test record(s) removed`)

// Also clean up any audit log rows that reference now-deleted records
// (Optional — leaving the audit history intact is normally preferred for
// compliance, but for test data it's worth purging too. We keep them.)

// ── 2. Orphan PGD assignments ─────────────────────────────────
console.log('\n2. Orphan pharmacy_pgds rows')

const pgdAccessSrc = readFileSync(join(__dir, '..', 'src', 'lib', 'pgd-access.ts'), 'utf8')
const slugMatches = pgdAccessSrc.matchAll(/\{\s*slug:\s*'([^']+)'/g)
const validSlugs = new Set([...slugMatches].map((m) => m[1]))
console.log(`  Canonical slugs: ${validSlugs.size}`)

const allRows = await sql`SELECT pharmacy_id, pgd_slug FROM pharmacy_pgds`
const orphanRows = allRows.filter((r) => !validSlugs.has(r.pgd_slug))
console.log(`  Orphan rows across all pharmacies: ${orphanRows.length}`)

if (orphanRows.length > 0) {
  // Delete by slug (since orphans are slugs that no longer exist anywhere)
  const orphanSlugs = [...new Set(orphanRows.map((r) => r.pgd_slug))]
  console.log(`  Distinct orphan slugs:`, orphanSlugs)
  for (const slug of orphanSlugs) {
    const d = await sql`DELETE FROM pharmacy_pgds WHERE pgd_slug = ${slug} RETURNING pharmacy_id`
    console.log(`    ✓ removed ${d.length} row(s) for slug "${slug}"`)
  }
}

// ── 3. Final state ────────────────────────────────────────────
console.log('\n3. Final state')

const remainingRecords = await sql`SELECT count(*)::int AS n FROM consultation_records WHERE deleted_at IS NULL`
console.log(`  consultation_records (live): ${remainingRecords[0].n}`)

const moinCount = await sql`
  SELECT count(*)::int AS n FROM pharmacy_pgds pp
  JOIN pharmacies p ON p.id = pp.pharmacy_id
  WHERE p.slug = 'moins-chemist'
`
console.log(`  Moin's Chemist PGD assignments: ${moinCount[0].n}`)

const pphCount = await sql`
  SELECT count(*)::int AS n FROM pharmacy_pgds pp
  JOIN pharmacies p ON p.id = pp.pharmacy_id
  WHERE p.slug = 'pph'
`
console.log(`  Pharmacy Plus Health PGD assignments: ${pphCount[0].n}`)

console.log('\n✅ Done.')
