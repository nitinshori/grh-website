#!/usr/bin/env node
/**
 * Reports the Neon region from DATABASE_URL. Region is encoded in the
 * hostname (e.g. ep-cool-pond-12345.eu-west-2.aws.neon.tech).
 */
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not found'); process.exit(1) }

const hostMatch = url.match(/@([^/:]+)/)
const host = hostMatch?.[1]
console.log(`Database host: ${host}`)

// Pull the region segment — Neon hosts look like
// "ep-{name}-{id}.{region}.{cloud}.neon.tech" e.g. "...eu-west-2.aws.neon.tech"
const regionMatch = host?.match(/\.([a-z]{2}-[a-z]+-\d+)\./)
const region = regionMatch?.[1]
console.log(`Region: ${region || '(could not parse)'}`)

if (region) {
  if (/^eu-/.test(region) || /^uk-/.test(region)) {
    console.log('\n✅ UK/EU region — UK GDPR data residency OK.')
  } else if (/^us-/.test(region) || /^ap-/.test(region)) {
    console.log('\n⚠️  Non-UK/EU region. UK patient PHI should not live here.')
    console.log('   See docs/db-region-check.md for migration steps.')
  } else {
    console.log(`\n? Unrecognised region "${region}" — verify in Neon console.`)
  }
}
