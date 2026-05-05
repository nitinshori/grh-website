#!/usr/bin/env node

/**
 * Seed script for Moin's Chemist & Wellbeing Centre
 * Run AFTER run-booking-migration.mjs (tables must already exist).
 * Usage:  node scripts/seed-moins-chemist.mjs
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
  console.log('🏥 Seeding Moin\'s Chemist & Wellbeing Centre...\n')

  // ── 1. Create pharmacy site ──────────────────────────────────
  console.log('📍 Creating pharmacy site...')

  const existing = await sql`SELECT id FROM pharmacies WHERE group_slug = 'moins-chemist' LIMIT 1`
  if (existing.length > 0) {
    console.log('   ⏭️  Moin\'s Chemist already exists, skipping site creation')
  } else {
    await sql`
      INSERT INTO pharmacies (name, slug, group_slug, address, brand_color, brand_name, is_active)
      VALUES
        ('Moin''s Chemist & Wellbeing Centre', 'moins-chemist', 'moins-chemist', '137a East Park Road, Leicester, LE5 5AZ', '#1e3a5f', 'Moin''s Chemist', true)
    `
    console.log('   ✅ Created Moin\'s Chemist & Wellbeing Centre')
  }

  // Get site ID
  const sites = await sql`SELECT id, slug FROM pharmacies WHERE group_slug = 'moins-chemist'`
  const siteId = sites[0]?.id

  if (!siteId) {
    console.error('❌ Could not find site ID')
    process.exit(1)
  }

  // ── 2. Create user accounts ──────────────────────────────────
  console.log('\n👤 Creating user accounts...')

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

  // Four users as requested
  const users = [
    { email: 'mohammad.kolia@moinschemist.co.uk', firstName: 'Mohammad', lastName: 'Kolia', role: 'pharmacy_admin' },
    { email: 'moinuddin.kolia@moinschemist.co.uk', firstName: 'Moinuddin', lastName: 'Kolia', role: 'pharmacist' },
    { email: 'muhammad.alam@moinschemist.co.uk', firstName: 'Muhammad', lastName: 'Alam', role: 'pharmacist' },
    { email: 'basir.jariwala@moinschemist.co.uk', firstName: 'Basir', lastName: 'Jariwala', role: 'pharmacy_admin' },
  ]

  const credentials = []

  for (const u of users) {
    const existingUser = await sql`SELECT id FROM users WHERE email = ${u.email} LIMIT 1`
    if (existingUser.length === 0) {
      const tempPassword = randomBytes(6).toString('hex')
      const hash = await bcryptHash(tempPassword)
      await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
        VALUES (${u.email}, ${hash}, ${u.firstName}, ${u.lastName}, ${u.role}, ${siteId}, true)
      `
      credentials.push({ name: `${u.firstName} ${u.lastName}`, email: u.email, password: tempPassword, role: u.role })
      console.log(`   ✅ ${u.firstName} ${u.lastName} (${u.role}): ${u.email}`)
    } else {
      console.log(`   ⏭️  ${u.firstName} ${u.lastName} already exists`)
    }
  }

  // ── 3. Create clinicians ─────────────────────────────────────
  console.log('\n🩺 Creating clinicians...')

  const existingClinicians = await sql`SELECT id FROM clinicians WHERE group_slug = 'moins-chemist'`
  if (existingClinicians.length === 0) {
    await sql`
      INSERT INTO clinicians (group_slug, name, gphc_number, role, is_active)
      VALUES
        ('moins-chemist', 'Mohammad Kolia', '2082423', 'Pharmacist', true),
        ('moins-chemist', 'Moinuddin Kolia', NULL, 'Pharmacist', true),
        ('moins-chemist', 'Muhammad Alam', NULL, 'Pharmacist', true),
        ('moins-chemist', 'Basir Jariwala', NULL, 'Pharmacy Manager', true)
    `
    console.log('   ✅ Mohammad Kolia (GPhC 2082423)')
    console.log('   ✅ Moinuddin Kolia')
    console.log('   ✅ Muhammad Alam')
    console.log('   ✅ Basir Jariwala')
  } else {
    console.log('   ⏭️  Clinicians already exist')
  }

  // ── 4. Create appointment types ──────────────────────────────
  console.log('\n📋 Creating appointment types...')

  const existingTypes = await sql`SELECT id FROM appointment_types WHERE group_slug = 'moins-chemist'`
  if (existingTypes.length === 0) {
    await sql`
      INSERT INTO appointment_types (group_slug, name, duration_minutes, color, requires_details, sort_order, is_active)
      VALUES
        ('moins-chemist', 'Meningitis ACWY Vaccination', 15, '#6366F1', false, 1, true),
        ('moins-chemist', 'Period Delay Consultation', 15, '#EC4899', false, 2, true),
        ('moins-chemist', 'UTI Consultation', 15, '#DC2626', false, 3, true),
        ('moins-chemist', 'Ear Infection (Acute Otitis Media)', 15, '#F59E0B', true, 4, true),
        ('moins-chemist', 'Weight Management', 20, '#14B8A6', false, 5, true),
        ('moins-chemist', 'Travel Consultation', 30, '#3B82F6', false, 6, true),
        ('moins-chemist', 'General Consultation', 15, '#25b4b4', false, 7, true)
    `
    console.log('   ✅ 7 appointment types created')
  } else {
    console.log('   ⏭️  Appointment types already exist')
  }

  // ── 5. Set default availability ──────────────────────────────
  console.log('\n📅 Setting default clinician availability...')

  const clinicianRows = await sql`SELECT id, name, gphc_number FROM clinicians WHERE group_slug = 'moins-chemist'`
  const mohammad = clinicianRows.find(c => c.gphc_number === '2082423')

  const existingAvail = await sql`
    SELECT id FROM clinician_availability
    WHERE clinician_id IN (${sql(clinicianRows.map(c => c.id))})
    LIMIT 1
  `

  if (existingAvail.length === 0 && mohammad) {
    // Mohammad Kolia: Mon–Fri 9–6, Sat 9–1 (typical pharmacy hours)
    for (const day of [1, 2, 3, 4, 5]) {
      await sql`
        INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
        VALUES (${mohammad.id}, ${siteId}, ${day}, '09:00', '18:00', true)
      `
    }
    // Saturday
    await sql`
      INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
      VALUES (${mohammad.id}, ${siteId}, 6, '09:00', '13:00', true)
    `
    console.log('   ✅ Mohammad Kolia → Mon–Fri 09:00–18:00, Sat 09:00–13:00')

    // Other clinicians — set basic Mon–Fri 9–6 (can be adjusted in admin)
    for (const clinician of clinicianRows.filter(c => c.gphc_number !== '2082423')) {
      for (const day of [1, 2, 3, 4, 5]) {
        await sql`
          INSERT INTO clinician_availability (clinician_id, pharmacy_id, day_of_week, start_time, end_time, is_active)
          VALUES (${clinician.id}, ${siteId}, ${day}, '09:00', '18:00', true)
        `
      }
      console.log(`   ✅ ${clinician.name} → Mon–Fri 09:00–18:00`)
    }
  } else {
    console.log('   ⏭️  Availability already set')
  }

  // ── 6. Assign PGDs ──────────────────────────────────────────
  console.log('\n📄 Assigning PGDs...')

  // Priority PGDs (asap): Meningitis ACWY, Period delay
  // Secondary PGDs: UTI, Acute otitis media, Weight management, Travel clinic
  const pgdSlugs = [
    // Priority
    'meningitis-acwy-travel',
    'period-delay',
    // Secondary
    'uti',
    'ear-infection',
    'wegovy',
    'mounjaro',
    'saxenda',
    'glp1-monitoring',
    'orlistat',
    'travel-core',
    'anti-malarials',
  ]

  for (const slug of pgdSlugs) {
    const existingPgd = await sql`
      SELECT id FROM pharmacy_pgds WHERE pharmacy_id = ${siteId} AND pgd_slug = ${slug} LIMIT 1
    `
    if (existingPgd.length === 0) {
      await sql`
        INSERT INTO pharmacy_pgds (pharmacy_id, pgd_slug) VALUES (${siteId}, ${slug})
      `
      console.log(`   ✅ ${slug}`)
    } else {
      console.log(`   ⏭️  ${slug} already assigned`)
    }
  }

  console.log('\n   ⚠️  NOTE: "Period delay (Norethisterone)" PGD does not exist in the catalogue yet.')
  console.log('   It needs to be created before it can be assigned.')

  // ── Done ─────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55))
  console.log('✅ Moin\'s Chemist & Wellbeing Centre setup complete!')
  console.log('═'.repeat(55))

  if (credentials.length > 0) {
    console.log('\n📌 SAVE THESE LOGIN CREDENTIALS:\n')
    for (const c of credentials) {
      console.log(`   ${c.name} (${c.role})`)
      console.log(`   Email:    ${c.email}`)
      console.log(`   Password: ${c.password}`)
      console.log('')
    }
  }

  console.log('📌 IMPORTANT NOTES:')
  console.log('   • Email addresses are placeholders — update to real emails before sharing')
  console.log('   • Availability hours are defaults — adjustable in admin panel')
  console.log('   • GPhC numbers needed for Moinuddin, Muhammad, and Basir')
  console.log('   • Period delay PGD needs creating in the catalogue')
  console.log('')
  console.log(`   Public booking:  https://getrealhealthpgd.co.uk/book/moins-chemist`)
  console.log(`   Dashboard:       https://getrealhealthpgd.co.uk/for-pharmacies/dashboard`)
  console.log('')
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
