import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== 'grh-setup-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // 1. Add 'client' to user_role enum (if not already there)
    try {
      await db.execute(sql`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client'`)
      results.push('Added client role to enum')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push(`Enum update: ${msg}`)
    }

    // 2. Add slug column to pharmacies (if not already there)
    try {
      await db.execute(sql`ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS slug VARCHAR(100)`)
      results.push('Added slug column to pharmacies')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push(`Slug column: ${msg}`)
    }

    // 3. Create PPH pharmacy (or update existing)
    let pphId: string
    const [existingPph] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.name, 'Pharmacy Plus Health'))
      .limit(1)

    if (existingPph) {
      pphId = existingPph.id
      await db
        .update(pharmacies)
        .set({ slug: 'pph' })
        .where(eq(pharmacies.id, pphId))
      results.push(`Updated existing PPH pharmacy: ${pphId}`)
    } else {
      const [newPph] = await db
        .insert(pharmacies)
        .values({
          name: 'Pharmacy Plus Health',
          slug: 'pph',
          email: 'info@pharmacyplushealth.co.uk',
          isActive: true,
        })
        .returning({ id: pharmacies.id })
      pphId = newPph.id
      results.push(`Created PPH pharmacy: ${pphId}`)
    }

    // 4. Create Jane's user account
    const janeEmail = 'jane.wilkins@pharmacyplushealth.co.uk'
    const [existingJane] = await db
      .select()
      .from(users)
      .where(eq(users.email, janeEmail))
      .limit(1)

    if (existingJane) {
      results.push(`Jane already exists: ${existingJane.id}`)
    } else {
      const passwordHash = await bcrypt.hash('PPH-Client-2026!', 12)
      const [jane] = await db
        .insert(users)
        .values({
          email: janeEmail,
          passwordHash,
          firstName: 'Jane',
          lastName: 'Wilkins',
          role: 'client',
          pharmacyId: pphId,
          isActive: true,
        })
        .returning({ id: users.id })
      results.push(`Created Jane's account: ${jane.id}`)
    }

    // 5. Also update Test Pharmacy Leeds with a slug
    await db.execute(sql`UPDATE pharmacies SET slug = 'test-pharmacy-leeds' WHERE slug IS NULL AND name LIKE '%Test%Leeds%'`)
    results.push('Updated Test Pharmacy slug')

    return NextResponse.json({ success: true, results })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg, results }, { status: 500 })
  }
}
