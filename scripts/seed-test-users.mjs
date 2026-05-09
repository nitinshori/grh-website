#!/usr/bin/env node
/**
 * Idempotent seed of two test pharmacist accounts — one in Moin's Chemist,
 * one in Pharmacy Plus Health. Used purely for end-to-end smoke testing
 * the changes from Moin's feedback batch.
 *
 * Credentials (BOTH):
 *   password: TestSmoke2026!
 *   GPhC:     QA1234 (fake)
 *
 * Emails:
 *   test-moins@grhpharmacy.test
 *   test-pph@grhpharmacy.test
 *
 * Re-running is safe — uses ON CONFLICT DO UPDATE to refresh the password
 * and keeps the pharmacy link intact.
 */
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const PASSWORD = 'TestSmoke2026!'
const passwordHash = await bcrypt.hash(PASSWORD, 10)

const TEST_USERS = [
  {
    email: 'test-moins@grhpharmacy.test',
    firstName: 'QA',
    lastName: 'Tester (Moins)',
    pharmacySlug: 'moins-chemist',
  },
  {
    email: 'test-pph@grhpharmacy.test',
    firstName: 'QA',
    lastName: 'Tester (PPH)',
    pharmacySlug: 'pph',
  },
]

for (const u of TEST_USERS) {
  const [pharmacy] = await sql`SELECT id, name FROM pharmacies WHERE slug = ${u.pharmacySlug} LIMIT 1`
  if (!pharmacy) {
    console.error(`✗ pharmacy slug "${u.pharmacySlug}" not found, skipping`)
    continue
  }

  // Upsert
  const [existing] = await sql`SELECT id FROM users WHERE email = ${u.email} LIMIT 1`

  if (existing) {
    await sql`
      UPDATE users
         SET password_hash = ${passwordHash},
             first_name = ${u.firstName},
             last_name = ${u.lastName},
             pharmacy_id = ${pharmacy.id},
             role = 'pharmacist',
             is_active = true,
             updated_at = NOW()
       WHERE id = ${existing.id}
    `
    console.log(`↻ refreshed ${u.email} → ${pharmacy.name}`)
  } else {
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
      VALUES (${u.email}, ${passwordHash}, ${u.firstName}, ${u.lastName}, 'pharmacist', ${pharmacy.id}, true)
    `
    console.log(`+ created ${u.email} → ${pharmacy.name}`)
  }
}

console.log()
console.log('All test users seeded. Login with:')
console.log(`  password: ${PASSWORD}`)
for (const u of TEST_USERS) console.log(`  ${u.email}`)
