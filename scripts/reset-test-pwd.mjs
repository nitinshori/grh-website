import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'

config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)
// Use the SYNC hash style that reset-moins uses (and which we know works on prod auth).
const hash = bcrypt.hashSync('TestSmoke2026!', 10)

for (const email of ['test-moins@grhpharmacy.test', 'test-pph@grhpharmacy.test']) {
  const rows = await sql`UPDATE users SET password_hash = ${hash}, updated_at = NOW() WHERE LOWER(email) = LOWER(${email}) RETURNING email, first_name`
  console.log(rows.length ? `✓ reset ${rows[0].email}` : `✗ no row updated for ${email}`)
}
console.log('Done. Hash starts:', hash.slice(0, 7))
