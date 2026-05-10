#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import bcrypt from 'bcryptjs'

config({ path: '.env.local' })
config({ path: '.env' })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1) }

const sql = neon(DATABASE_URL)
const hash = bcrypt.hashSync('pharmacy', 10)

const emails = [
  'mohammad.kolia@nhs.net',
  'mnkolia2@gmail.com',
  'muhammad.alam1@nhs.net',
  'basir.jariwala@moinschemist.co.uk'
]

for (const email of emails) {
  const rows = await sql`UPDATE users SET password_hash = ${hash} WHERE LOWER(email) = LOWER(${email}) RETURNING email, first_name, last_name`
  if (rows.length) {
    console.log(`✅ ${rows[0].first_name} ${rows[0].last_name} (${rows[0].email}) — password set to "pharmacy"`)
  } else {
    console.log(`⚠️  No user found for ${email}`)
  }
}
console.log('\nDone.')
