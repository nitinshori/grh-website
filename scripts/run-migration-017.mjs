#!/usr/bin/env node
/**
 * Run migration 017_pharmacy_pgd_documents.sql against the live DB.
 * Uses the same pg + dotenv stack as the other scripts so we don't need
 * psql installed locally. Idempotent — CREATE TABLE IF NOT EXISTS / CREATE
 * INDEX IF NOT EXISTS throughout.
 */
import dotenv from 'dotenv'
import pg from 'pg'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'migrations', '017_pharmacy_pgd_documents.sql')

const sql = await fs.readFile(sqlPath, 'utf8')
console.log(`Running migration: ${path.basename(sqlPath)}`)
console.log(`  ${sql.split('\n').filter(l => l.trim() && !l.trim().startsWith('--')).length} non-comment lines`)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await pool.query(sql)
  console.log('✅ Migration 017 applied (or already present)')
  // Verify the table exists
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'pharmacy_pgd_documents'
     ORDER BY ordinal_position`,
  )
  console.log(`Table has ${rows.length} columns: ${rows.map(r => r.column_name).join(', ')}`)
} catch (err) {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
