import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { eq, count, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/pharmacies
 * List all pharmacies sorted by name
 * Includes count of users and assigned PGDs for each pharmacy
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all pharmacies
    const allPharmacies = await db
      .select()
      .from(pharmacies)
      .orderBy(pharmacies.name)

    // For each pharmacy, fetch count of users and PGDs
    const pharmaciesWithCounts = await Promise.all(
      allPharmacies.map(async (pharmacy) => {
        const [usersCount] = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.pharmacyId, pharmacy.id))

        const [pgdsCount] = await db
          .select({ count: count() })
          .from(pharmacyPgds)
          .where(eq(pharmacyPgds.pharmacyId, pharmacy.id))

        return {
          ...pharmacy,
          userCount: usersCount?.count ?? 0,
          pgdCount: pgdsCount?.count ?? 0,
        }
      })
    )

    return NextResponse.json(pharmaciesWithCounts)
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pharmacies' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pharmacies
 * Create a new pharmacy
 * Body: { name: string, address?: string, phone?: string, email?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, phone, email } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Pharmacy name is required' },
        { status: 400 }
      )
    }

    // Create new pharmacy
    const [newPharmacy] = await db
      .insert(pharmacies)
      .values({
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        isActive: true,
      })
      .returning()

    return NextResponse.json(newPharmacy, { status: 201 })
  } catch (error) {
    console.error('Error creating pharmacy:', error)
    return NextResponse.json(
      { error: 'Failed to create pharmacy' },
      { status: 500 }
    )
  }
}
