import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
const sql = neon(process.env.DATABASE_URL)
const m = readFileSync(join(__dir, '..', 'src', 'lib', 'db', 'migrations', '011_subscription_id.sql'), 'utf8')
console.log('Applying 011_subscription_id.sql to:', process.env.DATABASE_URL.match(/@([^/:]+)/)?.[1])
for (const stmt of m.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)) {
  try { await sql.query(stmt + ';'); console.log('  ✓', stmt.split('\n')[0].slice(0, 80)) }
  catch (e) {
    if (/already exists/.test(e.message)) console.log('  ↪ skip')
    else { console.error('  ✗', e.message); process.exit(1) }
  }
}
console.log('✅ done')
