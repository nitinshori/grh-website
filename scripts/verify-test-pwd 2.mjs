import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)
const PWD = 'TestSmoke2026!'

for (const email of ['test-moins@grhpharmacy.test', 'test-pph@grhpharmacy.test']) {
  const [r] = await sql`SELECT email, password_hash FROM users WHERE email = ${email}`
  if (!r) { console.log(`${email}: NOT FOUND`); continue }
  const ok = await bcrypt.compare(PWD, r.password_hash)
  console.log(`${email}: hash starts ${r.password_hash.slice(0, 7)}, match=${ok}`)
}
