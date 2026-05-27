#!/usr/bin/env node
import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'migrations', '018_onboarding_drafts.sql')
const sql = await fs.readFile(sqlPath, 'utf8')

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await pool.query(sql)
  console.log('✅ Migration 018 applied')
  const { rows } = await pool.query(
    `SELECT column_name, is_nullable, data_type
     FROM information_schema.columns
     WHERE table_name = 'onboarding_requests'
       AND column_name IN ('contact_first_name', 'contact_last_name', 'contact_email', 'last_step_completed')
     ORDER BY column_name`,
  )
  for (const r of rows) {
    console.log(`  ${r.column_name}: ${r.data_type} (nullable=${r.is_nullable})`)
  }
} catch (err) {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
