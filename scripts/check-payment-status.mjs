// Print every pharmacy's GoCardless subscription state.
//
// Run from grh-website/:
//   node scripts/check-payment-status.mjs
//
// Optionally filter by name fragment:
//   node scripts/check-payment-status.mjs moin
//   node scripts/check-payment-status.mjs syed
//
// Shows for each onboarding request / pharmacy:
//   - the pharmacy name
//   - the contact email / owner name
//   - mandate status (pending_submission / active / cancelled / failed)
//   - subscription ID (if created — means admin has approved and billing is live)
//   - last billing date / next billing date if known
//
// Read-only. Hits both the local DB and GoCardless API for real-time status.

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const filter = (process.argv[2] || '').toLowerCase()

const GC_TOKEN = process.env.GOCARDLESS_ACCESS_TOKEN
const GC_ENV = process.env.GOCARDLESS_ENVIRONMENT || 'live'
const GC_BASE =
  GC_ENV === 'sandbox'
    ? 'https://api-sandbox.gocardless.com'
    : 'https://api.gocardless.com'

async function gc(path) {
  if (!GC_TOKEN) return null
  try {
    const r = await fetch(`${GC_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${GC_TOKEN}`,
        'GoCardless-Version': '2015-07-06',
        Accept: 'application/json',
      },
    })
    if (!r.ok) return { error: `${r.status} ${r.statusText}` }
    return await r.json()
  } catch (e) {
    return { error: String(e.message || e).slice(0, 80) }
  }
}

console.log(`\n=== GoCardless status (env: ${GC_ENV}) ===\n`)

// Discover the actual schema first so this script is portable
const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'onboarding_requests' ORDER BY ordinal_position
`
const colNames = cols.map((c) => c.column_name)
console.log(`(onboarding_requests columns: ${colNames.join(', ')})\n`)

const rows = await sql`SELECT * FROM onboarding_requests ORDER BY created_at DESC`

const filtered = filter
  ? rows.filter(
      (r) =>
        (r.pharmacy_name || '').toLowerCase().includes(filter) ||
        (r.contact_name || '').toLowerCase().includes(filter) ||
        (r.contact_email || '').toLowerCase().includes(filter),
    )
  : rows

if (filtered.length === 0) {
  console.log(`No onboarding records found${filter ? ` matching "${filter}"` : ''}.`)
  process.exit(0)
}

// Pick the right column names dynamically
const nameCol = colNames.includes('first_name')
  ? (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim()
  : colNames.includes('contact_name')
    ? (r) => r.contact_name
    : colNames.includes('owner_name')
      ? (r) => r.owner_name
      : (r) => r.contact_email
const feeCol = colNames.find((c) => c.includes('fee') && c.includes('pence'))

for (const r of filtered) {
  console.log('─'.repeat(72))
  console.log(`${r.pharmacy_name}`)
  console.log(`  Owner:    ${nameCol(r)} <${r.contact_email}>`)
  console.log(`  Status:   ${r.status}`)
  console.log(`  Monthly:  ${feeCol && r[feeCol] ? '£' + (r[feeCol] / 100).toFixed(2) : '(not set)'}`)
  console.log(`  Created:  ${(r.created_at?.toISOString?.() || String(r.created_at)).slice(0, 19)}`)

  if (r.gocardless_mandate_id) {
    const m = await gc(`/mandates/${r.gocardless_mandate_id}`)
    if (m?.mandates) {
      const md = m.mandates
      console.log(`  Mandate:  ${md.id} → ${md.status}${md.scheme ? ' (' + md.scheme + ')' : ''}`)
    } else if (m?.error) {
      console.log(`  Mandate:  ${r.gocardless_mandate_id} (GC API error: ${m.error})`)
    } else {
      console.log(`  Mandate:  ${r.gocardless_mandate_id}`)
    }
  } else {
    console.log(`  Mandate:  (none — direct debit not authorised)`)
  }

  if (r.gocardless_subscription_id) {
    const s = await gc(`/subscriptions/${r.gocardless_subscription_id}`)
    if (s?.subscriptions) {
      const sd = s.subscriptions
      console.log(`  Sub:      ${sd.id} → ${sd.status}`)
      if (sd.upcoming_payments?.length) {
        const next = sd.upcoming_payments[0]
        console.log(`  Next bill: ${next.charge_date} — £${(next.amount / 100).toFixed(2)}`)
      }
    } else if (s?.error) {
      console.log(`  Sub:      ${r.gocardless_subscription_id} (GC API error: ${s.error})`)
    }

    // Also list any payments that have been collected
    const p = await gc(`/payments?subscription=${r.gocardless_subscription_id}&limit=5`)
    if (p?.payments?.length) {
      console.log(`  Payments collected:`)
      for (const pay of p.payments) {
        console.log(`    ${pay.charge_date}  £${(pay.amount / 100).toFixed(2)}  ${pay.status}`)
      }
    } else if (p?.payments) {
      console.log(`  Payments: (none yet — subscription created but no charges fired)`)
    }
  } else {
    console.log(`  Sub:      (no subscription — admin hasn't approved yet, so no billing)`)
  }
  console.log('')
}

console.log('─'.repeat(72))
console.log('')
console.log('Status legend:')
console.log('  started         — filled signup form but no DD yet')
console.log('  dd_pending      — clicked through to GoCardless but not back')
console.log('  awaiting_approval — DD authorised, waiting on admin approval')
console.log('  completed       — admin approved, subscription created, password setup ready')
console.log('')
console.log('Mandate status legend:')
console.log('  pending_submission — bank not yet notified (usual immediately after signup)')
console.log('  submitted          — bank has been notified, waiting for confirmation (~3 days)')
console.log('  active             — confirmed by bank, can collect payments')
console.log('  cancelled / failed — direct debit cancelled or rejected')
console.log('')
