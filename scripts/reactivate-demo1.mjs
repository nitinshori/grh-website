#!/usr/bin/env node
/**
 * Reactivate demo1@getrealhealthpgd.co.uk as a test login.
 * Sets a known password, flips is_active back to true, clears any stale tokens.
 */
import dotenv from 'dotenv'
import pg from 'pg'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const EMAIL = 'demo1@getrealhealthpgd.co.uk'
const PASSWORD = 'GRH-Demo-2026!'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()
try {
  const hash = await bcrypt.hash(PASSWORD, 10)
  const { rowCount } = await client.query(
    `UPDATE users SET
       password_hash = $1,
       is_active = true,
       setup_token_hash = NULL,
       setup_token_expires_at = NULL,
       setup_token_used_at = NULL,
       updated_at = NOW()
     WHERE LOWER(email) = LOWER($2)`,
    [hash, EMAIL],
  )
  if (rowCount === 0) { console.error(`❌ ${EMAIL} not found`); process.exit(1) }
  console.log(`✅ Reactivated ${EMAIL}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Email:    ' + EMAIL)
  console.log('  Password: ' + PASSWORD)
  console.log('  Login:    https://getrealhealthpgd.co.uk/login')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
} finally { client.release(); await pool.end() }
