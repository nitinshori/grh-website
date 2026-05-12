import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)
const migration = readFileSync(
  join(__dir, '..', 'src', 'lib', 'db', 'migrations', '013_phone_bookings.sql'),
  'utf8',
)

console.log('Applying 013_phone_bookings.sql to:', process.env.DATABASE_URL.match(/@([^/:]+)/)?.[1])

const statements = migration.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)
for (const stmt of statements) {
  try {
    await sql.query(stmt + ';')
    console.log('  ✓', stmt.split('\n')[0].slice(0, 80))
  } catch (e) {
    if (/already exists/.test(e.message) || /does not exist/.test(e.message)) {
      console.log('  ↪ skip:', stmt.split('\n')[0].slice(0, 80), '—', e.message.slice(0, 60))
    } else {
      console.error('  ✗', stmt.split('\n')[0].slice(0, 80))
      console.error('    ', e.message)
      process.exit(1)
    }
  }
}

const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='consultation_drafts'
    AND column_name IN ('booking_type', 'expected_visit_date', 'patient_phone')
  ORDER BY column_name
`
console.log()
console.log('Found columns:', cols.map((c) => c.column_name).join(', '))
console.log(cols.length === 3 ? '✅ phone-booking columns present.' : '⚠️  Some columns missing.')
