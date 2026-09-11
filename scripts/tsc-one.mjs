#!/usr/bin/env node
// Type-check one ePGD tool folder (and whatever it imports) with the
// project's tsconfig. Usage: node scripts/tsc-one.mjs <slug> [<slug>...]
import { writeFileSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const slugs = process.argv.slice(2)
if (!slugs.length) { console.error('usage: tsc-one <slug>'); process.exit(2) }
const cfg = {
  extends: './tsconfig.json',
  compilerOptions: { noEmit: true, incremental: false },
  include: ['next-env.d.ts', 'src/types/**/*.ts', ...slugs.map(s => `src/app/for-pharmacies/epgd/${s}/**/*.ts*`)],
  exclude: ['**/*.bak*', 'node_modules'],
}
const f = `tsconfig.one-${process.pid}.json`
writeFileSync(f, JSON.stringify(cfg))
const r = spawnSync('npx', ['tsc', '-p', f], { stdio: 'inherit' })
unlinkSync(f)
process.exit(r.status ?? 1)
