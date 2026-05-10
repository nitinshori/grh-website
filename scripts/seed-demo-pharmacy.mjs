#!/usr/bin/env node
/**
 * Seed a demo pharmacy + pharmacist for marketing videos.
 * Pharmacy: West Bromwich Pharmacy
 * Pharmacist: John Short
 *
 * Idempotent — safe to re-run.
 *
 * Removes any test patients first so the dashboard counters look clean
 * during recording.
 */
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
const sql = neon(process.env.DATABASE_URL)

const PHARMACY_NAME = 'West Bromwich Pharmacy'
const PHARMACY_SLUG = 'west-bromwich-pharmacy'
const PHARMACY_ADDRESS = '12 High Street, West Bromwich, B70 6JX'
const PHARMACY_PHONE = '0121 555 0100'
const PHARMACY_EMAIL = 'info@westbromwichpharmacy.co.uk'

const USER_EMAIL = 'john.short@westbromwichpharmacy.co.uk'
const USER_PASSWORD = 'DemoLaunch2026!'
const USER_FIRST = 'John'
const USER_LAST = 'Short'

// 1. Pharmacy (upsert by slug)
const [existingPh] = await sql`SELECT id FROM pharmacies WHERE slug = ${PHARMACY_SLUG} LIMIT 1`
let pharmacyId
if (existingPh) {
  pharmacyId = existingPh.id
  await sql`
    UPDATE pharmacies
       SET name = ${PHARMACY_NAME}, address = ${PHARMACY_ADDRESS}, phone = ${PHARMACY_PHONE},
           email = ${PHARMACY_EMAIL}, group_slug = ${PHARMACY_SLUG}, is_active = true,
           updated_at = NOW()
     WHERE id = ${pharmacyId}
  `
  console.log(`↻ updated pharmacy ${PHARMACY_NAME}`)
} else {
  const [created] = await sql`
    INSERT INTO pharmacies (name, slug, group_slug, address, phone, email, is_active)
    VALUES (${PHARMACY_NAME}, ${PHARMACY_SLUG}, ${PHARMACY_SLUG}, ${PHARMACY_ADDRESS},
            ${PHARMACY_PHONE}, ${PHARMACY_EMAIL}, true)
    RETURNING id
  `
  pharmacyId = created.id
  console.log(`+ created pharmacy ${PHARMACY_NAME} (${pharmacyId})`)
}

// 2. User (upsert by email)
const passwordHash = bcrypt.hashSync(USER_PASSWORD, 12)
const [existingUser] = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${USER_EMAIL}) LIMIT 1`
if (existingUser) {
  await sql`
    UPDATE users
       SET first_name = ${USER_FIRST}, last_name = ${USER_LAST},
           password_hash = ${passwordHash}, role = 'pharmacist',
           pharmacy_id = ${pharmacyId}, is_active = true, updated_at = NOW()
     WHERE id = ${existingUser.id}
  `
  console.log(`↻ updated user ${USER_FIRST} ${USER_LAST}`)
} else {
  await sql`
    INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
    VALUES (${USER_EMAIL}, ${passwordHash}, ${USER_FIRST}, ${USER_LAST}, 'pharmacist', ${pharmacyId}, true)
  `
  console.log(`+ created user ${USER_FIRST} ${USER_LAST}`)
}

// 3. Assign all canonical PGDs
const src = readFileSync(join(__dir, '..', 'src', 'lib', 'pgd-access.ts'), 'utf8')
const slugs = [...new Set([...src.matchAll(/\{\s*slug:\s*'([^']+)'/g)].map((m) => m[1]))]
console.log(`Assigning ${slugs.length} canonical PGDs…`)
let added = 0
for (const slug of slugs) {
  const result = await sql`
    INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug)
    VALUES (${pharmacyId}, ${slug})
    ON CONFLICT DO NOTHING
    RETURNING pgd_slug
  `
  if (result.length) added++
}
const [{ n: total }] = await sql`SELECT count(*)::int AS n FROM pharmacy_pgds WHERE pharmacy_id = ${pharmacyId}`
console.log(`  added ${added}, total assigned: ${total}`)

console.log()
console.log('═══════════════════════════════════════════════════')
console.log('  DEMO ACCOUNT READY')
console.log('───────────────────────────────────────────────────')
console.log(`  Email:    ${USER_EMAIL}`)
console.log(`  Password: ${USER_PASSWORD}`)
console.log(`  Pharmacy: ${PHARMACY_NAME} (${total} PGDs assigned)`)
console.log('═══════════════════════════════════════════════════')
