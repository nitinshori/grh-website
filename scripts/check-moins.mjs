import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

// Load DATABASE_URL from .env.local
const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/DATABASE_URL=(.+)/)[1].replace(/^["']|["']$/g, '');
const sql = neon(dbUrl);

console.log('=== Moin\'s Chemist pharmacy record ===');
const pharm = await sql`
  SELECT id, slug, name, is_active, created_at
  FROM pharmacies
  WHERE slug = 'moins-chemist' OR LOWER(name) LIKE '%moin%'
`;
console.log(pharm);

console.log('\n=== Staff users (emails ending @moinschemist.co.uk) ===');
const users = await sql`
  SELECT u.id, u.email, u.first_name, u.last_name, u.role,
         u.is_active, u.pharmacy_id, p.slug AS pharmacy_slug, p.name AS pharmacy_name,
         (u.password_hash IS NOT NULL) AS has_password,
         u.created_at
  FROM users u
  LEFT JOIN pharmacies p ON p.id = u.pharmacy_id
  WHERE u.email LIKE '%@moinschemist.co.uk'
  ORDER BY u.role, u.email
`;
console.table(users);

console.log('\n=== ePGDs assigned to Moin\'s Chemist ===');
const pgdCount = await sql`
  SELECT COUNT(*)::int AS count
  FROM pharmacy_pgds pp
  JOIN pharmacies p ON p.id = pp.pharmacy_id
  WHERE p.slug = 'moins-chemist'
`;
console.log('Assigned PGDs:', pgdCount[0]?.count);

console.log('\n=== Recent successful logins (last 7 days) ===');
try {
  const logins = await sql`
    SELECT user_id, action, created_at
    FROM audit_log
    WHERE action IN ('login', 'login_success', 'auth.login')
      AND user_id IN (SELECT id FROM users WHERE email LIKE '%@moinschemist.co.uk')
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 10
  `;
  console.log('Recent login events:', logins.length);
  if (logins.length) console.table(logins);
} catch (e) {
  console.log('audit_log query skipped:', e.message);
}
