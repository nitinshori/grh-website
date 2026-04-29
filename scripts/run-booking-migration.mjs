#!/usr/bin/env node

/**
 * Run this to set up the booking system tables.
 * Usage:  node scripts/run-booking-migration.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

// Load env
const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local or .env')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function run() {
  console.log('🔧 Running booking system migration...\n')

  const migrationPath = join(__dir, '..', 'src', 'lib', 'db', 'migrations', 'add-booking-system.sql')
  const migration = readFileSync(migrationPath, 'utf-8')

  // Split on semicolons but respect $$ blocks
  const statements = []
  let current = ''
  let inDollarBlock = false

  for (const line of migration.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('--') || trimmed === '') {
      current += line + '\n'
      continue
    }

    if (trimmed.includes('$$')) {
      const count = (trimmed.match(/\$\$/g) || []).length
      if (count % 2 === 1) inDollarBlock = !inDollarBlock
    }

    current += line + '\n'

    if (!inDollarBlock && trimmed.endsWith(';')) {
      const stmt = current.trim()
      // Strip comment-only lines to check if there's real SQL
      const hasSQL = stmt.split('\n').some(l => {
        const t = l.trim()
        return t !== '' && !t.startsWith('--')
      })
      if (hasSQL) {
        statements.push(stmt)
      }
      current = ''
    }
  }

  let success = 0
  let errors = 0

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 80)
    try {
      await sql.query(stmt)
      console.log(`  ✅ ${preview}...`)
      success++
    } catch (err) {
      // Ignore "already exists" type errors
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        console.log(`  ⏭️  ${preview}... (already exists)`)
        success++
      } else {
        console.log(`  ❌ ${preview}...`)
        console.log(`     ${err.message}`)
        errors++
      }
    }
  }

  console.log(`\n✅ Migration complete: ${success} succeeded, ${errors} failed`)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
