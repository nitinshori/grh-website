import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const records = await sql`
  SELECT id, patient_first_name, patient_last_name, pgd_slug, outcome, pharmacist_name, created_at
    FROM consultation_records
   WHERE patient_first_name LIKE 'QASmoke%' OR patient_last_name LIKE '%Smoke%' OR patient_last_name LIKE 'EuTest%'
   ORDER BY created_at DESC
   LIMIT 10
`
console.log(`Smoke test records in eu-west-2 (${records.length}):`)
console.table(records)

const drafts = await sql`SELECT id, pgd_slug, patient_first_name, patient_last_name, created_at FROM consultation_drafts ORDER BY created_at DESC LIMIT 10`
console.log(`\nDrafts in DB (${drafts.length}):`)
console.table(drafts)
