import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)

const r = await sql`
  SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
         p.id AS pharmacy_id, p.name AS pharmacy_name, p.slug AS pharmacy_slug
    FROM users u
    LEFT JOIN pharmacies p ON p.id = u.pharmacy_id
   WHERE u.first_name ILIKE '%jane%' OR u.last_name ILIKE '%wilkins%' OR u.email ILIKE '%pph%' OR u.email ILIKE '%jane%'
   ORDER BY u.created_at DESC
`
console.table(r)
