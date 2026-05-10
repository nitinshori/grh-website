// .test TLD might be triggering validation somewhere — rename to a real-format domain
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const renames = [
  ['test-moins@grhpharmacy.test', 'qa-moins@getrealhealthpgd.co.uk'],
  ['test-pph@grhpharmacy.test', 'qa-pph@getrealhealthpgd.co.uk'],
]

for (const [oldEmail, newEmail] of renames) {
  const r = await sql`UPDATE users SET email = ${newEmail}, updated_at = NOW() WHERE LOWER(email) = LOWER(${oldEmail}) RETURNING email`
  console.log(r.length ? `✓ ${oldEmail} → ${newEmail}` : `✗ ${oldEmail} not found`)
}
