#!/usr/bin/env node
/**
 * One-off: create iPharmac (Syed Ali Raza Naqvi) as a full GRH customer.
 *
 *   - Creates the iPharmac pharmacy if it doesn't already exist
 *   - Creates Syed as pharmacy_admin on that pharmacy
 *   - Assigns ALL PGDs (the full catalogue) to iPharmac
 *   - Generates a single-use setup token (7-day expiry)
 *   - Sends a "set your password" email via Resend
 *   - Echoes the setup URL to stdout as a backup if Resend fails
 *
 *   Run from the repo root with:
 *     node scripts/create-ipharmac-syed.mjs
 *
 *   Env required:
 *     DATABASE_URL          — Neon Postgres
 *     RESEND_API_KEY        — optional. If absent, setup URL is just printed.
 *     APP_URL               — optional. Defaults to https://getrealhealthpgd.co.uk
 */

import dotenv from 'dotenv'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { Resend } from 'resend'

// Load env in the order Next.js uses — .env.local wins, then .env
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

// Inline list of every PGD slug — pulled from src/lib/pgd-access.ts so this
// script doesn't depend on TS compilation. Update both if you add a PGD.
const ALL_PGD_SLUGS = [
  // Men's Health
  'ed', 'trt', 'hair-loss', 'premature-ejaculation', 'bph',
  // Women's Health
  'emergency-contraception', 'postnatal-contraception', 'hrt', 'recurrent-uti',
  'thrush', 'period-delay', 'bv', 'testosterone-women', 'alopecia-minoxidil',
  // Sexual Health
  'sti-testing', 'genital-warts', 'herpes-management', 'prep', 'gonorrhoea-treatment',
  // Weight Management
  'wegovy', 'mounjaro', 'wegovy-oral', 'saxenda', 'mysimba', 'orlistat', 'glp1-monitoring',
  // Skin
  'acne', 'rosacea', 'eczema', 'impetigo', 'cold-sores', 'shingles-treatment', 'wound-care',
  // Acute & Infection
  'uti', 'sore-throat', 'ear-infection', 'threadworms', 'chickenpox',
  // Respiratory
  'asthma-rescue', 'copd', 'smoking-nrt',
  // Cardiovascular
  'hypertension', 'statins', 'diabetes-monitoring',
  // Mental Health & Wellbeing
  'smoking-varenicline', 'alcohol-reduction', 'sleep-melatonin', 'anxiety-propranolol', 'hayfever',
  // Vaccines
  'flu', 'covid-booster', 'shingles-vaccine', 'pneumococcal', 'hpv', 'mmr',
  'meningitis-b', 'meningitis-acwy-travel', 'rsv', 'hep-ab-travel', 'typhoid', 'yellow-fever',
  // Travel Health
  'travel-core', 'anti-malarials', 'hep-b-occupational', 'rabies',
  'japanese-encephalitis', 'dengue', 'altitude-sickness', 'travellers-diarrhoea',
  // Occupational Health
  'dental-bridging',
  // Paediatrics
  'paediatric-uti',
]

// ── Customer details ───────────────────────────────────────────────
const PHARMACY = {
  name: 'iPharmac',
  email: 'info@ipharmac.co.uk',
  address: null,    // fill in when known
  phone: null,
}

const USER = {
  firstName: 'Syed',
  lastName: 'Ali Raza Naqvi',
  email: 'alinaqvi@5hnw.co.uk',
  role: 'pharmacy_admin',
  gphcNumber: '2205022',
}

// ── Boot ───────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Source .env.local or pass it inline.')
  process.exit(1)
}

const APP_URL = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const client = await pool.connect()

try {
  await client.query('BEGIN')

  // ── 1) Ensure pharmacy exists ────────────────────────────────────
  let pharmacyId
  {
    const { rows } = await client.query(
      'SELECT id FROM pharmacies WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [PHARMACY.name],
    )
    if (rows[0]) {
      pharmacyId = rows[0].id
      console.log(`ℹ️  Pharmacy "${PHARMACY.name}" already exists — ${pharmacyId}`)
    } else {
      const insert = await client.query(
        `INSERT INTO pharmacies (name, email, address, phone, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [PHARMACY.name, PHARMACY.email, PHARMACY.address, PHARMACY.phone],
      )
      pharmacyId = insert.rows[0].id
      console.log(`✅ Created pharmacy "${PHARMACY.name}" — ${pharmacyId}`)
    }
  }

  // ── 2) Generate locked password + setup token ───────────────────
  const lockedPw = crypto.randomBytes(32).toString('hex')
  const lockedHash = await bcrypt.hash(lockedPw, 10)

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // ── 3) Upsert user ──────────────────────────────────────────────
  // If Syed already exists (e.g. from a prior prospect setup) we repurpose
  // the record in place — change pharmacy, change role to pharmacy_admin,
  // lock the old password, issue a fresh setup token. This keeps his user
  // ID stable so any prior audit-log rows remain attributed to him.
  let userId
  let wasExisting = false
  {
    const { rows: existingRows } = await client.query(
      'SELECT id, role, pharmacy_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [USER.email],
    )

    if (existingRows[0]) {
      wasExisting = true
      const prior = existingRows[0]
      console.log(
        `ℹ️  User ${USER.email} already exists (id ${prior.id}, prior role ${prior.role}, prior pharmacy ${prior.pharmacy_id}). Repurposing in place.`,
      )
      const { rows: updated } = await client.query(
        `UPDATE users SET
           first_name = $1,
           last_name = $2,
           role = $3,
           pharmacy_id = $4,
           is_active = true,
           password_hash = $5,
           setup_token_hash = $6,
           setup_token_expires_at = $7,
           setup_token_used_at = NULL,
           updated_at = NOW()
         WHERE id = $8
         RETURNING id`,
        [
          USER.firstName,
          USER.lastName,
          USER.role,
          pharmacyId,
          lockedHash,
          tokenHash,
          expiresAt,
          prior.id,
        ],
      )
      userId = updated[0].id
      console.log(`✅ Repurposed user → ${USER.role} at ${PHARMACY.name} — ${userId}`)
    } else {
      const { rows: createdRows } = await client.query(
        `INSERT INTO users (
           email, password_hash, first_name, last_name, role,
           pharmacy_id, is_active,
           setup_token_hash, setup_token_expires_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
         RETURNING id, email`,
        [
          USER.email.toLowerCase(),
          lockedHash,
          USER.firstName,
          USER.lastName,
          USER.role,
          pharmacyId,
          tokenHash,
          expiresAt,
        ],
      )
      userId = createdRows[0].id
      console.log(`✅ Created user ${USER.email} as ${USER.role} — ${userId}`)
    }
  }

  // ── 5) Assign ALL PGDs ──────────────────────────────────────────
  // ON CONFLICT DO NOTHING handles the (pharmacy_id, pgd_slug) unique index
  // — safe to re-run even if some PGDs were already assigned.
  let assignedCount = 0
  for (const slug of ALL_PGD_SLUGS) {
    const res = await client.query(
      `INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug)
       VALUES ($1, $2)
       ON CONFLICT (pharmacy_id, pgd_slug) DO NOTHING`,
      [pharmacyId, slug],
    )
    if (res.rowCount > 0) assignedCount++
  }
  console.log(`✅ Assigned ${assignedCount} PGDs to ${PHARMACY.name} (of ${ALL_PGD_SLUGS.length} total)`)

  await client.query('COMMIT')

  // ── 6) Compose setup URL + email ─────────────────────────────────
  const setupUrl = `${APP_URL}/set-password?uid=${userId}&token=${rawToken}`
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Setup URL (valid 7 days — share with Syed if email fails):')
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
          `Hi ${USER.firstName},\n\n` +
          `Your iPharmac account on the Get Real Health PGD platform is ready. ` +
          `Click the link below to set your password and log in:\n\n` +
          `${setupUrl}\n\n` +
          `Once you're in, you'll have full access to all 70+ PGDs and the training library. ` +
          `Anyone else on your team can be added from the Manage Staff page.\n\n` +
          `The link is valid for 7 days. If anything is unclear, reply to this email and we'll help.\n\n` +
          `— The Get Real Health team\n`,
      })
      console.log(`✅ Setup email sent to ${USER.email} via Resend`)
    } catch (e) {
      console.error(`⚠️  Resend send failed: ${e.message}`)
      console.error('   Use the setup URL above — share it with Syed directly.')
    }
  } else {
    console.log('ℹ️  RESEND_API_KEY not set in env — no email sent. Share the setup URL above with Syed.')
  }

  console.log('')
  console.log('Done. Account summary:')
  console.log(`  Pharmacy: ${PHARMACY.name} (${pharmacyId})`)
  console.log(`  User:     ${USER.email} (${userId}) — ${USER.role}`)
  console.log(`  PGDs:     ${ALL_PGD_SLUGS.length} assigned`)
  console.log(`  GPhC:     ${USER.gphcNumber}`)
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('❌ Failed — rolled back. Error:', err)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
