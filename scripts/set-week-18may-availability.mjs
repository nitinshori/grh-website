// One-off: set Nitin's availability for the week of Mon 18 May 2026.
// Slots: 13:00, 14:00, 15:00, 19:00 every weekday EXCEPT no 19:00 on Tuesday.
//
// Writes the date_overrides JSONB on the single booking_availability row.
// Doesn't touch weekly defaults — the overrides take precedence on those
// dates and the defaults still apply on other dates.

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })

const sql = neon(process.env.DATABASE_URL)

const PLAN = {
  '2026-05-18': { slots: ['13:00', '14:00', '15:00', '19:00'] }, // Mon
  '2026-05-19': { slots: ['13:00', '14:00', '15:00'] },          // Tue — no 19:00
  '2026-05-20': { slots: ['13:00', '14:00', '15:00', '19:00'] }, // Wed
  '2026-05-21': { slots: ['13:00', '14:00', '15:00', '19:00'] }, // Thu
  '2026-05-22': { slots: ['13:00', '14:00', '15:00', '19:00'] }, // Fri
}

console.log('Setting date overrides for week of Mon 18 May 2026:')
for (const [date, entry] of Object.entries(PLAN)) {
  console.log(`  ${date}: ${entry.slots.join(', ')}`)
}

// Merge into existing overrides (preserves anything else already set)
const [current] = await sql`SELECT date_overrides FROM booking_availability WHERE id = 1`
const merged = { ...(current?.date_overrides ?? {}), ...PLAN }

await sql`UPDATE booking_availability SET date_overrides = ${JSON.stringify(merged)}, updated_at = NOW() WHERE id = 1`

console.log()
console.log('✅ Done. Edits live on /book within ~30 seconds (config cache TTL).')
console.log('Manage future weeks at https://getrealhealthpgd.co.uk/admin/availability.')
