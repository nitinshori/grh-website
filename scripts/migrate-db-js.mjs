#!/usr/bin/env node
/**
 * Pure-JS DB migration: us-east-1 → eu-west-2.
 *
 * Doesn't need pg_dump/psql on the host. Uses the `pg` driver to:
 *   1. Verify target is empty + UK/EU.
 *   2. Read schema (CREATE TABLE / CREATE TYPE / CREATE INDEX / sequences) from source.
 *   3. Apply schema to target.
 *   4. Stream rows table-by-table via COPY ... TO/FROM STDOUT/STDIN.
 *   5. Verify row counts.
 *
 * Run:  node scripts/migrate-db-js.mjs
 */
import pg from 'pg'
import copyStreams from 'pg-copy-streams'
import { config } from 'dotenv'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dir, '..', '.env.local') })
config({ path: join(__dir, '..', '.env') })

const OLD = process.env.DATABASE_URL
const NEW = process.env.DATABASE_URL_NEW
if (!OLD) { console.error('❌ DATABASE_URL missing'); process.exit(1) }
if (!NEW) { console.error('❌ DATABASE_URL_NEW missing'); process.exit(1) }
if (OLD === NEW) { console.error('❌ source and target are identical'); process.exit(1) }

// ── Region check ───────────────────────────────────────
const newHost = NEW.match(/@([^/:]+)/)?.[1]
const newRegion = newHost?.match(/\.([a-z]{2}-[a-z]+-\d+)\./)?.[1]
console.log(`Target host:   ${newHost}`)
console.log(`Target region: ${newRegion}`)
if (!newRegion || !/^eu-/.test(newRegion)) {
  console.error('❌ Target is not in an EU region.')
  process.exit(1)
}
console.log('✅ Target is UK/EU.\n')

const srcCfg = { connectionString: OLD, ssl: { rejectUnauthorized: false } }
const tgtCfg = { connectionString: NEW, ssl: { rejectUnauthorized: false } }

const src = new pg.Client(srcCfg)
const tgt = new pg.Client(tgtCfg)

await src.connect()
await tgt.connect()

// ── Pre-flight ─────────────────────────────────────────
console.log('Pre-flight checks...')
const srcVer = await src.query('SELECT version()')
console.log(`  source online: ${srcVer.rows[0].version.split(' ').slice(0,2).join(' ')}`)
const tgtTables = await tgt.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'")
console.log(`  target online: ${tgtTables.rows[0].n} table(s) in target public schema`)
if (tgtTables.rows[0].n > 0) {
  console.error('❌ Target has tables already. Use a fresh empty database.')
  await src.end(); await tgt.end()
  process.exit(1)
}
console.log('✅ Target is empty.\n')

// ── 1. Enums ───────────────────────────────────────────
console.log('1. Copying enum types...')
const enums = await src.query(`
  SELECT t.typname AS name,
         array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
   WHERE n.nspname = 'public'
   GROUP BY t.typname
`)
for (const e of enums.rows) {
  const sql = `CREATE TYPE "${e.name}" AS ENUM (${e.labels.map(l => `'${l.replace(/'/g, "''")}'`).join(', ')});`
  await tgt.query(sql)
  console.log(`  ✓ ${e.name} (${e.labels.length} values)`)
}

// ── 2. Tables ──────────────────────────────────────────
console.log('\n2. Copying table definitions...')
const tablesRes = await src.query(`
  SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
   ORDER BY table_name
`)
const tableNames = tablesRes.rows.map(r => r.table_name)
console.log(`  source has ${tableNames.length} table(s):`, tableNames.join(', '))

// Helper: build CREATE TABLE SQL from information_schema
async function buildCreateTable(tname) {
  const cols = await src.query(`
    SELECT column_name, data_type, udt_name, character_maximum_length,
           numeric_precision, numeric_scale, is_nullable, column_default
      FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1
     ORDER BY ordinal_position
  `, [tname])

  const colDefs = cols.rows.map(c => {
    let type
    if (c.data_type === 'USER-DEFINED') type = `"${c.udt_name}"`
    else if (c.data_type === 'ARRAY') type = c.udt_name.replace(/^_/, '') + '[]'
    else if (c.data_type === 'character varying' && c.character_maximum_length) type = `varchar(${c.character_maximum_length})`
    else if (c.data_type === 'character varying') type = 'varchar'
    else if (c.data_type === 'numeric' && c.numeric_precision) type = `numeric(${c.numeric_precision}${c.numeric_scale ? ',' + c.numeric_scale : ''})`
    else if (c.data_type === 'timestamp without time zone') type = 'timestamp'
    else if (c.data_type === 'timestamp with time zone') type = 'timestamptz'
    else if (c.data_type === 'time without time zone') type = 'time'
    else type = c.data_type

    let def = `"${c.column_name}" ${type}`
    if (c.is_nullable === 'NO') def += ' NOT NULL'
    if (c.column_default !== null) def += ` DEFAULT ${c.column_default}`
    return def
  })

  return `CREATE TABLE "${tname}" (\n  ${colDefs.join(',\n  ')}\n);`
}

for (const tname of tableNames) {
  const sql = await buildCreateTable(tname)
  await tgt.query(sql)
  console.log(`  ✓ table ${tname}`)
}

// ── 3. Primary keys, unique constraints, foreign keys ──
console.log('\n3. Copying constraints...')
const constraints = await src.query(`
  SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    pg_get_constraintdef(c.oid) AS definition
  FROM information_schema.table_constraints tc
  JOIN pg_constraint c ON c.conname = tc.constraint_name
  JOIN pg_namespace n ON n.oid = c.connamespace AND n.nspname = tc.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('PRIMARY KEY','UNIQUE','FOREIGN KEY','CHECK')
  ORDER BY CASE tc.constraint_type
             WHEN 'PRIMARY KEY' THEN 1
             WHEN 'UNIQUE' THEN 2
             WHEN 'CHECK' THEN 3
             WHEN 'FOREIGN KEY' THEN 4
           END
`)
// We'll add PK/UNIQUE/CHECK now, but FKs after data load
const nonFK = constraints.rows.filter(c => c.constraint_type !== 'FOREIGN KEY')
const fks = constraints.rows.filter(c => c.constraint_type === 'FOREIGN KEY')

for (const c of nonFK) {
  const sql = `ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" ${c.definition};`
  try {
    await tgt.query(sql)
    console.log(`  ✓ ${c.constraint_type.toLowerCase()}: ${c.table_name}.${c.constraint_name}`)
  } catch (e) {
    console.log(`  ⚠ skip ${c.constraint_name}: ${e.message.split('\n')[0]}`)
  }
}

// ── 4. Indexes (non-PK/UNIQUE indexes) ─────────────────
console.log('\n4. Copying indexes...')
const indexes = await src.query(`
  SELECT indexname, indexdef
    FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname NOT IN (
       SELECT conname FROM pg_constraint WHERE contype IN ('p','u')
     )
`)
for (const i of indexes.rows) {
  try {
    await tgt.query(i.indexdef)
    console.log(`  ✓ index ${i.indexname}`)
  } catch (e) {
    console.log(`  ⚠ skip index ${i.indexname}: ${e.message.split('\n')[0]}`)
  }
}

// ── 5. Data via COPY ───────────────────────────────────
console.log('\n5. Copying data...')
const sourceCounts = {}
const targetCounts = {}
for (const tname of tableNames) {
  const cnt = await src.query(`SELECT count(*)::int AS n FROM "${tname}"`)
  sourceCounts[tname] = cnt.rows[0].n
  if (cnt.rows[0].n === 0) {
    console.log(`  • ${tname}: 0 rows (skipped)`)
    targetCounts[tname] = 0
    continue
  }

  const out = src.query(copyStreams.to(`COPY "${tname}" TO STDOUT WITH (FORMAT BINARY)`))
  const inp = tgt.query(copyStreams.from(`COPY "${tname}" FROM STDIN WITH (FORMAT BINARY)`))
  await pipeline(out, inp)

  const tcnt = await tgt.query(`SELECT count(*)::int AS n FROM "${tname}"`)
  targetCounts[tname] = tcnt.rows[0].n
  const ok = tcnt.rows[0].n === cnt.rows[0].n
  console.log(`  ${ok ? '✓' : '✗'} ${tname}: ${tcnt.rows[0].n}/${cnt.rows[0].n}`)
}

// ── 6. Foreign keys ────────────────────────────────────
console.log('\n6. Adding foreign keys...')
for (const c of fks) {
  const sql = `ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" ${c.definition};`
  try {
    await tgt.query(sql)
    console.log(`  ✓ FK ${c.table_name}.${c.constraint_name}`)
  } catch (e) {
    console.log(`  ⚠ skip ${c.constraint_name}: ${e.message.split('\n')[0]}`)
  }
}

// ── 7. Sequence values ─────────────────────────────────
console.log('\n7. Resetting sequences...')
const seqs = await src.query(`
  SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public'
`)
for (const s of seqs.rows) {
  const v = await src.query(`SELECT last_value FROM "${s.sequence_name}"`)
  await tgt.query(`SELECT setval('"${s.sequence_name}"', $1)`, [v.rows[0].last_value])
  console.log(`  ✓ ${s.sequence_name} = ${v.rows[0].last_value}`)
}

// ── 8. Final verification ──────────────────────────────
console.log('\n8. Verification')
const mismatches = tableNames.filter(t => sourceCounts[t] !== targetCounts[t])
if (mismatches.length > 0) {
  console.error('❌ Row count mismatches:')
  for (const t of mismatches) console.error(`  ${t}: source=${sourceCounts[t]}, target=${targetCounts[t]}`)
  await src.end(); await tgt.end()
  process.exit(2)
}
console.log('✅ All row counts match.')

await src.end(); await tgt.end()

console.log('\n────────────────────────────────────────')
console.log('✅ Migration complete.')
console.log('Next:')
console.log('  1. Update Vercel DATABASE_URL to:')
console.log(`     ${NEW.replace(/:[^@]+@/, ':***@')}`)
console.log('  2. Redeploy.')
console.log('  3. Verify production loads.')
console.log('  4. Keep us-east-1 project for 7 days as a safety net.')
