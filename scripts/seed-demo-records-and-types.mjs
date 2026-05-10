#!/usr/bin/env node
/**
 * Seeds demo data for the marketing video:
 *   - 10 fake consultation records under West Bromwich Pharmacy / John Short
 *     across a mix of PGDs so the dashboard counters and Patient Records
 *     view look populated
 *   - 3 appointment types (ED, UTI, HRT) so the public booking page
 *     /book/west-bromwich-pharmacy shows real options
 *
 * Idempotent — uses ON CONFLICT DO NOTHING and only inserts records whose
 * patients don't already exist for this pharmacy.
 */
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
const sql = neon(process.env.DATABASE_URL)

const PHARMACY_SLUG = 'west-bromwich-pharmacy'
const USER_EMAIL = 'john.short@westbromwichpharmacy.co.uk'

const [pharmacy] = await sql`SELECT id, name, group_slug FROM pharmacies WHERE slug = ${PHARMACY_SLUG} LIMIT 1`
if (!pharmacy) { console.error(`No pharmacy with slug ${PHARMACY_SLUG} — run seed-demo-pharmacy.mjs first`); process.exit(1) }
const [user] = await sql`SELECT id, first_name, last_name FROM users WHERE LOWER(email) = LOWER(${USER_EMAIL}) LIMIT 1`
if (!user) { console.error(`No user ${USER_EMAIL} — run seed-demo-pharmacy.mjs first`); process.exit(1) }

const pharmacistName = `${user.first_name} ${user.last_name}`
const groupSlug = pharmacy.group_slug

// ── 1. Patient consultation records ──────────────────────────────
const PATIENTS = [
  { firstName: 'David',  lastName: 'Bennett',  dob: '1975-03-12', pgd: 'ed',                   medicine: 'Sildenafil 50mg',         dose: '50mg',  duration: '8 tablets', outcome: 'completed' },
  { firstName: 'Aisha',  lastName: 'Khan',     dob: '1992-07-22', pgd: 'uti',                  medicine: 'Nitrofurantoin',          dose: '100mg MR', duration: '3 days',   outcome: 'completed' },
  { firstName: 'Sophie', lastName: 'Wright',   dob: '1968-11-04', pgd: 'hrt',                  medicine: 'Estradiol patch',         dose: '50mcg/24h', duration: '8 weeks',  outcome: 'completed' },
  { firstName: 'Tom',    lastName: 'Patel',    dob: '1988-05-30', pgd: 'hayfever',             medicine: 'Fexofenadine',            dose: '180mg OD', duration: '30 days',   outcome: 'completed' },
  { firstName: 'Karen',  lastName: 'Mitchell', dob: '1955-09-18', pgd: 'shingles-vaccine',     medicine: 'Shingrix',                dose: '0.5ml IM',  duration: 'Single dose', outcome: 'completed' },
  { firstName: 'Ryan',   lastName: 'O\'Connor', dob: '1996-01-25', pgd: 'smoking-nrt',          medicine: 'NRT lozenges',            dose: '4mg',      duration: '12 weeks',  outcome: 'completed' },
  { firstName: 'Priya',  lastName: 'Sharma',   dob: '1985-04-08', pgd: 'period-delay',         medicine: 'Norethisterone',          dose: '5mg TDS',  duration: '7 days',    outcome: 'completed' },
  { firstName: 'Mark',   lastName: 'Wilson',   dob: '1972-08-14', pgd: 'hair-loss',            medicine: 'Finasteride',             dose: '1mg OD',   duration: '90 days',   outcome: 'completed' },
  { firstName: 'Emma',   lastName: 'Davies',   dob: '1990-02-19', pgd: 'thrush',               medicine: 'Fluconazole',             dose: '150mg',    duration: 'Single dose', outcome: 'completed' },
  { firstName: 'Jacob',  lastName: 'Roberts',  dob: '1980-12-03', pgd: 'cold-sores',           medicine: 'Aciclovir cream',         dose: '5%',       duration: '5 days',    outcome: 'completed' },
]

let added = 0
for (const p of PATIENTS) {
  const existing = await sql`
    SELECT id FROM consultation_records
     WHERE pharmacy_id = ${pharmacy.id}
       AND patient_first_name = ${p.firstName}
       AND patient_last_name = ${p.lastName}
       AND pgd_slug = ${p.pgd}
     LIMIT 1
  `
  if (existing[0]) continue

  // Spread the consultation dates across the last 30 days for a realistic dashboard
  const daysAgo = Math.floor(Math.random() * 30)
  const consultationDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

  const clinicalData = JSON.stringify({
    demo: true,
    note: 'Demo record for marketing video. Not a real patient.',
    patient: { firstName: p.firstName, lastName: p.lastName, dateOfBirth: p.dob },
    summary: { pharmacistName, pharmacistGPhC: 'DEMO-9999', clinicalNotes: 'Routine consultation. No concerns flagged.' },
  })

  await sql`
    INSERT INTO consultation_records (
      pharmacy_id, user_id, pgd_slug,
      patient_first_name, patient_last_name, patient_dob,
      clinical_data, outcome,
      medicine_supplied, medicine_dose, medicine_duration,
      pharmacist_name, pharmacist_gphc,
      consultation_date, completed_at
    ) VALUES (
      ${pharmacy.id}, ${user.id}, ${p.pgd},
      ${p.firstName}, ${p.lastName}, ${p.dob},
      ${clinicalData}, ${p.outcome},
      ${p.medicine}, ${p.dose}, ${p.duration},
      ${pharmacistName}, 'DEMO-9999',
      ${consultationDate}, ${consultationDate}
    )
  `
  added++
  console.log(`  + ${p.firstName} ${p.lastName} → ${p.pgd}`)
}
console.log(`\n✅ ${added} demo consultation record(s) added.`)

// ── 2. Appointment types for the booking page ────────────────────
const TYPES = [
  { name: 'Erectile Dysfunction (ED)', duration: 15, color: '#3b82f6' },
  { name: 'Urinary Tract Infection (UTI)', duration: 15, color: '#ec4899' },
  { name: 'HRT / Menopause Consultation', duration: 20, color: '#8b5cf6' },
]

let typesAdded = 0
for (const t of TYPES) {
  const existing = await sql`
    SELECT id FROM appointment_types
     WHERE group_slug = ${groupSlug} AND name = ${t.name}
     LIMIT 1
  `
  if (existing[0]) continue
  await sql`
    INSERT INTO appointment_types (group_slug, name, duration_minutes, color, is_active)
    VALUES (${groupSlug}, ${t.name}, ${t.duration}, ${t.color}, true)
  `
  typesAdded++
  console.log(`  + appointment type: ${t.name} (${t.duration} min)`)
}
console.log(`\n✅ ${typesAdded} appointment type(s) added.`)

console.log()
console.log('Demo dashboard URL  → https://getrealhealthpgd.co.uk/for-pharmacies/dashboard')
console.log(`Public booking URL  → https://getrealhealthpgd.co.uk/book/${groupSlug}`)
