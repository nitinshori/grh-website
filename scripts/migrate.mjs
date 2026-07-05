// scripts/migrate.mjs — applies src/lib/db/migrations/*.sql that haven't
// run yet, tracked in grh_migrations. Runs at the start of every build
// (the Vercel build container reaches the database over TCP).
//
// Baseline: everything before 019 was applied by hand historically. If the
// tracker table is empty but the pharmacies table exists, all files below
// 019 are recorded as applied without re-running them.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

try {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
  config({ path: ".env" });
} catch {}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "src", "lib", "db", "migrations");
const BASELINE_BEFORE = "019"; // files sorting below this are assumed applied

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL not set — skipping migrations.");
  process.exit(0);
}

const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS grh_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);

  const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

  const { rows: cnt } = await client.query(`SELECT count(*)::int AS n FROM grh_migrations`);
  if (cnt[0].n === 0) {
    const { rows: t } = await client.query(`SELECT to_regclass('public.pharmacies') AS p`);
    if (t[0].p) {
      for (const f of files) {
        if (f.localeCompare(BASELINE_BEFORE) < 0 || !/^\d/.test(f)) {
          await client.query(
            `INSERT INTO grh_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`,
            [f]
          );
        }
      }
      console.log("[migrate] baseline recorded for pre-019 migrations");
    }
  }

  const { rows: appliedRows } = await client.query(`SELECT name FROM grh_migrations`);
  const applied = new Set(appliedRows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(DIR, file), "utf8");
    console.log(`[migrate] applying ${file} ...`);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO grh_migrations (name) VALUES ($1)`, [file]);
      await client.query("COMMIT");
      console.log(`[migrate] ✓ ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`[migrate] ✗ ${file} failed:`, err.message);
      process.exit(1);
    }
  }
  console.log("[migrate] up to date.");
} finally {
  await client.end();
}
