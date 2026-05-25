#!/usr/bin/env node
/**
 * Set a temporary password for Syed at iPharmac so Nitin can email him
 * login + password directly (no setup-token flow).
 *
 * Run from the repo root:
 *   node scripts/set-temp-password-syed.mjs
 *
 * Syed should change it on first login.
 */

import dotenv from 'dotenv'
import pg from 'pg'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const EMAIL = 'alinaqvi@5hnw.co.uk'
const TEMP_PASSWORD = 'Welcome-iPharmac-2026!'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const client = await pool.connect()
try {
  const hash = await bcrypt.hash(TEMP_PASSWORD, 10)
  const { rowCount } = await client.query(
    `UPDATE users SET
       password_hash = $1,
       setup_token_hash = NULL,
       setup_token_expires_at = NULL,
       setup_token_used_at = NULL,
       updated_at = NOW()
     WHERE LOWER(email) = LOWER($2)`,
    [hash, EMAIL],
  )
  if (rowCount === 0) {
    console.error(`❌ No user found with email ${EMAIL}`)
    process.exit(1)
  }
  console.log(`✅ Temp password set for ${EMAIL}`)
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Email:    ' + EMAIL)
  console.log('  Password: ' + TEMP_PASSWORD)
  console.log('  Login:    https://getrealhealthpgd.co.uk/login')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
} finally {
  client.release()
  await pool.end()
}
