import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { eq, and, or, desc, ilike, isNull, gte, lte } from 'drizzle-orm'
import { audit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'

/**
 * GET /api/consultation-records/export — CSV download of consultation records
 * Same filters as the list endpoint. Limits to 5,000 rows per export.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.pharmacyId) {
    return new Response('Unauthorised', { status: 401 })
  }

  // Tighter limit on exports — these pull a lot of PHI in one go
  const limited = rateLimit(`export:${session.user.id}`, 10, 60_000)
  if (!limited.ok) {
    return new Response('Too many requests', { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const pgdSlug = searchParams.get('pgdSlug')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const outcome = searchParams.get('outcome')

  const conditions = [
    eq(consultationRecords.pharmacyId, session.user.pharmacyId),
    isNull(consultationRecords.deletedAt),
  ]
  if (pgdSlug) conditions.push(eq(consultationRecords.pgdSlug, pgdSlug))
  if (outcome === 'completed' || outcome === 'referred' || outcome === 'not_supplied') {
    conditions.push(eq(consultationRecords.outcome, outcome))
  }
  if (dateFrom) {
    const d = new Date(dateFrom)
    if (!isNaN(d.getTime())) conditions.push(gte(consultationRecords.consultationDate, d))
  }
  if (dateTo) {
    const d = new Date(dateTo)
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999)
      conditions.push(lte(consultationRecords.consultationDate, d))
    }
  }
  if (search) {
    conditions.push(
      or(
        ilike(consultationRecords.patientFirstName, `%${search}%`),
        ilike(consultationRecords.patientLastName, `%${search}%`),
        ilike(consultationRecords.patientNhsNumber, `%${search}%`),
        ilike(consultationRecords.patientDob, `%${search}%`),
        ilike(consultationRecords.medicineSupplied, `%${search}%`),
        ilike(consultationRecords.pharmacistName, `%${search}%`),
      )!
    )
  }

  const rows = await db
    .select({
      consultationDate: consultationRecords.consultationDate,
      pgdSlug: consultationRecords.pgdSlug,
      patientFirstName: consultationRecords.patientFirstName,
      patientLastName: consultationRecords.patientLastName,
      patientDob: consultationRecords.patientDob,
      patientNhsNumber: consultationRecords.patientNhsNumber,
      patientPhone: consultationRecords.patientPhone,
      patientEmail: consultationRecords.patientEmail,
      patientGpName: consultationRecords.patientGpName,
      patientGpPractice: consultationRecords.patientGpPractice,
      outcome: consultationRecords.outcome,
      medicineSupplied: consultationRecords.medicineSupplied,
      medicineDose: consultationRecords.medicineDose,
      medicineDuration: consultationRecords.medicineDuration,
      medicineQuantity: consultationRecords.medicineQuantity,
      pharmacistName: consultationRecords.pharmacistName,
      pharmacistGphc: consultationRecords.pharmacistGphc,
    })
    .from(consultationRecords)
    .where(and(...conditions))
    .orderBy(desc(consultationRecords.consultationDate))
    .limit(5000)

  const headers = [
    'Consultation date',
    'PGD',
    'Patient first name',
    'Patient last name',
    'Patient DOB',
    'NHS number',
    'Phone',
    'Email',
    'GP name',
    'GP practice',
    'Outcome',
    'Medicine',
    'Dose',
    'Duration',
    'Quantity',
    'Pharmacist',
    'GPhC',
  ]

  const csvEscape = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = v instanceof Date ? v.toISOString() : String(v)
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const csvRows = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.consultationDate,
        r.pgdSlug,
        r.patientFirstName,
        r.patientLastName,
        r.patientDob,
        r.patientNhsNumber,
        r.patientPhone,
        r.patientEmail,
        r.patientGpName,
        r.patientGpPractice,
        r.outcome,
        r.medicineSupplied,
        r.medicineDose,
        r.medicineDuration,
        r.medicineQuantity,
        r.pharmacistName,
        r.pharmacistGphc,
      ]
        .map(csvEscape)
        .join(',')
    ),
  ]

  const csv = csvRows.join('\r\n')

  await audit({
    pharmacyId: session.user.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'record_export',
    recordCount: rows.length,
    details: { search, pgdSlug, outcome, dateFrom, dateTo },
    request,
  })

  const filename = `consultation-records-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
