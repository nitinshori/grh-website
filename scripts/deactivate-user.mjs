// Deactivate a user account by email. Sets is_active = false.
//
// The NextAuth credentials provider checks is_active on every login,
// so future login attempts will be rejected. Existing JWT sessions
// remain valid until they expire (idle timeout cleans them up).
//
// To re-enable later, run:
//   UPDATE users SET is_active = true WHERE LOWER(email) = LOWER('...');
// or rerun this script with REACTIVATE=1 env var.
//
// Usage:
//   node scripts/deactivate-user.mjs <email>
//   REACTIVATE=1 node scripts/deactivate-user.mjs <email>

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const email = process.argv[2]
const reactivate = process.env.REACTIVATE === '1'

if (!email) {
  console.error('Usage: node scripts/deactivate-user.mjs <email>     (sets is_active = false)')
  console.error('       REACTIVATE=1 node scripts/deactivate-user.mjs <email>  (sets is_active = true)')
  process.exit(1)
}

// Default: deactivate (is_active = false). With REACTIVATE=1: reactivate (true).
const newActive = reactivate

const r = await sql`
  UPDATE users
     SET is_active = ${newActive}, updated_at = NOW()
   WHERE LOWER(email) = LOWER(${email})
  RETURNING id, email, first_name, last_name, role, is_active, pharmacy_id
`

if (!r.length) {
  console.log(`⚠️  No user found for ${email}`)
  process.exit(1)
}

const u = r[0]
const verb = newActive ? 'Reactivated' : 'Deactivated'
console.log(`✅ ${verb} ${u.first_name} ${u.last_name} <${u.email}>`)
console.log(`   role:        ${u.role}`)
console.log(`   pharmacy_id: ${u.pharmacy_id || '(none)'}`)
console.log(`   is_active:   ${u.is_active}`)
if (!newActive) {
  console.log('')
  console.log('   ⚠ Future login attempts will fail.')
  console.log('   ⚠ Any active JWT session for this user persists until idle timeout expires.')
  console.log('   ⚠ To restore access, run: REACTIVATE=1 node scripts/deactivate-user.mjs ' + email)
}
