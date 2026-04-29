import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pharmacies, appointmentTypes, clinicians } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// ── GET /api/booking/[slug]/services ────────────────────────────
// Public: returns pharmacy group info, sites, appointment types, clinicians

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Fetch all sites in this group
  const sites = await db
    .select()
    .from(pharmacies)
    .where(and(eq(pharmacies.groupSlug, slug), eq(pharmacies.isActive, true)))

  if (sites.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Fetch appointment types for this group
  const types = await db
    .select()
    .from(appointmentTypes)
    .where(and(eq(appointmentTypes.groupSlug, slug), eq(appointmentTypes.isActive, true)))
    .orderBy(appointmentTypes.sortOrder)

  // Fetch clinicians for this group
  const clinicianList = await db
    .select({
      id: clinicians.id,
      name: clinicians.name,
      role: clinicians.role,
    })
    .from(clinicians)
    .where(and(eq(clinicians.groupSlug, slug), eq(clinicians.isActive, true)))

  return NextResponse.json({
    brandName: sites[0].brandName || sites[0].name,
    brandColor: sites[0].brandColor || '#3d8b37',
    sites: sites.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      phone: s.phone,
    })),
    appointmentTypes: types.map((t) => ({
      id: t.id,
      name: t.name,
      durationMinutes: t.durationMinutes,
      requiresDetails: t.requiresDetails,
    })),
    clinicians: clinicianList,
  })
}
