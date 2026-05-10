import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
const sql = neon(process.env.DATABASE_URL)

const m = readFileSync(join(__dir, '..', 'src', 'lib', 'db', 'migrations', '010_consultation_ip_tracking.sql'), 'utf8')
console.log('Applying 010_consultation_ip_tracking.sql to:', process.env.DATABASE_URL.match(/@([^/:]+)/)?.[1])
for (const stmt of m.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)) {
  try { await sql.query(stmt + ';'); console.log('  ✓', stmt.split('\n')[0].slice(0, 80)) }
  catch (e) {
    if (/already exists/.test(e.message)) console.log('  ↪ skip:', stmt.split('\n')[0].slice(0, 80))
    else { console.error('  ✗', e.message); process.exit(1) }
  }
}
const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='consultation_records' AND column_name IN ('ip_address','user_agent') ORDER BY column_name`
console.log()
console.log(r.length === 2 ? '✅ ip_address and user_agent columns present.' : `⚠️ Expected 2 columns, got ${r.length}`)
