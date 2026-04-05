import { auth } from '@/lib/auth'
import { setPharmacyPgds } from '@/lib/pgd-access'
import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/admin/pharmacies/[id]/pgds
 * Replace all PGD assignments for a pharmacy
 * Body: { slugs: string[] }
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
    const { slugs } = body

    // Validate body
    if (!Array.isArray(slugs)) {
      return NextResponse.json(
        { error: 'slugs must be an array of strings' },
        { status: 400 }
      )
    }

    // Ensure all slugs are strings
    if (!slugs.every((slug) => typeof slug === 'string')) {
      return NextResponse.json(
        { error: 'all slugs must be strings' },
        { status: 400 }
      )
    }

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

    // Update PGD assignments
    await setPharmacyPgds(id, slugs)

    return NextResponse.json({
      success: true,
      pharmacyId: id,
      pgdSlugs: slugs,
      count: slugs.length,
    })
  } catch (error) {
    console.error('Error updating pharmacy PGDs:', error)
    return NextResponse.json(
      { error: 'Failed to update pharmacy PGDs' },
      { status: 500 }
    )
  }
}
