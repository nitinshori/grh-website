#!/usr/bin/env node
/**
 * Deactivate every user with role='prospect'. They can no longer log in.
 *
 * Lists affected users first, then flips is_active to false. Idempotent.
 * Syed is already pharmacy_admin so he is NOT touched.
 */

import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

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
  // ── 1) Show what we'll deactivate ───────────────────────────────
  const { rows: targets } = await client.query(
    `SELECT id, email, first_name, last_name, is_active, pharmacy_id
     FROM users
     WHERE role = 'prospect'
     ORDER BY email`,
  )

  if (targets.length === 0) {
    console.log('ℹ️  No users with role=prospect found. Nothing to do.')
    process.exit(0)
  }

  console.log(`Found ${targets.length} prospect user(s):`)
  for (const u of targets) {
    console.log(`  • ${u.email}  (${u.first_name} ${u.last_name})  active=${u.is_active}`)
  }
  console.log('')

  // ── 2) Deactivate them ──────────────────────────────────────────
  const { rowCount } = await client.query(
    `UPDATE users SET
       is_active = false,
       updated_at = NOW()
     WHERE role = 'prospect' AND is_active = true`,
  )
  console.log(`✅ Deactivated ${rowCount} prospect account(s). They can no longer log in.`)
  console.log('')
  console.log('To reactivate one later, run:')
  console.log("  UPDATE users SET is_active = true WHERE email = 'demo1@getrealhealthpgd.co.uk';")
} finally {
  client.release()
  await pool.end()
}
