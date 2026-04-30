import type { Metadata } from 'next'
import { db } from '@/lib/db'
import {
  pharmacies,
  appointmentTypes,
  clinicians,
  clinicianAvailability,
  appointments,
} from '@/lib/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import BookingWidget from './BookingWidget'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ site?: string; type?: string; date?: string; slot?: string; clinician?: string }>
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

export default async function BookingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { site: siteIdParam, type: typeIdParam, date: dateParam, slot: slotParam, clinician: clinicianParam } = await searchParams

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

  // Check if a site was pre-selected via query param
  const preSelectedSite = siteIdParam
    ? sites.find((s) => s.id === siteIdParam) || null
    : sites.length === 1
      ? sites[0]
      : null

  // Check if an appointment type was pre-selected via query param
  const preSelectedType = typeIdParam
    ? types.find((t) => t.id === typeIdParam) || null
    : null

  // If site + type + date are all provided, fetch available slots server-side
  let initialSlots: { clinicianId: string; clinicianName: string; startTime: string; endTime: string }[] = []
  const preSelectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null

  if (preSelectedSite && preSelectedType && preSelectedDate) {
    const targetDate = new Date(preSelectedDate + 'T00:00:00')
    if (!isNaN(targetDate.getTime())) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (targetDate >= today) {
        const dayOfWeek = targetDate.getDay()
        const duration = preSelectedType.durationMinutes

        // Get clinician availability for this site + day
        const availabilities = await db
          .select({
            clinicianId: clinicianAvailability.clinicianId,
            clinicianName: clinicians.name,
            startTime: clinicianAvailability.startTime,
            endTime: clinicianAvailability.endTime,
          })
          .from(clinicianAvailability)
          .innerJoin(clinicians, eq(clinicians.id, clinicianAvailability.clinicianId))
          .where(
            and(
              eq(clinicianAvailability.pharmacyId, preSelectedSite.id),
              eq(clinicianAvailability.dayOfWeek, dayOfWeek),
              eq(clinicianAvailability.isActive, true),
              eq(clinicians.isActive, true)
            )
          )

        if (availabilities.length > 0) {
          // Get existing booked appointments
          const dayStart = new Date(preSelectedDate + 'T00:00:00')
          const dayEnd = new Date(preSelectedDate + 'T23:59:59')

          const existingAppointments = await db
            .select({
              clinicianId: appointments.clinicianId,
              startTime: appointments.startTime,
              endTime: appointments.endTime,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.pharmacyId, preSelectedSite.id),
                gte(appointments.startTime, dayStart),
                lte(appointments.startTime, dayEnd),
                inArray(appointments.status, ['booked', 'completed'])
              )
            )

          const now = new Date()

          for (const avail of availabilities) {
            const [startH, startM] = avail.startTime.split(':').map(Number)
            const [endH, endM] = avail.endTime.split(':').map(Number)
            const availStartMin = startH * 60 + startM
            const availEndMin = endH * 60 + endM

            const clinicianBooked = existingAppointments.filter(
              (a) => a.clinicianId === avail.clinicianId
            )

            for (let m = availStartMin; m + duration <= availEndMin; m += duration) {
              const slotStart = new Date(targetDate)
              slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0)
              const slotEnd = new Date(targetDate)
              slotEnd.setHours(Math.floor((m + duration) / 60), (m + duration) % 60, 0, 0)

              if (slotStart <= now) continue

              const isBooked = clinicianBooked.some((b) => {
                const bStart = new Date(b.startTime).getTime()
                const bEnd = new Date(b.endTime).getTime()
                return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart
              })
              if (isBooked) continue

              initialSlots.push({
                clinicianId: avail.clinicianId,
                clinicianName: avail.clinicianName,
                startTime: slotStart.toISOString(),
                endTime: slotEnd.toISOString(),
              })
            }
          }

          initialSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
        }
      }
    }
  }

  // Check if a specific slot was pre-selected
  const preSelectedSlot = slotParam && clinicianParam
    ? initialSlots.find((s) => s.startTime === slotParam && s.clinicianId === clinicianParam) || null
    : null

  return (
    <div>
      <BookingWidget
        slug={slug}
        brandColor={brandColor}
        preSelectedSite={preSelectedSite ? { id: preSelectedSite.id, name: preSelectedSite.name, address: preSelectedSite.address, phone: preSelectedSite.phone } : null}
        preSelectedType={preSelectedType || null}
        preSelectedDate={preSelectedDate}
        preSelectedSlot={preSelectedSlot}
        initialSlots={initialSlots}
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
