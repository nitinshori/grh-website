// Create 5 isolated prospect accounts for letting customers explore the
// platform with separate user_ids (so the audit log shows who did what).
//
// All five share the existing "GRH Demo Pharmacy" with its 34 curated
// PGDs — same partial catalogue, same role ('prospect'), same hidden
// download buttons.
//
// Idempotent: if any of the 5 emails already exists, the script updates
// their password / role / pharmacy assignment instead of creating duplicates.

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const DEMO_PHARMACY_EMAIL = 'demo@getrealhealthpgd.co.uk'

const ACCOUNTS = [
  { email: 'demo1@getrealhealthpgd.co.uk', password: 'Demo1Access2026!', firstName: 'Demo',  lastName: 'User One'   },
  { email: 'demo2@getrealhealthpgd.co.uk', password: 'Demo2Access2026!', firstName: 'Demo',  lastName: 'User Two'   },
  { email: 'demo3@getrealhealthpgd.co.uk', password: 'Demo3Access2026!', firstName: 'Demo',  lastName: 'User Three' },
  { email: 'demo4@getrealhealthpgd.co.uk', password: 'Demo4Access2026!', firstName: 'Demo',  lastName: 'User Four'  },
  { email: 'demo5@getrealhealthpgd.co.uk', password: 'Demo5Access2026!', firstName: 'Demo',  lastName: 'User Five'  },
]

// 1) Look up the demo pharmacy
const [pharmacy] = await sql`
  SELECT id, name FROM pharmacies WHERE LOWER(email) = LOWER(${DEMO_PHARMACY_EMAIL}) LIMIT 1
`
if (!pharmacy) {
  console.error(`❌ Demo pharmacy "${DEMO_PHARMACY_EMAIL}" not found. Run scripts/seed-prospect-accounts.mjs first.`)
  process.exit(1)
}
console.log(`Using demo pharmacy: ${pharmacy.name} (${pharmacy.id})`)
console.log()

// 2) Upsert each account
for (const a of ACCOUNTS) {
  const hash = bcrypt.hashSync(a.password, 10)
  const [existing] = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${a.email}) LIMIT 1`
  if (existing) {
    await sql`
      UPDATE users
         SET first_name = ${a.firstName},
             last_name = ${a.lastName},
             password_hash = ${hash},
             role = 'prospect',
             pharmacy_id = ${pharmacy.id},
             is_active = TRUE,
             updated_at = NOW()
       WHERE id = ${existing.id}
    `
    console.log(`  ↻ Updated  ${a.email}`)
  } else {
    await sql`
      INSERT INTO users (email, first_name, last_name, password_hash, role, pharmacy_id, is_active)
      VALUES (${a.email.toLowerCase()}, ${a.firstName}, ${a.lastName}, ${hash}, 'prospect', ${pharmacy.id}, TRUE)
    `
    console.log(`  + Created  ${a.email}`)
  }
}

console.log()
console.log('───────── Five Demo Logins ─────────')
console.log()
for (const a of ACCOUNTS) {
  console.log(`  ${a.email}`)
  console.log(`    Password: ${a.password}`)
  console.log()
}
console.log('All five:')
console.log('  • Role: prospect (can browse but cannot download PGDs)')
console.log('  • Pharmacy: GRH Demo Pharmacy (34 curated PGDs)')
console.log('  • Separate user_ids → audit log shows who did what')
console.log('  • Login at https://getrealhealthpgd.co.uk/login')
