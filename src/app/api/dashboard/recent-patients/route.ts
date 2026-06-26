import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────────────────
// Returning-patient lookup. Built so pharmacists don't have to re-type
// the same patient's details every visit. Reported by Moin (June 2026):
// "is there a way to have a patient registration so that you can select
// the patient and then have the service rather than having to fill out
// the information every single time as well?"
//
// Query (?q=) is matched as a case-insensitive prefix against patient
// first name OR last name OR NHS number. Results are de-duplicated by
// (firstName, lastName, dob) — same patient may have multiple consults,
// we return the MOST RECENT consult's details as the canonical record.
// Scoped to the caller's pharmacy_id, so a Pharmacy A pharmacist never
// sees Pharmacy B's patients (privacy + per-tenant isolation).
// ─────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) {
    return NextResponse.json({ results: [] })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    // Too short — return empty rather than dumping the whole patient
    // panel. The UI's search input only fires after the third character
    // anyway, but defence in depth.
    return NextResponse.json({ results: [] })
  }

  // De-dup by (firstName, lastName, dob) — use a sub-query that picks
  // the most recent consult per patient via DISTINCT ON. Postgres
  // DISTINCT ON is well-suited to "row with greatest createdAt per
  // group". Avoids the GROUP BY + JOIN dance.
  const rows = await db.execute<{
    consultation_id: string
    patient_first_name: string
    patient_last_name: string
    patient_dob: string
    patient_nhs_number: string | null
    patient_phone: string | null
    patient_email: string | null
    patient_address: string | null
    patient_gp_name: string | null
    patient_gp_practice: string | null
    last_seen: Date
    consult_count: number
  }>(sql`
    SELECT DISTINCT ON (
      LOWER(patient_first_name), LOWER(patient_last_name), patient_dob
    )
      id::text AS consultation_id,
      patient_first_name,
      patient_last_name,
      patient_dob,
      patient_nhs_number,
      patient_phone,
      patient_email,
      patient_address,
      patient_gp_name,
      patient_gp_practice,
      created_at AS last_seen,
      (
        SELECT COUNT(*)::int
        FROM ${consultationRecords} cr2
        WHERE cr2.pharmacy_id = ${pharmacyId}
          AND cr2.deleted_at IS NULL
          AND LOWER(cr2.patient_first_name) = LOWER(${consultationRecords.patientFirstName})
          AND LOWER(cr2.patient_last_name) = LOWER(${consultationRecords.patientLastName})
          AND cr2.patient_dob = ${consultationRecords.patientDob}
      ) AS consult_count
    FROM ${consultationRecords}
    WHERE pharmacy_id = ${pharmacyId}
      AND deleted_at IS NULL
      AND (
        ${consultationRecords.patientFirstName} ILIKE ${q + '%'}
        OR ${consultationRecords.patientLastName} ILIKE ${q + '%'}
        OR ${consultationRecords.patientNhsNumber} ILIKE ${q + '%'}
      )
    ORDER BY
      LOWER(patient_first_name),
      LOWER(patient_last_name),
      patient_dob,
      created_at DESC
    LIMIT 10
  `)

  // Drizzle's execute returns either { rows } or the rows directly
  // depending on driver. Normalise.
  type RowShape = {
    consultation_id: string
    patient_first_name: string
    patient_last_name: string
    patient_dob: string
    patient_nhs_number: string | null
    patient_phone: string | null
    patient_email: string | null
    patient_address: string | null
    patient_gp_name: string | null
    patient_gp_practice: string | null
    last_seen: Date | string
    consult_count: number
  }
  const list: RowShape[] = Array.isArray(rows)
    ? (rows as RowShape[])
    : (((rows as unknown as { rows?: RowShape[] }).rows) ?? [])

  return NextResponse.json({
    results: list.map((r) => ({
      consultationId: r.consultation_id,
      firstName: r.patient_first_name,
      lastName: r.patient_last_name,
      dateOfBirth: r.patient_dob,
      nhsNumber: r.patient_nhs_number ?? '',
      phone: r.patient_phone ?? '',
      email: r.patient_email ?? '',
      address: r.patient_address ?? '',
      gpName: r.patient_gp_name ?? '',
      gpPractice: r.patient_gp_practice ?? '',
      lastSeen:
        r.last_seen instanceof Date
          ? r.last_seen.toISOString()
          : String(r.last_seen),
      consultCount: r.consult_count,
    })),
  })
}

// Suppress unused-import warnings for the helpers I'd otherwise need
// for a Drizzle-typed query. Keeping them imported so a future refactor
// to typed Drizzle is a one-liner away.
void and
void desc
void eq
void ilike
void isNull
void or
