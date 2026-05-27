#!/usr/bin/env node
/**
 * Migrate Sarah Passmore's GRH login from sarah.passmore@pharmacyplushealth.co.uk
 * to sarah.passmore@hubrx.co.uk and set a known password (no setup-token flow).
 *
 * - If a user already exists at hubrx.co.uk email → repurpose that one
 * - Else if the pharmacyplushealth.co.uk user exists → update its email
 * - Else create a fresh user at PPH as pharmacy_admin
 */
import dotenv from 'dotenv'
import pg from 'pg'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const NEW_EMAIL = 'sarah.passmore@hubrx.co.uk'
const OLD_EMAIL = 'sarah.passmore@pharmacyplushealth.co.uk'
const PASSWORD = 'GRH-Sarah-2026!'
const PHARMACY_NAME = 'Pharmacy Plus Health'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const client = await pool.connect()
try {
  // Look up PPH pharmacy_id
  const { rows: pharm } = await client.query(
    'SELECT id FROM pharmacies WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [PHARMACY_NAME],
  )
  if (!pharm[0]) {
    console.error(`❌ Pharmacy "${PHARMACY_NAME}" not found`)
    process.exit(1)
  }
  const pharmacyId = pharm[0].id

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  // Find existing user by either email
  const { rows: existing } = await client.query(
    `SELECT id, email FROM users
     WHERE LOWER(email) IN (LOWER($1), LOWER($2))
     ORDER BY (LOWER(email) = LOWER($1)) DESC
     LIMIT 1`,
    [NEW_EMAIL, OLD_EMAIL],
  )

  let userId
  let action
  if (existing[0]) {
    const { rows: updated } = await client.query(
      `UPDATE users SET
         email = $1,
         password_hash = $2,
         first_name = 'Sarah',
         last_name = 'Passmore',
         role = 'pharmacy_admin',
         pharmacy_id = $3,
         is_active = true,
         setup_token_hash = NULL,
         setup_token_expires_at = NULL,
         setup_token_used_at = NULL,
         updated_at = NOW()
       WHERE id = $4
       RETURNING id, email`,
      [NEW_EMAIL.toLowerCase(), passwordHash, pharmacyId, existing[0].id],
    )
    userId = updated[0].id
    action = `Updated existing user (was ${existing[0].email}) → ${updated[0].email}`
  } else {
    const { rows: created } = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
       VALUES ($1, $2, 'Sarah', 'Passmore', 'pharmacy_admin', $3, true)
       RETURNING id, email`,
      [NEW_EMAIL.toLowerCase(), passwordHash, pharmacyId],
    )
    userId = created[0].id
    action = `Created new user ${created[0].email}`
  }

  console.log(`✅ ${action}`)
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Email:    ' + NEW_EMAIL)
  console.log('  Password: ' + PASSWORD)
  console.log('  Login:    https://getrealhealthpgd.co.uk/login')
  console.log('  User ID:  ' + userId)
  console.log('  Pharmacy: ' + PHARMACY_NAME)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('Sarah should change her password from the dashboard once she\'s in.')
} finally {
  client.release()
  await pool.end()
}
