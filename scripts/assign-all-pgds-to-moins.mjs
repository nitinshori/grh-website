#!/usr/bin/env node

/**
 * Assigns the full PGD catalogue to Moin's Chemist (currently has 22 of 67).
 * Idempotent — only inserts the missing rows. Existing assignments are
 * untouched. No data is removed.
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1) }
const sql = neon(DATABASE_URL)

// Pull the canonical PGD slug list directly from the source code so we never
// drift from what `ALL_PGDS` exposes to the rest of the app.
const pgdAccessSrc = readFileSync(join(__dir, '..', 'src', 'lib', 'pgd-access.ts'), 'utf8')
const slugMatches = pgdAccessSrc.matchAll(/\{\s*slug:\s*'([^']+)'/g)
const allSlugs = [...new Set([...slugMatches].map((m) => m[1]))]
console.log(`Found ${allSlugs.length} PGD slugs in src/lib/pgd-access.ts`)

const [pharmacy] = await sql`
  SELECT id, name FROM pharmacies WHERE slug = 'moins-chemist' LIMIT 1
`
if (!pharmacy) {
  console.error("Moin's Chemist pharmacy not found")
  process.exit(1)
}
console.log(`Pharmacy: ${pharmacy.name} (${pharmacy.id})`)

const existing = await sql`
  SELECT pgd_slug FROM pharmacy_pgds WHERE pharmacy_id = ${pharmacy.id}
`
const existingSet = new Set(existing.map((r) => r.pgd_slug))
console.log(`Already assigned: ${existingSet.size}`)

const toAdd = allSlugs.filter((s) => !existingSet.has(s))
console.log(`To add: ${toAdd.length}`)

if (toAdd.length === 0) {
  console.log('Nothing to do.')
  process.exit(0)
}

let added = 0
for (const slug of toAdd) {
  try {
    await sql`
      INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug)
      VALUES (${pharmacy.id}, ${slug})
      ON CONFLICT DO NOTHING
    `
    added++
  } catch (err) {
    console.error(`  ✗ ${slug}: ${err.message || err}`)
  }
}

console.log(`\n✅ Added ${added} of ${toAdd.length} new PGD assignments.`)

const finalCount = await sql`
  SELECT count(*)::int AS n FROM pharmacy_pgds WHERE pharmacy_id = ${pharmacy.id}
`
console.log(`Moin's Chemist total assignments now: ${finalCount[0].n}`)
