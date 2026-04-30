import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { pharmacies, appointmentTypes, clinicians } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import BookingWidget from './BookingWidget'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [site] = await db
    .select({ brandName: pharmacies.brandName, name: pharmacies.name })
    .from(pharmacies)
    .where(and(eq(pharmacies.groupSlug, slug), eq(pharmacies.isActive, true)))
    .limit(1)

  const name = site?.brandName || site?.name || 'Pharmacy'
  return {
    title: `Book an Appointment — ${name}`,
    description: `Request an appointment at ${name}. Choose your preferred branch, service, and time.`,
  }
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params

  // Fetch all sites in this group
  const sites = await db
    .select({
      id: pharmacies.id,
      name: pharmacies.name,
      address: pharmacies.address,
      phone: pharmacies.phone,
      brandName: pharmacies.brandName,
      brandColor: pharmacies.brandColor,
    })
    .from(pharmacies)
    .where(and(eq(pharmacies.groupSlug, slug), eq(pharmacies.isActive, true)))

  if (sites.length === 0) {
    notFound()
  }

  // Fetch appointment types for this group
  const types = await db
    .select({
      id: appointmentTypes.id,
      name: appointmentTypes.name,
      durationMinutes: appointmentTypes.durationMinutes,
      requiresDetails: appointmentTypes.requiresDetails,
    })
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

  const brandColor = sites[0].brandColor || '#3d8b37'
  const brandName = sites[0].brandName || sites[0].name

  return (
    <div>
      <BookingWidget
        slug={slug}
        brandColor={brandColor}
        initialConfig={{
          brandName,
          brandColor,
          sites: sites.map((s) => ({
            id: s.id,
            name: s.name,
            address: s.address,
            phone: s.phone,
          })),
          appointmentTypes: types,
          clinicians: clinicianList,
        }}
      />
    </div>
  )
}
