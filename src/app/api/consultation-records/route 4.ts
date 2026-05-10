import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { eq, and, or, desc, ilike, sql } from 'drizzle-orm'

/**
 * POST /api/consultation-records — save a completed consultation record
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const {
      consultationId,
      pgdSlug,
      patient,
      clinicalData,
      outcome,
      medicine,
      summary,
    } = body

    // Validate required fields
    if (!pgdSlug || !patient?.firstName || !patient?.lastName || !patient?.dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields: pgdSlug, patient name and DOB' },
        { status: 400 }
      )
    }

    if (!summary?.pharmacistName || !summary?.pharmacistGPhC) {
      return NextResponse.json(
        { error: 'Pharmacist name and GPhC number are required' },
        { status: 400 }
      )
    }

    if (!clinicalData) {
      return NextResponse.json(
        { error: 'Clinical data is required' },
        { status: 400 }
      )
    }

    // Parse consultation date
    const consultationDate = summary.consultationDate
      ? new Date(summary.consultationDate)
      : new Date()

    const [record] = await db
      .insert(consultationRecords)
      .values({
        consultationId: consultationId || null,
        pharmacyId: session.user.pharmacyId,
        userId: session.user.id,
        pgdSlug,
        patientFirstName: patient.firstName.trim(),
        patientLastName: patient.lastName.trim(),
        patientDob: patient.dateOfBirth,
        patientNhsNumber: patient.nhsNumber?.trim() || null,
        patientPhone: patient.phone?.trim() || null,
        patientEmail: patient.email?.trim() || null,
        patientAddress: patient.address?.trim() || null,
        patientGpName: patient.gpName?.trim() || null,
        patientGpPractice: patient.gpPractice?.trim() || null,
        clinicalData: typeof clinicalData === 'string'
          ? clinicalData
          : JSON.stringify(clinicalData),
        outcome: outcome || 'completed',
        medicineSupplied: medicine?.name || medicine?.medicine || null,
        medicineDose: medicine?.dose || null,
        medicineDuration: medicine?.duration || null,
        medicineQuantity: medicine?.quantity?.toString() || null,
        pharmacistName: summary.pharmacistName.trim(),
        pharmacistGphc: summary.pharmacistGPhC.trim(),
        consultationDate,
      })
      .returning({ id: consultationRecords.id })

    return NextResponse.json({ success: true, recordId: record.id })
  } catch (error) {
    console.error('Consultation record save error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * GET /api/consultation-records — list records for the pharmacy
 * Query params: search, pgdSlug, page, limit
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const pgdSlug = searchParams.get('pgdSlug')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    // Build conditions
    const conditions = [eq(consultationRecords.pharmacyId, session.user.pharmacyId)]

    if (pgdSlug) {
      conditions.push(eq(consultationRecords.pgdSlug, pgdSlug))
    }

    if (search) {
      conditions.push(
        or(
          ilike(consultationRecords.patientFirstName, `%${search}%`),
          ilike(consultationRecords.patientLastName, `%${search}%`),
          ilike(consultationRecords.patientNhsNumber, `%${search}%`),
        )!
      )
    }

    const whereClause = and(...conditions)

    // Count total
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(consultationRecords)
      .where(whereClause)

    // Fetch records (without full clinicalData for list view)
    const records = await db
      .select({
        id: consultationRecords.id,
        pgdSlug: consultationRecords.pgdSlug,
        patientFirstName: consultationRecords.patientFirstName,
        patientLastName: consultationRecords.patientLastName,
        patientDob: consultationRecords.patientDob,
        patientNhsNumber: consultationRecords.patientNhsNumber,
        outcome: consultationRecords.outcome,
        medicineSupplied: consultationRecords.medicineSupplied,
        pharmacistName: consultationRecords.pharmacistName,
        consultationDate: consultationRecords.consultationDate,
        createdAt: consultationRecords.createdAt,
      })
      .from(consultationRecords)
      .where(whereClause)
      .orderBy(desc(consultationRecords.consultationDate))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      records,
      total: countResult?.count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((countResult?.count ?? 0) / limit),
    })
  } catch (error) {
    console.error('Consultation records list error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
