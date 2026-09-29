import 'server-only'
import { and, asc, eq, isNull, lte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { onboardingRequests, pharmacies, pharmacySubscriptions } from '@/lib/db/schema'
import { cancelSubscription, createSubscription, GoCardlessError, updateSubscriptionAmount } from '@/lib/gocardless'

/**
 * Per-branch billing.
 *
 * Every billed pharmacy has one pharmacy_subscriptions row (migration 069):
 * the mandate it is collected on, the GoCardless subscription, the fee now,
 * and an optional scheduled change. Built for Delmergate (29 Sep 2026): four
 * branches on one Direct Debit at a first-year group rate, standard rate
 * from year two. Before this the fee was typed once at approval and lived
 * nowhere editable.
 *
 * Ordering rule throughout: write our record first, then call GoCardless,
 * then complete the record. A GoCardless subscription with no row behind it
 * is money collected that nothing on our side knows about; a row with no
 * subscription is visible on /admin/billing and retryable. Every create
 * carries an Idempotency-Key so a retry adopts the first result.
 */

export const STANDARD_MONTHLY_FEE_PENCE = 10000 // £100 per pharmacy per month ex VAT
export const MIN_FEE_PENCE = 100
export const MAX_FEE_PENCE = 500000 // GoCardless GBP payment ceiling is £5,000

export function pounds(pence: number | null | undefined): string {
  if (pence == null) return ''
  return '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: pence % 100 ? 2 : 0, maximumFractionDigits: 2 })
}

/** Today's date in Europe/London as YYYY-MM-DD, for comparing with date columns. */
export function todayLondon(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

/** A real calendar date as YYYY-MM-DD (Date.parse alone accepts 30 February). */
export function isValidIsoDate(s: unknown): s is string {
  if (typeof s !== 'string') return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d
}

export function isValidFeePence(n: unknown): n is number {
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= MIN_FEE_PENCE && n <= MAX_FEE_PENCE
}

const subscriptionName = (pharmacyName: string) => `Get Real Health monthly subscription: ${pharmacyName}`

export interface StartBranchBillingInput {
  pharmacyId: string
  pharmacyName: string
  onboardingId: string
  mandateId: string
  monthlyFeePence: number
  feeChangePence?: number | null
  feeChangeOn?: string | null
  notes?: string | null
}

/**
 * Record a branch's billing, then create its GoCardless subscription.
 * Idempotent per pharmacy: an existing row with a subscription is returned
 * untouched, so a re-run of approval cannot double-bill. A GoCardless
 * failure is stored on the row (subscription_error), not thrown.
 */
export async function startBranchBilling(input: StartBranchBillingInput): Promise<{ subscriptionId: string | null; error: string | null }> {
  await db
    .insert(pharmacySubscriptions)
    .values({
      pharmacyId: input.pharmacyId,
      onboardingId: input.onboardingId,
      gocardlessMandateId: input.mandateId,
      monthlyFeePence: input.monthlyFeePence,
      feeChangePence: input.feeChangePence ?? null,
      feeChangeOn: input.feeChangeOn ?? null,
      notes: input.notes ?? null,
    })
    .onConflictDoNothing({ target: pharmacySubscriptions.pharmacyId })
  const [row] = await db
    .select({ id: pharmacySubscriptions.id, subscriptionId: pharmacySubscriptions.gocardlessSubscriptionId })
    .from(pharmacySubscriptions)
    .where(eq(pharmacySubscriptions.pharmacyId, input.pharmacyId))
    .limit(1)
  if (row?.subscriptionId) return { subscriptionId: row.subscriptionId, error: null }
  return createForRow(row.id, input.pharmacyId, input.pharmacyName, input.onboardingId, input.mandateId, input.monthlyFeePence)
}

async function createForRow(rowId: string, pharmacyId: string, pharmacyName: string, onboardingId: string | null, mandateId: string, amountPence: number) {
  let subscriptionId: string | null = null
  let error: string | null = null
  try {
    const sub = await createSubscription({
      mandateId,
      amountPence,
      name: subscriptionName(pharmacyName),
      metadata: { pharmacy_id: pharmacyId, ...(onboardingId ? { onboarding_id: onboardingId } : {}) },
      idempotencyKey: `grh-sub-${pharmacyId}`,
    })
    subscriptionId = sub.id
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }
  // Never overwrite a subscription id that arrived from a parallel attempt.
  await db
    .update(pharmacySubscriptions)
    .set({
      gocardlessSubscriptionId: subscriptionId
        ? sql`COALESCE(${pharmacySubscriptions.gocardlessSubscriptionId}, ${subscriptionId})`
        : pharmacySubscriptions.gocardlessSubscriptionId,
      subscriptionError: error,
      updatedAt: new Date(),
    })
    .where(eq(pharmacySubscriptions.id, rowId))
  return { subscriptionId, error }
}

/** Retry the GoCardless subscription for a row whose first attempt failed. */
export async function retryBranchBilling(rowId: string): Promise<{ subscriptionId: string | null; error: string | null }> {
  const [row] = await db
    .select({
      id: pharmacySubscriptions.id,
      pharmacyId: pharmacySubscriptions.pharmacyId,
      onboardingId: pharmacySubscriptions.onboardingId,
      mandateId: pharmacySubscriptions.gocardlessMandateId,
      subscriptionId: pharmacySubscriptions.gocardlessSubscriptionId,
      cancelledAt: pharmacySubscriptions.cancelledAt,
      fee: pharmacySubscriptions.monthlyFeePence,
      name: pharmacies.name,
    })
    .from(pharmacySubscriptions)
    .innerJoin(pharmacies, eq(pharmacies.id, pharmacySubscriptions.pharmacyId))
    .where(eq(pharmacySubscriptions.id, rowId))
    .limit(1)
  if (!row) return { subscriptionId: null, error: 'Not found' }
  if (row.subscriptionId) return { subscriptionId: row.subscriptionId, error: 'A subscription already exists for this pharmacy' }
  if (row.cancelledAt) return { subscriptionId: null, error: 'Billing for this pharmacy was cancelled; clear the cancellation first' }
  if (!row.mandateId) return { subscriptionId: null, error: 'No mandate on record for this pharmacy' }
  return createForRow(row.id, row.pharmacyId, row.name, row.onboardingId, row.mandateId, row.fee)
}

export interface FeeEdit {
  monthlyFeePence?: number
  feeChangePence?: number | null
  feeChangeOn?: string | null
  notes?: string | null
}

/**
 * Edit what a pharmacy pays. A new monthly fee is pushed to GoCardless
 * first; if that fails nothing is saved, so the record never disagrees with
 * what is actually collected. If GoCardless reports the subscription is no
 * longer active (cancelled in their dashboard, say) the row is marked
 * cancelled so it shows on the billing page instead of failing forever.
 * Scheduled-change fields and notes are stored only; a scheduled change
 * that differs from the current one resets the applied marker.
 */
export async function editBranchBilling(rowId: string, edit: FeeEdit): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await db.select().from(pharmacySubscriptions).where(eq(pharmacySubscriptions.id, rowId)).limit(1)
  if (!row) return { ok: false, error: 'Not found' }
  const set: Partial<typeof pharmacySubscriptions.$inferInsert> = { updatedAt: new Date() }

  if (edit.feeChangePence !== undefined && edit.feeChangePence !== null && !isValidFeePence(edit.feeChangePence)) {
    return { ok: false, error: `Scheduled fee must be between ${pounds(MIN_FEE_PENCE)} and ${pounds(MAX_FEE_PENCE)}` }
  }
  if (edit.feeChangeOn !== undefined && edit.feeChangeOn !== null) {
    if (!isValidIsoDate(edit.feeChangeOn)) return { ok: false, error: 'Scheduled date must be a real date (YYYY-MM-DD)' }
    if (edit.feeChangeOn !== row.feeChangeOn && edit.feeChangeOn <= todayLondon()) return { ok: false, error: 'Scheduled date must be in the future; use "Apply change now" for an immediate change' }
  }
  const nextChangePence = edit.feeChangePence !== undefined ? edit.feeChangePence : row.feeChangePence
  const nextChangeOn = edit.feeChangeOn !== undefined ? edit.feeChangeOn : row.feeChangeOn
  if ((nextChangePence == null) !== (nextChangeOn == null)) {
    return { ok: false, error: 'A scheduled change needs both a new fee and a date' }
  }
  if (nextChangePence !== row.feeChangePence || nextChangeOn !== row.feeChangeOn) {
    set.feeChangePence = nextChangePence
    set.feeChangeOn = nextChangeOn
    set.feeChangeAppliedAt = null
  }
  if (edit.notes !== undefined) set.notes = edit.notes

  if (edit.monthlyFeePence !== undefined && edit.monthlyFeePence !== row.monthlyFeePence) {
    if (!isValidFeePence(edit.monthlyFeePence)) return { ok: false, error: `Monthly fee must be between ${pounds(MIN_FEE_PENCE)} and ${pounds(MAX_FEE_PENCE)}` }
    if (row.gocardlessSubscriptionId && !row.cancelledAt) {
      try {
        await updateSubscriptionAmount(row.gocardlessSubscriptionId, edit.monthlyFeePence)
      } catch (e) {
        if (e instanceof GoCardlessError && e.reasons.includes('subscription_not_active')) {
          await db.update(pharmacySubscriptions).set({ cancelledAt: new Date(), subscriptionError: 'GoCardless reports this subscription is no longer active', updatedAt: new Date() }).where(eq(pharmacySubscriptions.id, rowId))
          return { ok: false, error: 'GoCardless says this subscription is no longer active. It has been marked cancelled here; use Retry to start a new one.' }
        }
        return { ok: false, error: `GoCardless refused the change: ${e instanceof Error ? e.message : String(e)}` }
      }
    }
    set.monthlyFeePence = edit.monthlyFeePence
  }
  await db.update(pharmacySubscriptions).set(set).where(eq(pharmacySubscriptions.id, rowId))
  return { ok: true }
}

/**
 * Apply one scheduled change now. Claims the row first (applied_at set
 * where it was null) so the cron and an admin clicking "Apply now" cannot
 * both push the amount; the claim is released if GoCardless refuses.
 */
export async function applyScheduledFeeChange(rowId: string): Promise<{ ok: true; from: number; to: number } | { ok: false; error: string }> {
  const [row] = await db
    .update(pharmacySubscriptions)
    .set({ feeChangeAppliedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(pharmacySubscriptions.id, rowId),
      isNull(pharmacySubscriptions.feeChangeAppliedAt),
      sql`${pharmacySubscriptions.feeChangePence} IS NOT NULL`,
      sql`${pharmacySubscriptions.feeChangeOn} IS NOT NULL`,
    ))
    .returning()
  if (!row) return { ok: false, error: 'No unapplied scheduled change on this row (or it is being applied already)' }
  const to = row.feeChangePence as number
  if (row.gocardlessSubscriptionId && !row.cancelledAt) {
    try {
      await updateSubscriptionAmount(row.gocardlessSubscriptionId, to)
    } catch (e) {
      await db.update(pharmacySubscriptions).set({ feeChangeAppliedAt: null, updatedAt: new Date() }).where(eq(pharmacySubscriptions.id, rowId))
      return { ok: false, error: `GoCardless refused the change: ${e instanceof Error ? e.message : String(e)}` }
    }
  }
  await db
    .update(pharmacySubscriptions)
    .set({ monthlyFeePence: to, updatedAt: new Date() })
    .where(eq(pharmacySubscriptions.id, rowId))
  return { ok: true, from: row.monthlyFeePence, to }
}

/** Cancel a pharmacy's subscription at GoCardless and record it. */
export async function cancelBranchBilling(rowId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await db.select().from(pharmacySubscriptions).where(eq(pharmacySubscriptions.id, rowId)).limit(1)
  if (!row) return { ok: false, error: 'Not found' }
  if (row.cancelledAt) return { ok: false, error: 'Already cancelled' }
  if (row.gocardlessSubscriptionId) {
    try {
      await cancelSubscription(row.gocardlessSubscriptionId)
    } catch (e) {
      if (!(e instanceof GoCardlessError && e.reasons.includes('subscription_not_active'))) {
        return { ok: false, error: `GoCardless refused: ${e instanceof Error ? e.message : String(e)}` }
      }
    }
  }
  await db.update(pharmacySubscriptions).set({ cancelledAt: new Date(), updatedAt: new Date() }).where(eq(pharmacySubscriptions.id, rowId))
  return { ok: true }
}

/** Rows whose scheduled change is due today or earlier and not yet applied. */
export async function dueFeeChanges() {
  return db
    .select({ id: pharmacySubscriptions.id, pharmacyId: pharmacySubscriptions.pharmacyId, name: pharmacies.name, from: pharmacySubscriptions.monthlyFeePence, to: pharmacySubscriptions.feeChangePence, on: pharmacySubscriptions.feeChangeOn })
    .from(pharmacySubscriptions)
    .innerJoin(pharmacies, eq(pharmacies.id, pharmacySubscriptions.pharmacyId))
    .where(and(
      isNull(pharmacySubscriptions.feeChangeAppliedAt),
      isNull(pharmacySubscriptions.cancelledAt),
      lte(pharmacySubscriptions.feeChangeOn, todayLondon()),
      sql`${pharmacySubscriptions.feeChangePence} IS NOT NULL`,
    ))
    .orderBy(asc(pharmacySubscriptions.feeChangeOn))
}

export interface BillingRow {
  id: string
  pharmacyId: string
  pharmacyName: string
  groupSlug: string | null
  groupName: string | null
  isActive: boolean
  mandateId: string | null
  subscriptionId: string | null
  subscriptionError: string | null
  monthlyFeePence: number
  feeChangePence: number | null
  feeChangeOn: string | null
  feeChangeAppliedAt: string | null
  cancelledAt: string | null
  notes: string | null
  onboardingId: string | null
}

export async function listBilling(): Promise<BillingRow[]> {
  const rows = await db
    .select({
      id: pharmacySubscriptions.id,
      pharmacyId: pharmacySubscriptions.pharmacyId,
      pharmacyName: pharmacies.name,
      groupSlug: pharmacies.groupSlug,
      groupName: onboardingRequests.groupName,
      isActive: pharmacies.isActive,
      mandateId: pharmacySubscriptions.gocardlessMandateId,
      subscriptionId: pharmacySubscriptions.gocardlessSubscriptionId,
      subscriptionError: pharmacySubscriptions.subscriptionError,
      monthlyFeePence: pharmacySubscriptions.monthlyFeePence,
      feeChangePence: pharmacySubscriptions.feeChangePence,
      feeChangeOn: pharmacySubscriptions.feeChangeOn,
      feeChangeAppliedAt: pharmacySubscriptions.feeChangeAppliedAt,
      cancelledAt: pharmacySubscriptions.cancelledAt,
      notes: pharmacySubscriptions.notes,
      onboardingId: pharmacySubscriptions.onboardingId,
    })
    .from(pharmacySubscriptions)
    .innerJoin(pharmacies, eq(pharmacies.id, pharmacySubscriptions.pharmacyId))
    .leftJoin(onboardingRequests, eq(onboardingRequests.id, pharmacySubscriptions.onboardingId))
    .orderBy(asc(pharmacies.groupSlug), asc(pharmacies.name))
  return rows.map((r) => ({
    ...r,
    feeChangeAppliedAt: r.feeChangeAppliedAt ? r.feeChangeAppliedAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
  }))
}

/**
 * Recorded monthly fees, in pence, for every active pharmacy with a
 * subscription on record that we have not cancelled. This is what our
 * records say, not a live check against GoCardless.
 */
export async function monthlyRecurringPence(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`COALESCE(SUM(${pharmacySubscriptions.monthlyFeePence}), 0)::int` })
    .from(pharmacySubscriptions)
    .innerJoin(pharmacies, eq(pharmacies.id, pharmacySubscriptions.pharmacyId))
    .where(and(
      eq(pharmacies.isActive, true),
      isNull(pharmacySubscriptions.cancelledAt),
      sql`${pharmacySubscriptions.gocardlessSubscriptionId} IS NOT NULL`,
    ))
  return row?.n ?? 0
}
