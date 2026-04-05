import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/pharmacies/[id]
 * Get single pharmacy with its users and assigned PGD slugs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch pharmacy
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, id))
      .limit(1)

    if (!pharmacy) {
      return NextResponse.json(
        { error: 'Pharmacy not found' },
        { status: 404 }
      )
    }

    // Fetch pharmacy users
    const pharmacyUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.pharmacyId, id))

    // Fetch assigned PGDs
    const assignedPgds = await db
      .select({ pgdSlug: pharmacyPgds.pgdSlug })
      .from(pharmacyPgds)
      .where(eq(pharmacyPgds.pharmacyId, id))

    return NextResponse.json({
      ...pharmacy,
      users: pharmacyUsers,
      pgdSlugs: assignedPgds.map((p) => p.pgdSlug),
    })
  } catch (error) {
    console.error('Error fetching pharmacy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pharmacy' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/pharmacies/[id]
 * Update pharmacy details
 * Body: { name?: string, address?: string, phone?: string, email?: string, isActive?: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, address, phone, email, isActive } = body

    // Check if pharmacy exists
    const [existingPharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, id))
      .limit(1)

    if (!existingPharmacy) {
      return NextResponse.json(
        { error: 'Pharmacy not found' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (address !== undefined) updateData.address = address?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (email !== undefined) updateData.email = email?.trim() || null
    if (isActive !== undefined) updateData.isActive = isActive
    updateData.updatedAt = new Date()

    // Update pharmacy
    const [updatedPharmacy] = await db
      .update(pharmacies)
      .set(updateData)
      .where(eq(pharmacies.id, id))
      .returning()

    return NextResponse.json(updatedPharmacy)
  } catch (error) {
    console.error('Error updating pharmacy:', error)
    return NextResponse.json(
      { error: 'Failed to update pharmacy' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/pharmacies/[id]
 * Deactivate pharmacy (set is_active=false, don't actually delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if pharmacy exists
    const [existingPharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, id))
      .limit(1)

    if (!existingPharmacy) {
      return NextResponse.json(
        { error: 'Pharmacy not found' },
        { status: 404 }
      )
    }

    // Deactivate pharmacy (soft delete)
    const [deactivatedPharmacy] = await db
      .update(pharmacies)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(pharmacies.id, id))
      .returning()

    return NextResponse.json(deactivatedPharmacy)
  } catch (error) {
    console.error('Error deactivating pharmacy:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate pharmacy' },
      { status: 500 }
    )
  }
}
