import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
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

  // Check the group exists
  const sites = await db
    .select({ id: pharmacies.id, brandName: pharmacies.brandName, brandColor: pharmacies.brandColor })
    .from(pharmacies)
    .where(and(eq(pharmacies.groupSlug, slug), eq(pharmacies.isActive, true)))

  if (sites.length === 0) {
    notFound()
  }

  const brandColor = sites[0].brandColor || '#3d8b37'

  return (
    <div>
      <BookingWidget slug={slug} brandColor={brandColor} />
    </div>
  )
}
