// Test theory: maybe the special char `!` is not the issue, but try a simple password just to rule it out
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'

config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)
const hash = bcrypt.hashSync('SmokeTest2026', 10)  // no special chars

for (const email of ['qa-moins@getrealhealthpgd.co.uk', 'qa-pph@getrealhealthpgd.co.uk']) {
  const r = await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE LOWER(email) = LOWER(${email}) RETURNING email`
  console.log(r.length ? `✓ reset ${r[0].email} (new password: SmokeTest2026)` : `✗ ${email}`)
}
