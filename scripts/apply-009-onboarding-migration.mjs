import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)
const migration = readFileSync(
  join(__dir, '..', 'src', 'lib', 'db', 'migrations', '009_onboarding_requests.sql'),
  'utf8',
)

console.log('Applying 009_onboarding_requests.sql to:', process.env.DATABASE_URL.match(/@([^/:]+)/)?.[1])

const statements = migration.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)
for (const stmt of statements) {
  try {
    await sql.query(stmt + ';')
    console.log('  ✓', stmt.split('\n')[0].slice(0, 80))
  } catch (e) {
    if (/already exists/.test(e.message)) {
      console.log('  ↪ skip (already exists):', stmt.split('\n')[0].slice(0, 80))
    } else {
      console.error('  ✗', stmt.split('\n')[0].slice(0, 80))
      console.error('    ', e.message)
      process.exit(1)
    }
  }
}

const r = await sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name='onboarding_requests'`
console.log()
console.log(r[0].n === 1 ? '✅ onboarding_requests table is present.' : '⚠️  Not found.')
