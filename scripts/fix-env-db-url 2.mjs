// Swaps DATABASE_URL ↔ DATABASE_URL_NEW in .env.local so local scripts hit
// the live eu-west-2 DB by default. Renames the old us-east-1 value to
// DATABASE_URL_OLD so we can keep it around as a fallback for 7 days.
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env.local')
const lines = readFileSync(envPath, 'utf8').split('\n')

let oldUrl = null, newUrl = null
const out = []
for (const line of lines) {
  if (line.startsWith('DATABASE_URL=')) {
    oldUrl = line.slice('DATABASE_URL='.length)
  } else if (line.startsWith('DATABASE_URL_NEW=')) {
    newUrl = line.slice('DATABASE_URL_NEW='.length)
  } else {
    out.push(line)
  }
}

if (!newUrl) {
  console.error('No DATABASE_URL_NEW found in .env.local — nothing to swap.')
  process.exit(1)
}

const region = (u) => u.match(/\.([a-z]{2}-[a-z]+-\d+)\./)?.[1] || '?'
console.log(`Old DATABASE_URL region:   ${region(oldUrl)}`)
console.log(`New DATABASE_URL region:   ${region(newUrl)}`)

if (region(newUrl) !== 'eu-west-2') {
  console.error('Refusing to swap — DATABASE_URL_NEW is not in eu-west-2.')
  process.exit(1)
}

// Append the new mappings
out.push(`DATABASE_URL=${newUrl}`)
if (oldUrl) out.push(`DATABASE_URL_OLD=${oldUrl}`)

// Write back, removing any blank lines we accumulated
const finalContent = out.filter((_, i, a) => !(a[i] === '' && a[i+1] === '')).join('\n')
writeFileSync(envPath, finalContent)

console.log()
console.log('✅ .env.local updated:')
console.log('   DATABASE_URL     → eu-west-2 (live)')
console.log('   DATABASE_URL_OLD → us-east-1 (legacy, can delete after 7-day safety net)')
