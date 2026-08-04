import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { tryDecrypt } from '@/lib/encryption'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────────────────
// Carry-forward lookup for weight management follow-ups.
//
// Reported via Janey (PPH, Jul 2026) on behalf of the pharmacist running
// their Mounjaro clinics: at every follow-up he has to re-enter the
// height and work through the full initiation consultation again. Height
// does not change, and the previous weight and dose are already on file.
//
// Given a patient (first name, last name, date of birth), this returns
// the values worth carrying into a follow-up: height, the most recent
// recorded weight, the earliest recorded weight as a baseline, and the
// product and dose they were last on. Scoped to the caller's pharmacy,
// so no cross-pharmacy leakage.
//
// Only these distilled fields are returned. The full clinical record
// stays behind /api/consultation-records/[id], which is audited.
// ─────────────────────────────────────────────────────────────────────────

/** Tools whose records can supply weight management carry-forward data. */
const WEIGHT_SLUGS = [
  'mounjaro',
  'wegovy',
  'wegovy-oral',
  'saxenda',
  'orlistat',
  'mysimba',
  'glp1-monitoring',
]

type Json = Record<string, unknown>

const asRecord = (v: unknown): Json | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null

/** Read a number from a value that may be a number, or a numeric string. */
function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

/** First non-null result of reading `keys` from any of `objs`. */
function pick(objs: (Json | null)[], keys: string[]): number | null {
  for (const o of objs) {
    if (!o) continue
    for (const k of keys) {
      const n = num(o[k])
      if (n !== null) return n
    }
  }
  return null
}

function pickString(objs: (Json | null)[], keys: string[]): string | null {
  for (const o of objs) {
    if (!o) continue
    for (const k of keys) {
      const v = o[k]
      if (typeof v === 'string' && v.trim() !== '') return v.trim()
    }
  }
  return null
}

/**
 * Pull height, weight, product and dose out of a stored consultation.
 * Tools store their whole state verbatim and their shapes differ, so
 * look in every block a weight tool is known to use rather than assuming
 * one layout.
 */
function extract(clinical: unknown) {
  const root = asRecord(clinical)
  if (!root) return { heightCm: null, weightKg: null, product: null, dose: null }

  const blocks = [
    asRecord(root.weightAssessment),
    asRecord(root.observations),
    asRecord(root.progress),
    asRecord(root.treatment),
    asRecord(root.doseSelection),
    root,
  ]

  return {
    heightCm: pick(blocks, ['height', 'heightCm', 'heightInCm']),
    weightKg: pick(blocks, [
      'currentWeightKg',
      'weight',
      'weightKg',
      'currentWeight',
    ]),
    product: pickString(blocks, ['product', 'medicine', 'productName']),
    dose: pickString(blocks, [
      'dose',
      'currentDose',
      'currentMounjaroDose',
      'currentWegovyDose',
      'currentWegovyOralDose',
      'selectedDose',
    ]),
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) return NextResponse.json({ found: false })

  const limited = rateLimit(`prevconsult:${session.user.id}`, 120, 60_000)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const url = new URL(req.url)
  const firstName = (url.searchParams.get('firstName') ?? '').trim()
  const lastName = (url.searchParams.get('lastName') ?? '').trim()
  const dob = (url.searchParams.get('dateOfBirth') ?? '').trim()
  if (!firstName || !lastName || !dob) {
    return NextResponse.json({ found: false })
  }

  // Most recent weight management consultations for this patient at this
  // pharmacy. A handful is enough: the newest supplies the current dose
  // and weight, the oldest of them supplies a baseline weight.
  const rows = await db
    .select({
      id: consultationRecords.id,
      pgdSlug: consultationRecords.pgdSlug,
      consultationDate: consultationRecords.consultationDate,
      createdAt: consultationRecords.createdAt,
      clinicalData: consultationRecords.clinicalData,
    })
    .from(consultationRecords)
    .where(
      and(
        eq(consultationRecords.pharmacyId, pharmacyId),
        isNull(consultationRecords.deletedAt),
        inArray(consultationRecords.pgdSlug, WEIGHT_SLUGS),
        sql`LOWER(${consultationRecords.patientFirstName}) = LOWER(${firstName})`,
        sql`LOWER(${consultationRecords.patientLastName}) = LOWER(${lastName})`,
        eq(consultationRecords.patientDob, dob),
      ),
    )
    .orderBy(desc(consultationRecords.createdAt))
    .limit(12)

  if (rows.length === 0) return NextResponse.json({ found: false })

  const parsed = rows.map((r) => {
    let clinical: unknown = null
    try {
      const decrypted = tryDecrypt(r.clinicalData as unknown as string)
      clinical =
        typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted
    } catch {
      clinical = null
    }
    return { row: r, values: extract(clinical) }
  })

  const newest = parsed[0]
  const oldest = parsed[parsed.length - 1]

  // Height does not change: take it from whichever record has it.
  const heightCm =
    parsed.map((p) => p.values.heightCm).find((h) => h !== null) ?? null
  const lastWeightKg =
    parsed.map((p) => p.values.weightKg).find((w) => w !== null) ?? null
  const baselineWeightKg = oldest.values.weightKg ?? lastWeightKg
  const product =
    parsed.map((p) => p.values.product).find((v) => v !== null) ?? null
  const dose = parsed.map((p) => p.values.dose).find((v) => v !== null) ?? null

  return NextResponse.json({
    found: true,
    previous: {
      consultationId: newest.row.id,
      pgdSlug: newest.row.pgdSlug,
      consultationDate:
        newest.row.consultationDate ??
        (newest.row.createdAt instanceof Date
          ? newest.row.createdAt.toISOString().slice(0, 10)
          : String(newest.row.createdAt ?? '')),
      consultationCount: rows.length,
      heightCm,
      lastWeightKg,
      baselineWeightKg,
      product,
      dose,
    },
  })
}
