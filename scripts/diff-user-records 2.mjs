import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const r = await sql`
  SELECT id, email, length(password_hash) AS hash_len, substring(password_hash, 1, 7) AS hash_prefix,
         first_name, last_name, role, pharmacy_id, is_active, created_at, updated_at,
         totp_enabled, totp_secret IS NOT NULL AS has_totp_secret
    FROM users
   WHERE email IN ('moin@moinschemist.co.uk', 'qa-moins@getrealhealthpgd.co.uk')
   ORDER BY email
`
console.table(r)
