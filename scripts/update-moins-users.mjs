#!/usr/bin/env node

/**
 * Update Moin's Chemist user emails, GPhC numbers, and set passwords.
 * Usage:  node scripts/update-moins-users.mjs
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { randomBytes } from 'crypto'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function run() {
  let bcryptHash
  try {
    const bcrypt = await import('bcryptjs')
    bcryptHash = async (pw) => bcrypt.default.hash(pw, 10)
  } catch {
    try {
      const bcrypt = await import('bcrypt')
      bcryptHash = async (pw) => bcrypt.default.hash(pw, 10)
    } catch {
      const { execSync } = await import('child_process')
      execSync('npm install bcryptjs', { cwd: join(__dir, '..'), stdio: 'pipe' })
      const bcrypt = await import('bcryptjs')
      bcryptHash = async (pw) => bcrypt.default.hash(pw, 10)
    }
  }

  console.log('🔄 Updating Moin\'s Chemist users...\n')

  const updates = [
    { oldEmail: 'mohammad.kolia@moinschemist.co.uk', newEmail: 'Mohammad.kolia@nhs.net', gphc: '2082423', name: 'Mohammad Kolia' },
    { oldEmail: 'moinuddin.kolia@moinschemist.co.uk', newEmail: 'mnkolia2@gmail.com', gphc: '2043100', name: 'Moinuddin Kolia' },
    { oldEmail: 'muhammad.alam@moinschemist.co.uk', newEmail: 'Muhammad.alam1@nhs.net', gphc: '2071371', name: 'Muhammad Alam' },
  ]

  const credentials = []

  for (const u of updates) {
    // Generate new password
    const password = randomBytes(6).toString('hex')
    const hash = await bcryptHash(password)

    // Update user email and password
    const result = await sql`
      UPDATE users SET email = ${u.newEmail}, password_hash = ${hash}
      WHERE email = ${u.oldEmail}
      RETURNING id, first_name, last_name, role
    `

    if (result.length > 0) {
      console.log(`   ✅ ${u.name}: email → ${u.newEmail}, password reset`)
      credentials.push({ name: u.name, email: u.newEmail, password, role: result[0].role })
    } else {
      // Maybe already updated — try by new email
      const existing = await sql`SELECT id FROM users WHERE email = ${u.newEmail} LIMIT 1`
      if (existing.length > 0) {
        await sql`UPDATE users SET password_hash = ${hash} WHERE email = ${u.newEmail}`
        const user = await sql`SELECT role FROM users WHERE email = ${u.newEmail} LIMIT 1`
        console.log(`   ✅ ${u.name}: already at ${u.newEmail}, password reset`)
        credentials.push({ name: u.name, email: u.newEmail, password, role: user[0].role })
      } else {
        console.log(`   ❌ ${u.name}: user not found`)
      }
    }

    // Update GPhC number on clinician record
    await sql`
      UPDATE clinicians SET gphc_number = ${u.gphc}
      WHERE name = ${u.name} AND group_slug = 'moins-chemist'
    `
    console.log(`   ✅ ${u.name}: GPhC → ${u.gphc}`)
  }

  // ── Update availability to actual opening hours ──────────────
  console.log('\n📅 Updating clinician availability...')

  // Get all clinicians for this pharmacy
  const clinicians = await sql`
    SELECT id, name FROM clinicians WHERE group_slug = 'moins-chemist'
  `

  const siteRows = await sql`SELECT id FROM pharmacies WHERE group_slug = 'moins-chemist' LIMIT 1`
  const siteId = siteRows[0]?.id

  if (siteId && clinicians.length > 0) {
    // Delete existing availability
    for (const c of clinicians) {
      await sql`DELETE FROM clinician_availability WHERE clinician_id = ${c.id}`
    }

    for (const c of clinicians) {
      // Mon–Fri: 9am–1pm, 2:30pm–7pm (split shift)
      for (const day of [1, 2, 3, 4, 5]) {
        await sql`
          INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
          VALUES (${c.id}, ${siteId}, ${day}, '09:00', '13:00', true)
        `
        await sql`
          INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
          VALUES (${c.id}, ${siteId}, ${day}, '14:30', '19:00', true)
        `
      }
      // Saturday: 9am–1pm
      await sql`
        INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
        VALUES (${c.id}, ${siteId}, 6, '09:00', '13:00', true)
      `
      console.log(`   ✅ ${c.name} → Mon–Fri 09:00–13:00 & 14:30–19:00, Sat 09:00–13:00`)
    }
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('🔑 LOGIN CREDENTIALS')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`   Login URL: https://getrealhealthpgd.co.uk/login\n`)
  for (const c of credentials) {
    console.log(`   ${c.name} (${c.role})`)
    console.log(`   Email:    ${c.email}`)
    console.log(`   Password: ${c.password}`)
    console.log()
  }
  console.log('═══════════════════════════════════════════════════════')
  console.log('⚠️  Ask users to change passwords on first login')
}

run().catch(err => { console.error('Fatal error:', err); process.exit(1) })
