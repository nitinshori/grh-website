#!/usr/bin/env node
/**
 * Create Sarah Passmore's account at Pharmacy Plus Health,
 * mirroring Janey's permission level (pharmacy_admin).
 * Idempotent — repurposes if user exists.
 */
import dotenv from 'dotenv'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { Resend } from 'resend'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const PHARMACY_NAME = 'Pharmacy Plus Health'
const USER = {
  firstName: 'Sarah',
  lastName: 'Passmore',
  email: 'sarah.passmore@pharmacyplushealth.co.uk',
  role: 'pharmacy_admin',
}

const APP_URL = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()
try {
  await client.query('BEGIN')

  // 1) Look up the PPH pharmacy
  const { rows: pharmRows } = await client.query(
    'SELECT id FROM pharmacies WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [PHARMACY_NAME],
  )
  if (!pharmRows[0]) {
    console.error(`❌ Pharmacy "${PHARMACY_NAME}" not found. Aborting.`)
    process.exit(1)
  }
  const pharmacyId = pharmRows[0].id
  console.log(`ℹ️  Pharmacy found — ${pharmacyId}`)

  // 2) Generate locked password + setup token
  const lockedPw = crypto.randomBytes(32).toString('hex')
  const lockedHash = await bcrypt.hash(lockedPw, 10)
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // 3) Upsert user
  const { rows: existing } = await client.query(
    'SELECT id, role, pharmacy_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [USER.email],
  )
  let userId
  if (existing[0]) {
    console.log(`ℹ️  User exists (id ${existing[0].id}). Repurposing.`)
    const { rows } = await client.query(
      `UPDATE users SET first_name=$1, last_name=$2, role=$3, pharmacy_id=$4,
         is_active=true, password_hash=$5, setup_token_hash=$6, setup_token_expires_at=$7,
         setup_token_used_at=NULL, updated_at=NOW()
       WHERE id=$8 RETURNING id`,
      [USER.firstName, USER.lastName, USER.role, pharmacyId, lockedHash, tokenHash, expiresAt, existing[0].id],
    )
    userId = rows[0].id
  } else {
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id,
         is_active, setup_token_hash, setup_token_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8) RETURNING id`,
      [USER.email.toLowerCase(), lockedHash, USER.firstName, USER.lastName, USER.role, pharmacyId, tokenHash, expiresAt],
    )
    userId = rows[0].id
  }
  await client.query('COMMIT')
  console.log(`✅ Sarah created/updated — ${userId} (pharmacy_admin at ${PHARMACY_NAME})`)

  // 4) Setup URL + email
  const setupUrl = `${APP_URL}/set-password?uid=${userId}&token=${rawToken}`
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Setup URL (7 days):')
  console.log(setupUrl)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
        to: USER.email,
        subject: 'Welcome to Get Real Health — set your password',
        text:
          `Hi Sarah,\n\n` +
          `Your account on the Get Real Health PGD platform is ready. ` +
          `Click the link below to set your password and log in:\n\n` +
          `${setupUrl}\n\n` +
          `You'll have the same level of access as Janey (pharmacy admin). ` +
          `Once you're in, you'll see all the PGDs assigned to Pharmacy Plus Health, the training library, ` +
          `and the Manage Staff page where you can add any additional team members.\n\n` +
          `The link is valid for 7 days. Reply to this email if you have any issues.\n\n` +
          `— Dr Nitin Shori, Get Real Health\n`,
      })
      console.log(`✅ Setup email sent to ${USER.email}`)
    } catch (e) {
      console.error(`⚠️  Resend send failed: ${e.message}`)
      console.error('   Share the setup URL above with Sarah directly.')
    }
  }
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('❌ Failed:', err)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
