/**
 * Seed script to create the initial super_admin user.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Requires DATABASE_URL environment variable.
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import bcrypt from 'bcryptjs'
import * as schema from '../src/lib/db/schema'
import { eq } from 'drizzle-orm'

async function seed() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const sql = neon(url)
  const db = drizzle(sql, { schema })

  const email = 'admin@getrealhealthpgd.co.uk'
  const password = 'GRH-Admin-2026!'

  // Check if admin already exists
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existing) {
    console.log(`Super admin already exists: ${email}`)
    return
  }

  const hash = await bcrypt.hash(password, 12)

  await db.insert(schema.users).values({
    email,
    passwordHash: hash,
    firstName: 'System',
    lastName: 'Admin',
    role: 'super_admin',
    pharmacyId: null,
    isActive: true,
  })

  console.log('Super admin created successfully:')
  console.log(`  Email: ${email}`)
  console.log(`  Password: ${password}`)
  console.log('')
  console.log('IMPORTANT: Change this password after first login.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
