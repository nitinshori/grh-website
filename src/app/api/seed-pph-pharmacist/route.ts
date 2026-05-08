import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, pharmacies, pharmacyPgds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { ALL_PGDS } from '@/lib/pgd-access'

/**
 * TEMPORARY endpoint — creates a pharmacist user for the PPH pharmacy
 * so we can walk through all ePGDs. DELETE after use.
 *
 * GET /api/seed-pph-pharmacist
 */
export async function GET() {
  try {
    // Find the PPH pharmacy
    const [pph] = await db
      .select({ id: pharmacies.id, name: pharmacies.name })
      .from(pharmacies)
      .where(eq(pharmacies.slug, 'pph'))
      .limit(1)

    if (!pph) {
      return NextResponse.json({ error: 'PPH pharmacy not found' }, { status: 404 })
    }

    // Check if pharmacist already exists
    const email = 'janey@pharmacyplushealth.co.uk'
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    let userId: string

    if (existing) {
      userId = existing.id
      // Update password and role
      const hash = await bcrypt.hash('PPH-Janey-2026!', 10)
      await db.update(users).set({
        passwordHash: hash,
        role: 'pharmacist',
        pharmacyId: pph.id,
        isActive: true,
      }).where(eq(users.id, userId))
    } else {
      const hash = await bcrypt.hash('PPH-Janey-2026!', 10)
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash: hash,
        firstName: 'Janey',
        lastName: 'Wilkins',
        role: 'pharmacist',
        pharmacyId: pph.id,
        isActive: true,
      }).returning({ id: users.id })
      userId = newUser.id
    }

    // Assign ALL PGDs to the PPH pharmacy
    // First check what's already assigned
    const existingPgds = await db
      .select({ pgdSlug: pharmacyPgds.pgdSlug })
      .from(pharmacyPgds)
      .where(eq(pharmacyPgds.pharmacyId, pph.id))

    const existingSlugs = new Set(existingPgds.map(p => p.pgdSlug))
    const toInsert = ALL_PGDS.filter(p => !existingSlugs.has(p.slug))

    if (toInsert.length > 0) {
      await db.insert(pharmacyPgds).values(
        toInsert.map(p => ({ pharmacyId: pph.id, pgdSlug: p.slug }))
      )
    }

    return NextResponse.json({
      success: true,
      pharmacy: pph.name,
      pharmacyId: pph.id,
      userId,
      email,
      password: 'PPH-Janey-2026!',
      pgdsAssigned: ALL_PGDS.length,
      newPgdsAdded: toInsert.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
