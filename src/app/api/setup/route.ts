/**
 * One-time setup route to create database tables and seed the super admin.
 * DELETE THIS FILE after running the setup.
 */
import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  // Simple protection
  if (key !== 'grh-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const results: string[] = []

  try {
    // 1. Create enum
    await sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('super_admin', 'pharmacy_admin', 'pharmacist');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `
    results.push('Created user_role enum')

    // 2. Create pharmacies table
    await sql`
      CREATE TABLE IF NOT EXISTS pharmacies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `
    results.push('Created pharmacies table')

    // 3. Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role user_role NOT NULL DEFAULT 'pharmacist',
        pharmacy_id UUID REFERENCES pharmacies(id),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `
    results.push('Created users table')

    // 4. Create pharmacy_pgds table
    await sql`
      CREATE TABLE IF NOT EXISTS pharmacy_pgds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
        pgd_slug VARCHAR(255) NOT NULL,
        assigned_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `
    results.push('Created pharmacy_pgds table')

    // 5. Create unique index
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS pharmacy_pgd_unique
      ON pharmacy_pgds(pharmacy_id, pgd_slug)
    `
    results.push('Created pharmacy_pgd_unique index')

    // 6. Seed super admin
    const email = 'admin@getrealhealthpgd.co.uk'
    const password = 'GRH-Admin-2026!'

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `

    if (existing.length > 0) {
      results.push('Super admin already exists')
    } else {
      const hash = await bcrypt.hash(password, 12)
      await sql`
        INSERT INTO users (email, password_hash, first_name, last_name, role, pharmacy_id, is_active)
        VALUES (${email}, ${hash}, 'System', 'Admin', 'super_admin', NULL, true)
      `
      results.push('Created super admin: ' + email)
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json(
      { error: String(error), results },
      { status: 500 }
    )
  }
}
