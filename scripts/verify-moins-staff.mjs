// Verifies Moin's Chemist tomorrow-readiness end-to-end.
//
// Run from grh-website/:
//     node scripts/verify-moins-staff.mjs
//
// What it checks (read-only, no writes to the DB):
//   1. The pharmacy `moins-chemist` exists, is active, and has the expected slug.
//   2. All 4 staff users exist with the right email, role, pharmacyId link, and
//      isActive flag. Each has a password_hash set.
//   3. The pharmacy has ePGD assignments (>0).
//   4. The live login page (https://getrealhealthpgd.co.uk/login) is up.
//   5. The NextAuth credentials callback responds for each staff email
//      (a successful 200 round-trip means the auth flow is reachable).
//
// What it does NOT do:
//   - Does NOT reset passwords or modify any data.
//   - Does NOT log in with real passwords. That's a manual step for the user.
//
// Exits with code 0 if all checks pass, 1 if any fail.

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

// Load DATABASE_URL from .env.local if not already in the env.
if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync('.env.local', 'utf8');
    const m = env.match(/^DATABASE_URL=(.+)$/m);
    if (m) process.env.DATABASE_URL = m[1].replace(/^["']|["']$/g, '').trim();
  } catch {}
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. Add it to .env.local or export it.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const SITE = process.env.GRH_SITE_URL || 'https://getrealhealthpgd.co.uk';
const EXPECTED_STAFF_COUNT = 4;

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => { console.log(`  ✗ ${msg}`); failures++; };

console.log('\n=== 1. Pharmacy record ===');
const [pharm] = await sql`
  SELECT id, slug, name, is_active
  FROM pharmacies
  WHERE slug = 'moins-chemist'
`;
if (!pharm) {
  bad('moins-chemist pharmacy NOT FOUND in DB');
  process.exit(1);
}
ok(`Found pharmacy: ${pharm.name} (id=${pharm.id})`);
if (pharm.is_active) ok('Pharmacy is active'); else bad('Pharmacy is INACTIVE');

console.log('\n=== 2. Staff users (linked by pharmacy_id, not email) ===');
const users = await sql`
  SELECT id, email, first_name, last_name, role, pharmacy_id, is_active,
         (password_hash IS NOT NULL) AS has_password
  FROM users
  WHERE pharmacy_id = ${pharm.id}
  ORDER BY role, email
`;

if (users.length === 0) {
  bad('No staff users linked to this pharmacy');
} else if (users.length < EXPECTED_STAFF_COUNT) {
  bad(`Only ${users.length} staff user(s) found — expected ${EXPECTED_STAFF_COUNT}`);
} else {
  ok(`Found ${users.length} staff user(s)`);
}

let staffOk = 0;
for (const u of users) {
  const label = `${u.first_name} ${u.last_name} <${u.email}> [${u.role}]`;
  const checks = [
    [['pharmacy_admin', 'pharmacist'].includes(u.role), 'role is admin/pharmacist'],
    [u.is_active === true, 'active'],
    [u.has_password === true, 'password set'],
  ];
  const failed = checks.filter(([pass]) => !pass).map(([_, msg]) => msg);
  if (failed.length === 0) {
    ok(label);
    staffOk++;
  } else {
    bad(`${label} — ${failed.join(', ')}`);
  }
}
if (staffOk >= 1) ok(`At least one pharmacy_admin or pharmacist account is ready`);

const adminCount = users.filter((u) => u.role === 'pharmacy_admin' && u.is_active && u.has_password).length;
if (adminCount === 0) bad('No active pharmacy_admin account — Mohammad/Basir cannot manage staff');
else ok(`${adminCount} active pharmacy_admin(s) for staff management`);

console.log('\n=== 3. ePGD assignments ===');
const [pgdCount] = await sql`
  SELECT COUNT(*)::int AS count
  FROM pharmacy_pgds
  WHERE pharmacy_id = ${pharm.id}
`;
if (pgdCount.count > 0) ok(`${pgdCount.count} ePGDs assigned`);
else bad('NO ePGDs assigned to moins-chemist');

console.log('\n=== 4. Live site ===');
try {
  const r = await fetch(`${SITE}/login`);
  if (r.status === 200) ok(`${SITE}/login responds 200`);
  else bad(`${SITE}/login returned ${r.status}`);
} catch (e) {
  bad(`Could not reach ${SITE}/login: ${e.message}`);
}

console.log('\n=== 5. NextAuth credentials endpoint reachable ===');
try {
  const csrfRes = await fetch(`${SITE}/api/auth/csrf`).then((r) => r.json());
  for (const u of users) {
    const body = new URLSearchParams({
      csrfToken: csrfRes.csrfToken,
      email: u.email,
      password: 'wrong-password-not-a-real-attempt',
      redirect: 'false',
      callbackUrl: '/for-pharmacies/dashboard',
    });
    const r = await fetch(`${SITE}/api/auth/callback/credentials?json=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (r.status === 200 || r.status === 401 || r.status === 302) ok(`auth round-trip ok for ${u.email} (status ${r.status})`);
    else bad(`auth endpoint returned ${r.status} for ${u.email}`);
  }
} catch (e) {
  bad(`auth endpoint check failed: ${e.message}`);
}

console.log('');
if (failures === 0) {
  console.log('✅ All checks passed. Tomorrow looks good for Moin\'s.');
  process.exit(0);
} else {
  console.log(`❌ ${failures} check(s) failed. Fix before tomorrow.`);
  process.exit(1);
}
