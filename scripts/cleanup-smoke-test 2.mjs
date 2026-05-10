// Removes the smoke-test records but KEEPS the QA test users (so we can
// re-run smoke tests on demand). Run after a successful smoke test.
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

// 1. Delete smoke-test consultation records
const recs = await sql`
  DELETE FROM consultation_records
   WHERE patient_first_name = 'QASmoke' OR patient_last_name LIKE '%Smoke%' OR patient_last_name = 'EuTest'
   RETURNING id
`
console.log(`Removed ${recs.length} smoke-test consultation record(s)`)

// 2. Delete smoke-test drafts
const drafts = await sql`
  DELETE FROM consultation_drafts
   WHERE patient_first_name = 'QASmoke' OR note ILIKE '%smoke test%'
   RETURNING id
`
console.log(`Removed ${drafts.length} smoke-test draft(s)`)

console.log('\n✅ Smoke-test data cleaned. QA test users kept for future runs.')
console.log('   test-moins@grhpharmacy.test  / TestSmoke2026!')
console.log('   test-pph@grhpharmacy.test    / TestSmoke2026!')
