#!/usr/bin/env node
// Seeds prospect (preview) accounts for interested pharmacies.
// Creates a shared "Demo Pharmacy" with a broad PGD assignment, then:
//   1. Syed Ali Raza Naqvi (iPharmac) — alinaqvi@5hnw.co.uk
//   2. Generic demo login — demo@getrealhealthpgd.co.uk
// Both can browse the platform but cannot download PGDs (gated by role).

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const sql = neon(process.env.DATABASE_URL)

const DEMO_PHARMACY_NAME = 'GRH Demo Pharmacy'
const DEMO_PHARMACY_EMAIL = 'demo@getrealhealthpgd.co.uk'

const SYED_PASSWORD = 'iPharmac2026!'
const DEMO_PASSWORD = 'GrhDemo2026!'

// PGD slugs to assign to the demo pharmacy — broad but tightly curated set
// that gives a good walkthrough without overwhelming the dashboard.
const DEMO_PGD_SLUGS = [
  // Tier 1 headliners
  'ed', 'wegovy', 'mounjaro', 'trt', 'hrt',
  'uti', 'emergency-contraception', 'hair-loss', 'travel-core',
  // High-volume women's & men's
  'period-delay', 'bv', 'thrush', 'recurrent-uti',
  'premature-ejaculation', 'bph',
  // Skin / minor ailments
  'acne', 'cold-sores', 'eczema', 'rosacea', 'hayfever',
  'sore-throat', 'ear-infection', 'impetigo',
  // Vaccines
  'flu', 'covid-booster', 'shingles-vaccine', 'pneumococcal',
  // CVD / respiratory
  'hypertension', 'statins', 'asthma-rescue',
  // Mental health / lifestyle
  'anxiety-propranolol', 'sleep-melatonin',
  'smoking-varenicline', 'alcohol-reduction',
]

// 1) Ensure the demo pharmacy exists
const [existingPharmacy] = await sql`
  SELECT id, name FROM pharmacies WHERE LOWER(email) = LOWER(${DEMO_PHARMACY_EMAIL}) LIMIT 1
`
let pharmacyId
if (existingPharmacy) {
  pharmacyId = existingPharmacy.id
  console.log(`✓ Demo pharmacy already exists: ${existingPharmacy.name} (${pharmacyId})`)
} else {
  const [created] = await sql`
    INSERT INTO pharmacies (name, address, phone, email, group_slug)
    VALUES (
      ${DEMO_PHARMACY_NAME},
      'GRH Sales Demo, Online',
      '0113 519 8330',
      ${DEMO_PHARMACY_EMAIL},
      'grh-demo'
    )
    RETURNING id
  `
  pharmacyId = created.id
  console.log(`✓ Created demo pharmacy: ${DEMO_PHARMACY_NAME} (${pharmacyId})`)
}

// 2) Assign curated PGDs to the demo pharmacy (idempotent)
let assignedCount = 0
for (const slug of DEMO_PGD_SLUGS) {
  // Check if already assigned, then insert if not
  const [existing] = await sql`
    SELECT id FROM pharmacy_pgds WHERE pharmacy_id = ${pharmacyId} AND pgd_slug = ${slug} LIMIT 1
  `
  if (!existing) {
    await sql`
      INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug)
      VALUES (${pharmacyId}, ${slug})
    `
    assignedCount += 1
  }
}
console.log(`✓ Assigned ${assignedCount} new PGDs to demo pharmacy (total set: ${DEMO_PGD_SLUGS.length})`)

// 3) Create or update Syed's account
async function upsertProspect({ email, firstName, lastName, password }) {
  const hash = bcrypt.hashSync(password, 10)
  const [existing] = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
  if (existing) {
    await sql`
      UPDATE users
         SET first_name = ${firstName},
             last_name = ${lastName},
             password_hash = ${hash},
             role = 'prospect',
             pharmacy_id = ${pharmacyId},
             updated_at = NOW()
       WHERE id = ${existing.id}
    `
    console.log(`✓ Updated existing user: ${email}`)
  } else {
    await sql`
      INSERT INTO users (email, first_name, last_name, password_hash, role, pharmacy_id)
      VALUES (${email.toLowerCase()}, ${firstName}, ${lastName}, ${hash}, 'prospect', ${pharmacyId})
    `
    console.log(`✓ Created user: ${email}`)
  }
}

await upsertProspect({
  email: 'alinaqvi@5hnw.co.uk',
  firstName: 'Syed Ali Raza',
  lastName: 'Naqvi',
  password: SYED_PASSWORD,
})

await upsertProspect({
  email: 'demo@getrealhealthpgd.co.uk',
  firstName: 'GRH',
  lastName: 'Demo',
  password: DEMO_PASSWORD,
})

console.log()
console.log('───────── Prospect Logins ─────────')
console.log()
console.log('Syed (iPharmac)')
console.log('  URL:      https://getrealhealthpgd.co.uk/login')
console.log('  Email:    alinaqvi@5hnw.co.uk')
console.log('  Password: ' + SYED_PASSWORD)
console.log()
console.log('Demo (share with any interested pharmacy)')
console.log('  URL:      https://getrealhealthpgd.co.uk/login')
console.log('  Email:    demo@getrealhealthpgd.co.uk')
console.log('  Password: ' + DEMO_PASSWORD)
console.log()
console.log('Both accounts can browse dashboard, ePGD tools, and training,')
console.log('but the "Download Written PGD" button is hidden for their role.')
