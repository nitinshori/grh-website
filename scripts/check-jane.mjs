// Read-only check of Jane Wilkins's account at Pharmacy+ Health.
// Confirms her email, role, pharmacy linkage, active flag, password set,
// PGDs assigned to her pharmacy, and prints the login details she needs.
//
// Run from grh-website/:
//   node scripts/check-jane.mjs

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

console.log('\n=== Jane Wilkins user record ===')
const [u] = await sql`
  SELECT u.id, u.email, u.first_name, u.last_name, u.role,
         u.is_active, u.pharmacy_id, p.slug AS pharmacy_slug, p.name AS pharmacy_name,
         (u.password_hash IS NOT NULL) AS has_password,
         u.created_at, u.updated_at
  FROM users u
  LEFT JOIN pharmacies p ON p.id = u.pharmacy_id
  WHERE LOWER(u.email) = LOWER('jane.wilkins@pharmacyplushealth.co.uk')
`
if (!u) {
  console.log('❌ No user found for jane.wilkins@pharmacyplushealth.co.uk')
  // Try fuzzy lookup as a fallback
  const fuzzy = await sql`
    SELECT email, first_name, last_name, role, is_active
    FROM users
    WHERE first_name ILIKE '%jane%' OR last_name ILIKE '%wilkins%' OR email ILIKE '%jane%'
    ORDER BY updated_at DESC
  `
  if (fuzzy.length) {
    console.log('\nFound similar accounts:')
    console.table(fuzzy)
  }
  process.exit(1)
}
console.table([{
  email: u.email,
  name: `${u.first_name} ${u.last_name}`,
  role: u.role,
  pharmacy: u.pharmacy_name,
  pharmacy_slug: u.pharmacy_slug,
  active: u.is_active,
  passwordSet: u.has_password,
  passwordUpdated: u.updated_at?.toISOString?.() || String(u.updated_at),
}])

if (u.role !== 'pharmacist' && u.role !== 'pharmacy_admin') {
  console.log(`⚠️  Role is ${u.role} — she may not be able to see the pharmacist dashboard.`)
}
if (!u.is_active) {
  console.log('⚠️  Account is INACTIVE — she will not be able to log in.')
}
if (!u.has_password) {
  console.log('⚠️  No password set — run scripts/reset-jane-password.mjs to set one.')
}

console.log('\n=== PGDs assigned to her pharmacy ===')
const [count] = await sql`
  SELECT COUNT(*)::int AS n
  FROM pharmacy_pgds
  WHERE pharmacy_id = ${u.pharmacy_id}
`
console.log(`  ${count.n} ePGDs assigned to ${u.pharmacy_name}`)
if (count.n === 0) {
  console.log('  ⚠️  Zero PGDs assigned — she won\'t see any ePGD tools or training in the dashboard.')
}

console.log('\n=== Other PPH staff ===')
const others = await sql`
  SELECT email, first_name, last_name, role, is_active
  FROM users
  WHERE pharmacy_id = ${u.pharmacy_id}
    AND email != ${u.email}
  ORDER BY role, email
`
if (others.length) console.table(others)
else console.log('  (none)')

console.log('\n─────────────────────────────────────────')
console.log('LOGIN DETAILS FOR JANE')
console.log('─────────────────────────────────────────')
console.log(`URL:      https://getrealhealthpgd.co.uk/login`)
console.log(`Email:    ${u.email}`)
console.log(`Password: PphLaunch2026!`)
console.log('')
console.log('(Password set via scripts/reset-jane-password.mjs.')
console.log(' Re-run that script to reset it if she has changed it.)')
console.log('')
console.log('After logging in she will land on:')
console.log('  https://getrealhealthpgd.co.uk/for-pharmacies/dashboard')
console.log('From there:')
console.log('  • ePGD Tools — list of all PGDs assigned to her pharmacy')
console.log('  • Account → Competencies — training assessments per PGD')
console.log('  • Each ePGD page has the consultation tool + training material inline')
