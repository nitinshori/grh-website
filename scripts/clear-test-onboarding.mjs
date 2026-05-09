import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)
const r = await sql`
  DELETE FROM onboarding_requests
   WHERE contact_email LIKE '%@grhpharmacy.test'
      OR pharmacy_name ILIKE '%qa%'
      OR pharmacy_name ILIKE '%sandbox%'
   RETURNING id, pharmacy_name, status
`
console.log(`Removed ${r.length} test onboarding row(s):`)
for (const row of r) console.log(`  - ${row.pharmacy_name} (${row.status})`)
