#!/usr/bin/env node

/**
 * Run this AFTER run-booking-migration.mjs to seed Pritchard's data.
 * Usage:  node scripts/seed-pritchards.mjs
 */

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createHash, randomBytes } from 'crypto'

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
  console.log('🏥 Seeding Pritchards Pharmacy data...\n')

  // ── 1. Create pharmacy sites ─────────────────────────────────
  console.log('📍 Creating pharmacy sites...')

  // Check if already seeded
  const existing = await sql`SELECT id FROM pharmacies WHERE group_slug = 'pritchards' LIMIT 1`
  if (existing.length > 0) {
    console.log('   ⏭️  Pritchards sites already exist, skipping site creation')
  } else {
    await sql`
      INSERT INTO pharmacies (name, slug, group_slug, address, brand_color, brand_name, is_active)
      VALUES
        ('Pritchards Meliden', 'pritchards-meliden', 'pritchards', 'Meliden, Prestatyn', '#3d8b37', 'Pritchards Pharmacy', true),
        ('Pritchards Victoria Road', 'pritchards-victoria-road', 'pritchards', '99 Victoria Road, Prestatyn, LL19 7SR', '#3d8b37', 'Pritchards Pharmacy', true)
    `
    console.log('   ✅ Created Pritchards Meliden + Victoria Road')
  }

  // Get site IDs
  const sites = await sql`SELECT id, slug FROM pharmacies WHERE group_slug = 'pritchards'`
  const melidenId = sites.find(s => s.slug === 'pritchards-meliden')?.id
  const victoriaId = sites.find(s => s.slug === 'pritchards-victoria-road')?.id

  if (!melidenId || !victoriaId) {
    console.error('❌ Could not find site IDs')
    process.exit(1)
  }

  // ── 2. Create user accounts ──────────────────────────────────
  console.log('\n👤 Creating user accounts...')

  // Generate temporary passwords
  const tempPassword1 = randomBytes(6).toString('hex')
  const tempPassword2 = randomBytes(6).toString('hex')

  // We need bcrypt — use the built-in node crypto as a simple hash for now
  // In production, use bcryptjs. For now we'll use a simple approach.
  let bcryptHash
  try {
    const bcrypt = await import('bcryptjs')
    bcryptHash = async (pw) => bcrypt.default.hash(pw, 10)
  } catch {
    try {
      const bcrypt = await import('bcrypt')
      bcryptHash = async (pw) => bcrypt.default.hash(pw, 10)
    } catch {
      console.log('   ⚠️  bcryptjs not installed. Installing...')
      const { execSync } = await import('child_process')
      execSync('npm install bcryptjs', { cwd: join(__dir, '..'), stdio: 'pipe' })
      const bcrypt = await import('bcryptjs')
      bcryptHash = async (pw) => bcrypt.default.hash(pw, 10)
    }
  }

  const hash1 = await bcryptHash(tempPassword1)
  const hash2 = await bcryptHash(tempPassword2)

  // Meliden login
  const existingUser1 = await sql`SELECT id FROM users WHERE email = 'meliden@pritchardspharmacy.co.uk' LIMIT 1`
  if (existingUser1.length === 0) {
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
      VALUES ('meliden@pritchardspharmacy.co.uk', ${hash1}, 'Pritchards', 'Meliden', 'pharmacy_admin', ${melidenId}, true)
    `
    console.log(`   ✅ Meliden login: meliden@pritchardspharmacy.co.uk / ${tempPassword1}`)
  } else {
    console.log('   ⏭️  Meliden user already exists')
  }

  // Victoria Road login
  const existingUser2 = await sql`SELECT id FROM users WHERE email = 'victoriaroad@pritchardspharmacy.co.uk' LIMIT 1`
  if (existingUser2.length === 0) {
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
      VALUES ('victoriaroad@pritchardspharmacy.co.uk', ${hash2}, 'Pritchards', 'Victoria Road', 'pharmacy_admin', ${victoriaId}, true)
    `
    console.log(`   ✅ Victoria Road login: victoriaroad@pritchardspharmacy.co.uk / ${tempPassword2}`)
  } else {
    console.log('   ⏭️  Victoria Road user already exists')
  }

  // ── 3. Create clinicians ─────────────────────────────────────
  console.log('\n🩺 Creating clinicians...')

  const existingClinicians = await sql`SELECT id FROM clinicians WHERE group_slug = 'pritchards'`
  if (existingClinicians.length === 0) {
    await sql`
      INSERT INTO clinicians (group_slug, name, gphc_number, role, is_active)
      VALUES
        ('pritchards', 'Jacqueline Campbell', '2037033', 'Pharmacist', true),
        ('pritchards', 'Charlotte Smith', '2085592', 'Pharmacist', true)
    `
    console.log('   ✅ Jacqueline Campbell (GPhC 2037033)')
    console.log('   ✅ Charlotte Smith (GPhC 2085592)')
  } else {
    console.log('   ⏭️  Clinicians already exist')
  }

  // ── 4. Create appointment types ──────────────────────────────
  console.log('\n📋 Creating appointment types...')

  const existingTypes = await sql`SELECT id FROM appointment_types WHERE group_slug = 'pritchards'`
  if (existingTypes.length === 0) {
    await sql`
      INSERT INTO appointment_types (group_slug, name, duration_minutes, color, requires_details, sort_order, is_active)
      VALUES
        ('pritchards', 'Travel Consultation', 30, '#14B8A6', false, 1, true),
        ('pritchards', 'Flu Vaccination', 10, '#6366F1', false, 2, true),
        ('pritchards', 'Blood Pressure Check', 15, '#DC2626', false, 3, true),
        ('pritchards', 'Weight Management', 20, '#F59E0B', false, 4, true),
        ('pritchards', 'Common Ailments Service', 15, '#3B82F6', true, 5, true),
        ('pritchards', 'Pharmacist Independent Prescribing', 20, '#8B5CF6', true, 6, true),
        ('pritchards', 'General Consultation', 15, '#25b4b4', false, 7, true)
    `
    console.log('   ✅ 7 appointment types created')
  } else {
    console.log('   ⏭️  Appointment types already exist')
  }

  // ── 5. Set default availability ──────────────────────────────
  console.log('\n📅 Setting default clinician availability...')

  const clinicians = await sql`SELECT id, name, gphc_number FROM clinicians WHERE group_slug = 'pritchards'`
  const jacqueline = clinicians.find(c => c.gphc_number === '2037033')
  const charlotte = clinicians.find(c => c.gphc_number === '2085592')

  const existingAvail = await sql`SELECT id FROM clinician_availability WHERE clinician_id = ${jacqueline?.id} LIMIT 1`
  if (existingAvail.length === 0 && jacqueline && charlotte) {
    // Jacqueline at Victoria Road: Mon–Fri 9–5
    for (const day of [1, 2, 3, 4, 5]) {
      await sql`
        INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
        VALUES (${jacqueline.id}, ${victoriaId}, ${day}, '09:00', '17:00', true)
      `
    }
    console.log('   ✅ Jacqueline → Victoria Road Mon–Fri 09:00–17:00')

    // Charlotte at Meliden: Mon–Fri 9–5
    for (const day of [1, 2, 3, 4, 5]) {
      await sql`
        INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
        VALUES (${charlotte.id}, ${melidenId}, ${day}, '09:00', '17:00', true)
      `
    }
    console.log('   ✅ Charlotte → Meliden Mon–Fri 09:00–17:00')
  } else {
    console.log('   ⏭️  Availability already set')
  }

  // ── Done ─────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50))
  console.log('✅ Pritchards Pharmacy setup complete!')
  console.log('═'.repeat(50))
  console.log('\n📌 SAVE THESE LOGIN CREDENTIALS:\n')
  if (existingUser1.length === 0) {
    console.log(`   Meliden:       meliden@pritchardspharmacy.co.uk`)
    console.log(`   Password:      ${tempPassword1}`)
  }
  if (existingUser2.length === 0) {
    console.log(`   Victoria Road: victoriaroad@pritchardspharmacy.co.uk`)
    console.log(`   Password:      ${tempPassword2}`)
  }
  console.log(`\n   Public booking: https://getrealhealth.co.uk/book/pritchards`)
  console.log(`   Dashboard:      https://getrealhealth.co.uk/for-pharmacies/dashboard\n`)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
