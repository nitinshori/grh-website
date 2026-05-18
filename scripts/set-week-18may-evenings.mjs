// Update Nitin's availability for the week of Mon 18 May 2026:
//   Mon  18 May — 19:00, 19:30, 20:00, 20:30 (7-9pm)
//   Tue  19 May — blocked (existing 13:30 Maybush booking stays on calendar)
//   Wed  20 May — 19:00, 19:30, 20:00, 20:30 (7-9pm)
//   Thu  21 May — blocked
//   Fri  22 May — blocked
//
// Replaces any previous overrides for these dates.

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const PLAN = {
  '2026-05-18': { slots: ['19:00', '19:30', '20:00', '20:30'] },  // Mon — evenings
  '2026-05-19': { blocked: true },                                 // Tue — only the existing 13:30 booking
  '2026-05-20': { slots: ['19:00', '19:30', '20:00', '20:30'] },  // Wed — evenings
  '2026-05-21': { blocked: true },                                 // Thu — blocked
  '2026-05-22': { blocked: true },                                 // Fri — blocked
}

console.log('Setting overrides for week of Mon 18 May 2026:')
for (const [date, entry] of Object.entries(PLAN)) {
  if ('blocked' in entry) console.log(`  ${date}: BLOCKED`)
  else console.log(`  ${date}: ${entry.slots.join(', ')}`)
}

const [current] = await sql`SELECT date_overrides FROM booking_availability WHERE id = 1`
const merged = { ...(current?.date_overrides ?? {}), ...PLAN }

await sql`UPDATE booking_availability SET date_overrides = ${JSON.stringify(merged)}, updated_at = NOW() WHERE id = 1`

console.log()
console.log('✅ Saved. Live on /book within ~30 seconds.')
console.log('   Existing Tue 19 May 13:30 booking with Raghu Mamullapally is unaffected.')
console.log('   Manage future weeks at /admin/availability.')
