import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pharmacies, appointments, appointmentTypes, clinicians } from '@/lib/db/schema'
import { eq, and, gt, lt, inArray } from 'drizzle-orm'

// ── POST /api/booking/[slug]/confirm ────────────────────────────
// Public: book an appointment

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()

  const {
    siteId,
    appointmentTypeId,
    clinicianId,
    startTime,
    firstName,
    surname,
    dob,
    phone,
    email,
    serviceDetails,
    consentGiven,
    emailConfirmation,
  } = body

  // Validate required fields
  if (!siteId || !appointmentTypeId || !clinicianId || !startTime || !firstName || !surname || !dob || !phone) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (!consentGiven) {
    return NextResponse.json(
      { error: 'Privacy consent is required' },
      { status: 400 }
    )
  }

  // Validate site belongs to group
  const [site] = await db
    .select()
    .from(pharmacies)
    .where(
      and(
        eq(pharmacies.id, siteId),
        eq(pharmacies.groupSlug, slug),
        eq(pharmacies.isActive, true)
      )
    )
    .limit(1)

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // Get appointment type for duration (scoped to this group)
  const [apptType] = await db
    .select()
    .from(appointmentTypes)
    .where(
      and(
        eq(appointmentTypes.id, appointmentTypeId),
        eq(appointmentTypes.groupSlug, slug)
      )
    )
    .limit(1)

  if (!apptType) {
    return NextResponse.json({ error: 'Appointment type not found' }, { status: 404 })
  }

  // Validate clinician
  const [clinician] = await db
    .select()
    .from(clinicians)
    .where(
      and(
        eq(clinicians.id, clinicianId),
        eq(clinicians.groupSlug, slug),
        eq(clinicians.isActive, true)
      )
    )
    .limit(1)

  if (!clinician) {
    return NextResponse.json({ error: 'Clinician not found' }, { status: 404 })
  }

  const start = new Date(startTime)
  const end = new Date(start.getTime() + apptType.durationMinutes * 60 * 1000)

  // Check the slot isn't already taken (overlap: existing.start < new.end AND existing.end > new.start)
  const conflictCheck = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.pharmacyId, siteId),
        eq(appointments.clinicianId, clinicianId),
        inArray(appointments.status, ['booked', 'completed']),
        lt(appointments.startTime, end),
        gt(appointments.endTime, start)
      )
    )
    .limit(1)

  if (conflictCheck.length > 0) {
    return NextResponse.json(
      { error: 'This time slot has just been taken. Please choose another.' },
      { status: 409 }
    )
  }

  // Create the appointment
  const [created] = await db
    .insert(appointments)
    .values({
      pharmacyId: siteId,
      clinicianId,
      appointmentTypeId,
      startTime: start,
      endTime: end,
      status: 'booked',
      patientFirstName: firstName.trim(),
      patientSurname: surname.trim(),
      patientName: `${firstName.trim()} ${surname.trim()}`,
      patientDob: dob,
      patientPhone: phone.trim(),
      patientEmail: email?.trim() || null,
      serviceDetails: serviceDetails?.trim() || null,
      bookedOnline: true,
      consentGiven: true,
      emailConfirmation: !!emailConfirmation,
    })
    .returning()

  // Format confirmation details
  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(start)

  return NextResponse.json({
    success: true,
    appointment: {
      id: created.id,
      siteName: site.name,
      siteAddress: site.address,
      clinicianName: clinician.name,
      appointmentType: apptType.name,
      formattedTime,
      durationMinutes: apptType.durationMinutes,
    },
  })
}
