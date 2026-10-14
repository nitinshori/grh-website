import 'server-only'
import { eq, gte, ilike, inArray, isNull, lte, or, sql, type SQL } from 'drizzle-orm'
import { paperConsultations } from '@/lib/db/schema'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * WHERE conditions for paper consultations matching the records list and
 * export filters. Outcome "completed" (the tool's "Supplied") matches paper
 * "supplied" and "administered".
 */
export function paperListConditions(
  pharmacyId: string,
  f: { search?: string | null; pgdSlug?: string | null; outcome?: string | null; dateFrom?: string | null; dateTo?: string | null },
): SQL[] {
  const c: SQL[] = [eq(paperConsultations.pharmacyId, pharmacyId), isNull(paperConsultations.deletedAt)]
  if (f.pgdSlug) c.push(eq(paperConsultations.pgdSlug, f.pgdSlug))
  if (f.outcome === 'completed') c.push(inArray(paperConsultations.outcome, ['supplied', 'administered']))
  else if (f.outcome === 'referred' || f.outcome === 'not_supplied') c.push(eq(paperConsultations.outcome, f.outcome))
  const from = f.dateFrom?.slice(0, 10)
  const to = f.dateTo?.slice(0, 10)
  if (from && ISO_DATE.test(from)) c.push(gte(paperConsultations.consultationDate, from))
  if (to && ISO_DATE.test(to)) c.push(lte(paperConsultations.consultationDate, to))
  if (f.search) {
    const q = `%${f.search}%`
    c.push(
      or(
        ilike(paperConsultations.patientName, q),
        sql`to_char(${paperConsultations.patientDob}, 'YYYY-MM-DD') ILIKE ${q}`,
        ilike(paperConsultations.product, q),
        ilike(paperConsultations.pharmacistName, q),
        ilike(paperConsultations.batch, q),
      )!,
    )
  }
  return c
}

/** Split "Jane Ann Smith" into first and last name for the CSV export. */
export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length < 2) return { first: full.trim(), last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}
