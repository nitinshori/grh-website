#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const sql = neon(process.env.DATABASE_URL)

const pgdAccessSrc = readFileSync(join(__dir, '..', 'src', 'lib', 'pgd-access.ts'), 'utf8')
const slugMatches = pgdAccessSrc.matchAll(/\{\s*slug:\s*'([^']+)'/g)
const validSlugs = new Set([...slugMatches].map((m) => m[1]))

console.log(`Canonical PGD slugs in source: ${validSlugs.size}`)

// All distinct pharmacy_pgds for Moin's
const [pharmacy] = await sql`SELECT id, name FROM pharmacies WHERE slug = 'moins-chemist' LIMIT 1`
const allRows = await sql`SELECT pgd_slug FROM pharmacy_pgds WHERE pharmacy_id = ${pharmacy.id}`
console.log(`Total pharmacy_pgds rows for ${pharmacy.name}: ${allRows.length}`)

// Find orphans
const counts = {}
for (const r of allRows) counts[r.pgd_slug] = (counts[r.pgd_slug] || 0) + 1

const orphans = Object.entries(counts).filter(([slug]) => !validSlugs.has(slug))
const dupes = Object.entries(counts).filter(([, n]) => n > 1)

console.log(`\nOrphan slugs (no longer in source): ${orphans.length}`)
for (const [slug, n] of orphans) console.log(`  • ${slug}${n > 1 ? ` (×${n})` : ''}`)

console.log(`\nDuplicate rows (same slug, multiple rows): ${dupes.length}`)
for (const [slug, n] of dupes) console.log(`  • ${slug} ×${n}`)
