import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'

config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const NEW_PWD = 'PphLaunch2026!'
const hash = bcrypt.hashSync(NEW_PWD, 12)

const r = await sql`
  UPDATE users
     SET password_hash = ${hash}, updated_at = NOW()
   WHERE LOWER(email) = LOWER('jane.wilkins@pharmacyplushealth.co.uk')
   RETURNING email, first_name, last_name, role
`
if (r.length) {
  console.log(`✅ Reset password for ${r[0].first_name} ${r[0].last_name} (${r[0].email}, role: ${r[0].role})`)
  console.log(`   Email:    jane.wilkins@pharmacyplushealth.co.uk`)
  console.log(`   Password: ${NEW_PWD}`)
} else {
  console.log('⚠️  No user found for jane.wilkins@pharmacyplushealth.co.uk')
}
