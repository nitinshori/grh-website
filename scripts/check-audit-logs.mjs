#!/usr/bin/env node
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const sql = neon(process.env.DATABASE_URL)
const r = await sql`SELECT action, user_email, record_count, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10`
console.log(`Total recent audit log entries: ${r.length}`)
for (const row of r) {
  console.log(`  ${row.created_at.toISOString()} | ${row.action} | ${row.user_email || '-'} | records: ${row.record_count ?? '-'}`)
}
