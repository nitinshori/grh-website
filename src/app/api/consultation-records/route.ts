import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords, pharmacies, clinicians, paperConsultations } from '@/lib/db/schema'
import { eq, and, or, ilike, sql, isNull, gte, lte } from 'drizzle-orm'
import { audit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { sendGpNotification } from '@/lib/gp-notification'
import { tryEncrypt } from '@/lib/encryption'
import { attachmentCounts } from '@/lib/consultation-attachments'
import { paperListConditions } from '@/lib/paper-consultations'

/**
 * POST /api/consultation-records — save a completed consultation record
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const limited = rateLimit(`save:${session.user.id}`, 60, 60_000)
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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

    const consultationDate = summary.consultationDate
      ? new Date(summary.consultationDate)
      : new Date()

    // Remember the GPhC number the practitioner typed, so /api/me can
    // autofill it next time. Autofill matches a clinicians row on the
    // practitioner's name and the pharmacy group; Rachel Edwards (Smartway,
    // 23 Sep 2026) had no row, so every consultation asked again.
    try {
      const [ph] = await db
        .select({ groupSlug: pharmacies.groupSlug })
        .from(pharmacies)
        .where(eq(pharmacies.id, session.user.pharmacyId))
        .limit(1)
      const name = summary.pharmacistName.trim()
      const gphc = summary.pharmacistGPhC.trim()
      if (ph?.groupSlug && name && gphc) {
        const [existing] = await db
          .select({ id: clinicians.id, gphcNumber: clinicians.gphcNumber })
          .from(clinicians)
          .where(and(eq(clinicians.groupSlug, ph.groupSlug), eq(clinicians.name, name)))
          .limit(1)
        if (!existing) {
          await db.insert(clinicians).values({ groupSlug: ph.groupSlug, name, gphcNumber: gphc, isActive: true })
        } else if (!existing.gphcNumber) {
          await db.update(clinicians).set({ gphcNumber: gphc }).where(eq(clinicians.id, existing.id))
        }
      }
    } catch {
      // Best effort only; never block the clinical record.
    }

    // Capture network fingerprint for fair-use checks (per-location billing)
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

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
        deliveryDetails: patient.deliveryDetails?.trim() || null,
        consultationNotes: patient.consultationNotes?.trim() || null,
        clinicalData: tryEncrypt(
          typeof clinicalData === 'string' ? clinicalData : JSON.stringify(clinicalData)
        ),
        outcome: outcome || 'completed',
        medicineSupplied: medicine?.name || medicine?.medicine || null,
        medicineDose: medicine?.dose || null,
        medicineDuration: medicine?.duration || null,
        medicineQuantity: medicine?.quantity?.toString() || null,
        pharmacistName: summary.pharmacistName.trim(),
        pharmacistGphc: summary.pharmacistGPhC.trim(),
        consultationDate,
        ipAddress,
        userAgent,
      })
      .returning({ id: consultationRecords.id })

    await audit({
      pharmacyId: session.user.pharmacyId,
      userId: session.user.id,
      userEmail: session.user.email || null,
      action: 'record_create',
      recordId: record.id,
      details: { pgdSlug },
      request,
    })

    // Optional: send GP notification email if patient consented + GP email provided.
    // Best-effort — failures don't block the save. Audited separately.
    let gpNotified = false
    let gpNotifyError: string | undefined
    // Look in three places — top-level consent, top-level notifyGp, or
    // nested clinicalData.consent (most PGDs put consent inside clinicalData).
    const cd = body?.clinicalData
    const wantsGpNotify =
      body?.consent?.notifyGp === true ||
      body?.notifyGp === true ||
      (typeof cd === 'object' && cd !== null && (cd as { consent?: { notifyGp?: boolean } }).consent?.notifyGp === true)
    const gpEmailRaw = patient.gpEmail
      || (typeof cd === 'object' && cd !== null
          ? (cd as { patient?: { gpEmail?: string } }).patient?.gpEmail
          : undefined)
      || ''
    const gpEmail = String(gpEmailRaw).trim()
    if (wantsGpNotify && gpEmail) {
      const [pharmacy] = await db
        .select({ name: pharmacies.name, address: pharmacies.address })
        .from(pharmacies)
        .where(eq(pharmacies.id, session.user.pharmacyId))
        .limit(1)
      const result = await sendGpNotification({
        to: gpEmail,
        patientFirstName: patient.firstName.trim(),
        patientLastName: patient.lastName.trim(),
        patientDob: patient.dateOfBirth,
        patientNhsNumber: patient.nhsNumber?.trim() || null,
        pgdTitle: pgdSlug,
        outcome: outcome || 'completed',
        medicineSupplied: medicine?.name || medicine?.medicine || null,
        medicineDose: medicine?.dose || null,
        medicineDuration: medicine?.duration || null,
        consultationDate,
        pharmacistName: summary.pharmacistName.trim(),
        pharmacistGphc: summary.pharmacistGPhC.trim(),
        pharmacyName: pharmacy?.name || summary.pharmacyName || '',
        pharmacyAddress: pharmacy?.address || summary.pharmacyAddress || '',
        clinicalNotes: summary.clinicalNotes,
      })
      gpNotified = result.ok
      gpNotifyError = result.error
      // Audit either way
      await audit({
        pharmacyId: session.user.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email || null,
        action: result.ok ? 'record_export' : 'record_export', // re-use existing enum value
        recordId: record.id,
        details: { kind: 'gp_notify', to: gpEmail, ok: result.ok, error: result.error },
        request,
      })
    }

    return NextResponse.json({ success: true, recordId: record.id, gpNotified, gpNotifyError })
  } catch (error) {
    console.error('Consultation record save error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * GET /api/consultation-records — list records for the pharmacy
 * Query params: search, pgdSlug, page, limit, dateFrom, dateTo, outcome
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const limited = rateLimit(`list:${session.user.id}`, 100, 60_000)
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const pgdSlug = searchParams.get('pgdSlug')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const outcome = searchParams.get('outcome')
    const rawPage = parseInt(searchParams.get('page') || '1', 10)
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10)
    const page = Number.isFinite(rawPage) ? Math.min(100_000, Math.max(1, rawPage)) : 1
    const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 20
    const offset = (page - 1) * limit

    const conditions = [
      eq(consultationRecords.pharmacyId, session.user.pharmacyId),
      isNull(consultationRecords.deletedAt),
    ]

    if (pgdSlug) {
      conditions.push(eq(consultationRecords.pgdSlug, pgdSlug))
    }

    if (outcome === 'completed' || outcome === 'referred' || outcome === 'not_supplied') {
      conditions.push(eq(consultationRecords.outcome, outcome))
    }

    if (dateFrom) {
      const d = new Date(dateFrom)
      if (!isNaN(d.getTime())) {
        conditions.push(gte(consultationRecords.consultationDate, d))
      }
    }
    if (dateTo) {
      const d = new Date(dateTo)
      if (!isNaN(d.getTime())) {
        // include the entire end day
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

    const whereClause = and(...conditions)

    // Paper consultations (migration 077) are listed alongside tool records,
    // same pharmacy scoping, same filters where they apply.
    const source = searchParams.get('source')
    const paperWhere = and(...paperListConditions(session.user.pharmacyId, { search, pgdSlug, outcome, dateFrom, dateTo }))
    const parts = []
    if (source !== 'paper') {
      parts.push(sql`SELECT id, 'tool' AS kind, pgd_slug, patient_first_name, patient_last_name,
        patient_dob, patient_nhs_number, outcome::text AS outcome, medicine_supplied, pharmacist_name,
        consultation_date, created_at
        FROM ${consultationRecords} WHERE ${whereClause}`)
    }
    if (source !== 'tool') {
      parts.push(sql`SELECT id, 'paper' AS kind, pgd_slug, patient_name AS patient_first_name, '' AS patient_last_name,
        to_char(patient_dob, 'YYYY-MM-DD') AS patient_dob, NULL AS patient_nhs_number, outcome, product AS medicine_supplied, pharmacist_name,
        consultation_date::timestamp AS consultation_date, (created_at AT TIME ZONE 'UTC') AS created_at
        FROM ${paperConsultations} WHERE ${paperWhere}`)
    }
    const unioned = sql.join(parts, sql` UNION ALL `)

    type Row = {
      id: string; kind: 'tool' | 'paper'; pgd_slug: string; patient_first_name: string; patient_last_name: string
      patient_dob: string; patient_nhs_number: string | null; outcome: string; medicine_supplied: string | null
      pharmacist_name: string; consultation_date: string; created_at: string
    }
    const rowsOf = <T,>(r: unknown): T[] =>
      Array.isArray(r) ? (r as T[]) : ((r as { rows?: T[] }).rows ?? [])

    const countRows = rowsOf<{ n: number }>(
      await db.execute(sql`SELECT count(*)::int AS n FROM (${unioned}) u`)
    )
    const countResult = { count: Number(countRows[0]?.n ?? 0) }

    const listRows = rowsOf<Row>(
      await db.execute(sql`SELECT id::text AS id, kind, pgd_slug, patient_first_name, patient_last_name, patient_dob,
        patient_nhs_number, outcome, medicine_supplied, pharmacist_name,
        to_char(consultation_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS consultation_date,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
        FROM (${unioned}) u
        ORDER BY u.consultation_date DESC, u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}`)
    )

    const counts = await attachmentCounts(
      listRows.filter((r) => r.kind === 'tool').map((r) => r.id),
      listRows.filter((r) => r.kind === 'paper').map((r) => r.id),
    )

    const records = listRows.map((r) => ({
      id: r.id,
      kind: r.kind,
      pgdSlug: r.pgd_slug,
      patientFirstName: r.patient_first_name,
      patientLastName: r.patient_last_name,
      patientDob: r.patient_dob,
      patientNhsNumber: r.patient_nhs_number,
      outcome: r.outcome,
      medicineSupplied: r.medicine_supplied,
      pharmacistName: r.pharmacist_name,
      consultationDate: r.consultation_date,
      createdAt: r.created_at,
      attachmentCount: counts.get(r.id) ?? 0,
    }))

    await audit({
      pharmacyId: session.user.pharmacyId,
      userId: session.user.id,
      userEmail: session.user.email || null,
      action: 'record_list',
      recordCount: records.length,
      details: { search, pgdSlug, outcome, dateFrom, dateTo, page, source },
      request,
    })

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
