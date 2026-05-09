#!/usr/bin/env node
/**
 * Generic version of assign-all-pgds-to-moins.mjs — takes a pharmacy slug
 * as the first CLI arg and assigns the full canonical PGD list to it.
 * Idempotent.
 *
 * Usage:  node scripts/assign-all-pgds-to-pharmacy.mjs <pharmacy-slug>
 *   e.g.  node scripts/assign-all-pgds-to-pharmacy.mjs pph
 */
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const targetSlug = process.argv[2]
if (!targetSlug) {
  console.error('Usage: node scripts/assign-all-pgds-to-pharmacy.mjs <pharmacy-slug>')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

const pgdAccessSrc = readFileSync(join(__dir, '..', 'src', 'lib', 'pgd-access.ts'), 'utf8')
const slugMatches = pgdAccessSrc.matchAll(/\{\s*slug:\s*'([^']+)'/g)
const allSlugs = [...new Set([...slugMatches].map((m) => m[1]))]
console.log(`Found ${allSlugs.length} canonical PGD slugs.`)

const [pharmacy] = await sql`SELECT id, name FROM pharmacies WHERE slug = ${targetSlug} LIMIT 1`
if (!pharmacy) {
  console.error(`Pharmacy with slug "${targetSlug}" not found.`)
  process.exit(1)
}
console.log(`Pharmacy: ${pharmacy.name} (${pharmacy.id})`)

const existing = await sql`SELECT pgd_slug FROM pharmacy_pgds WHERE pharmacy_id = ${pharmacy.id}`
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
    await sql`INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug) VALUES (${pharmacy.id}, ${slug}) ON CONFLICT DO NOTHING`
    added++
  } catch (err) {
    console.error(`  ✗ ${slug}: ${err.message || err}`)
  }
}
console.log(`\n✅ Added ${added} of ${toAdd.length} new PGD assignments.`)

const finalCount = await sql`SELECT count(*)::int AS n FROM pharmacy_pgds WHERE pharmacy_id = ${pharmacy.id}`
console.log(`${pharmacy.name} total assignments now: ${finalCount[0].n}`)
