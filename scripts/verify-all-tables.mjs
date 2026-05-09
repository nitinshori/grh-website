import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const tables = await sql`
  SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' ORDER BY table_name
`
console.log('Tables in eu-west-2 production DB:')
for (const t of tables) console.log('  -', t.table_name)

const expected = ['pharmacies','users','pharmacy_pgds','clinicians','audit_logs',
  'consultation_records','consultation_drafts','pgd_consultations','voice_calls',
  'appointment_types','clinician_availability','appointments']
const missing = expected.filter(e => !tables.some(t => t.table_name === e))
console.log()
console.log(missing.length === 0 ? '✅ All expected tables present' : `⚠️ MISSING: ${missing.join(', ')}`)
