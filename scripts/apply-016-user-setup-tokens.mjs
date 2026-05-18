import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)
const migration = readFileSync(
  join(__dir, '..', 'src', 'lib', 'db', 'migrations', '016_user_setup_tokens.sql'),
  'utf8',
)

console.log('Applying 016_user_setup_tokens.sql to:', process.env.DATABASE_URL.match(/@([^/:]+)/)?.[1])

const statements = migration.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)
for (const stmt of statements) {
  try {
    await sql.query(stmt + ';')
    console.log('  ✓', stmt.split('\n')[0].slice(0, 80))
  } catch (e) {
    if (/already exists/.test(e.message)) {
      console.log('  ↪ skip:', stmt.split('\n')[0].slice(0, 80))
    } else {
      console.error('  ✗', stmt.split('\n')[0].slice(0, 80))
      console.error('    ', e.message)
      process.exit(1)
    }
  }
}

const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name LIKE 'setup_token%' ORDER BY column_name`
console.log()
console.log('Setup-token columns on users:', r.map((c) => c.column_name).join(', '))
console.log(r.length === 3 ? '✅ All three columns present.' : '⚠️  Missing columns.')
