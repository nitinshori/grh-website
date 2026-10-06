import 'server-only'
import { and, desc, eq, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, onboardingRequests, pharmacies, pharmacySubscriptions } from '@/lib/db/schema'
import { sendEmail, escapeHtml } from '@/lib/email'
import { getSubscription, listPayments, type GoCardlessPayment } from '@/lib/gocardless'
import { gbp, longDate, renderInvoicePdf, type InvoicePdfInput } from '@/lib/invoice-pdf'
import { todayLondon } from '@/lib/billing'

/** Nothing before this month is ever invoiced: GoCardless had already collected it. */
export const FIRST_INVOICE_MONTH = '2026-10-01'

function londonDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

/**
 * Monthly invoices, one per billed branch per calendar month (migration 074).
 *
 * Two kinds of branch:
 *   direct_debit   GoCardless collects. The invoice is a record for their
 *                  accounts; it is marked paid when GoCardless confirms the
 *                  month's payment (reconcileDirectDebitInvoices).
 *   bank_transfer  No mandate. The invoice is the bill: due in 14 days,
 *                  marked paid by hand on /admin/invoices.
 *
 * Generation is idempotent per (branch, month): the partial unique index
 * refuses a second live invoice, so the cron, an admin button and a retry
 * cannot double-issue. Invoices are never deleted, only voided.
 *
 * No VAT anywhere (Get Real Health Limited is not VAT registered).
 */

export const BANK_TRANSFER_TERMS_DAYS = 14

export type PaymentMethod = 'direct_debit' | 'bank_transfer'
export type InvoiceStatus = 'issued' | 'paid' | 'void'

/** First and last day of the month containing `iso`. */
export function monthPeriod(iso: string): { start: string; end: string } {
  const [y, m] = iso.split('-').map(Number)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { start, end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` }
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export interface InvoiceRow {
  id: string
  invoiceNumber: string
  pharmacyId: string
  pharmacyName: string
  groupSlug: string | null
  billToName: string
  billToAddress: string | null
  billToEmail: string | null
  periodStart: string
  periodEnd: string
  issuedOn: string
  dueOn: string
  description: string
  amountPence: number
  paymentMethod: PaymentMethod
  status: InvoiceStatus
  paidAt: string | null
  paidNote: string | null
  emailedAt: string | null
  emailedTo: string | null
}

function toRow(r: typeof invoices.$inferSelect & { pharmacyName: string; groupSlug: string | null }): InvoiceRow {
  return {
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    pharmacyId: r.pharmacyId,
    pharmacyName: r.pharmacyName,
    groupSlug: r.groupSlug,
    billToName: r.billToName,
    billToAddress: r.billToAddress,
    billToEmail: r.billToEmail,
    periodStart: r.periodStart,
    periodEnd: r.periodEnd,
    issuedOn: r.issuedOn,
    dueOn: r.dueOn,
    description: r.description,
    amountPence: r.amountPence,
    paymentMethod: r.paymentMethod as PaymentMethod,
    status: r.status as InvoiceStatus,
    paidAt: r.paidAt ? r.paidAt.toISOString() : null,
    paidNote: r.paidNote,
    emailedAt: r.emailedAt ? r.emailedAt.toISOString() : null,
    emailedTo: r.emailedTo,
  }
}

const selectShape = {
  inv: invoices,
  pharmacyName: pharmacies.name,
  groupSlug: pharmacies.groupSlug,
}

export async function listInvoices(opts: { pharmacyIds?: string[]; limit?: number } = {}): Promise<InvoiceRow[]> {
  if (opts.pharmacyIds && opts.pharmacyIds.length === 0) return []
  const rows = await db
    .select(selectShape)
    .from(invoices)
    .innerJoin(pharmacies, eq(pharmacies.id, invoices.pharmacyId))
    .where(opts.pharmacyIds ? inArray(invoices.pharmacyId, opts.pharmacyIds) : undefined)
    .orderBy(desc(invoices.periodStart), pharmacies.name)
    .limit(opts.limit ?? 500)
  return rows.map((r) => toRow({ ...r.inv, pharmacyName: r.pharmacyName, groupSlug: r.groupSlug }))
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  const [r] = await db.select(selectShape).from(invoices).innerJoin(pharmacies, eq(pharmacies.id, invoices.pharmacyId)).where(eq(invoices.id, id)).limit(1)
  return r ? toRow({ ...r.inv, pharmacyName: r.pharmacyName, groupSlug: r.groupSlug }) : null
}

/**
 * Branches that should be invoiced for the month starting `periodStart`:
 * active pharmacy, billing not cancelled (a cancelled row gets no new
 * invoice, whatever the month), a GoCardless subscription (direct debit)
 * or billing_method bank_transfer, and invoice_from not after the period.
 *
 * A direct-debit row with no invoice_from gets one here from GoCardless:
 * the month of the subscription's first collection, persisted so the call
 * happens once. A bank-transfer row with none starts from the month it was
 * created (London time).
 */
async function billableBranches(periodStart: string) {
  const { end } = monthPeriod(periodStart)
  const rows = await db
    .select({
      rowId: pharmacySubscriptions.id,
      pharmacyId: pharmacies.id,
      pharmacyName: pharmacies.name,
      pharmacyAddress: pharmacies.address,
      pharmacyEmail: pharmacies.email,
      fee: pharmacySubscriptions.monthlyFeePence,
      billingMethod: pharmacySubscriptions.billingMethod,
      billingName: pharmacySubscriptions.billingName,
      billingAddress: pharmacySubscriptions.billingAddress,
      billingEmail: pharmacySubscriptions.billingEmail,
      invoiceFrom: pharmacySubscriptions.invoiceFrom,
      createdAt: pharmacySubscriptions.createdAt,
      subscriptionId: pharmacySubscriptions.gocardlessSubscriptionId,
      cancelledAt: pharmacySubscriptions.cancelledAt,
      groupName: onboardingRequests.groupName,
      contactEmail: onboardingRequests.contactEmail,
      onboardingAddress: onboardingRequests.pharmacyAddress,
      onboardingPostcode: onboardingRequests.pharmacyPostcode,
    })
    .from(pharmacySubscriptions)
    .innerJoin(pharmacies, eq(pharmacies.id, pharmacySubscriptions.pharmacyId))
    .leftJoin(onboardingRequests, eq(onboardingRequests.id, pharmacySubscriptions.onboardingId))
    .where(and(
      eq(pharmacies.isActive, true),
      or(
        and(eq(pharmacySubscriptions.billingMethod, 'direct_debit'), sql`${pharmacySubscriptions.gocardlessSubscriptionId} IS NOT NULL`),
        eq(pharmacySubscriptions.billingMethod, 'bank_transfer'),
      ),
      isNull(pharmacySubscriptions.cancelledAt),
      or(isNull(pharmacySubscriptions.invoiceFrom), lte(pharmacySubscriptions.invoiceFrom, end)),
    ))
  const out: typeof rows = []
  for (const r of rows) {
    let from = r.invoiceFrom
    if (!from) {
      from = londonDate(r.createdAt).slice(0, 8) + '01'
      if (r.billingMethod !== 'bank_transfer' && r.subscriptionId) {
        // First collection month from GoCardless; a subscription created on
        // the 27th collects in the next month and must not be invoiced for
        // this one.
        try {
          const ps = await listPayments({ subscription: r.subscriptionId, limit: 50 })
          const dates = ps.map((p) => p.charge_date).sort()
          let first: string | null = dates[0] ?? null
          if (!first) {
            const sub = await getSubscription(r.subscriptionId)
            first = sub.upcoming_payments?.[0]?.charge_date ?? sub.start_date ?? null
          }
          if (first) from = first.slice(0, 8) + '01'
        } catch (e) {
          console.warn(`[invoices] could not read first charge for ${r.pharmacyName}; using creation month`, e)
        }
      }
      if (from < FIRST_INVOICE_MONTH) from = FIRST_INVOICE_MONTH
      await db.update(pharmacySubscriptions).set({ invoiceFrom: from, updatedAt: new Date() }).where(and(eq(pharmacySubscriptions.id, r.rowId), isNull(pharmacySubscriptions.invoiceFrom)))
    }
    if (from <= end) out.push({ ...r, invoiceFrom: from })
  }
  return out
}

export interface GenerateResult {
  period: string
  created: Array<{ id: string; invoiceNumber: string; pharmacyName: string; amountPence: number; method: PaymentMethod }>
  skipped: number
}

/**
 * Issue this month's invoices for every billable branch that has none yet.
 * Safe to call any number of times. A month that was voided for a branch
 * is left alone unless `reissueVoid` is set (an admin choosing to), so the
 * cron cannot undo a goodwill void the next morning.
 */
export async function generateMonthlyInvoices(periodStart: string, opts: { reissueVoid?: boolean } = {}): Promise<GenerateResult> {
  const { start, end } = monthPeriod(periodStart)
  if (start < FIRST_INVOICE_MONTH) return { period: start, created: [], skipped: 0 }
  const branches = await billableBranches(start)
  const existing = await db
    .select({ pharmacyId: invoices.pharmacyId })
    .from(invoices)
    .where(opts.reissueVoid ? and(eq(invoices.periodStart, start), ne(invoices.status, 'void')) : eq(invoices.periodStart, start))
  const have = new Set(existing.map((e) => e.pharmacyId))
  const today = todayLondon()
  const issuedOn = today < start ? start : today
  const created: GenerateResult['created'] = []
  let skipped = 0
  for (const b of branches) {
    if (have.has(b.pharmacyId)) { skipped++; continue }
    const method = b.billingMethod === 'bank_transfer' ? 'bank_transfer' : 'direct_debit'
    const billToName = b.billingName || b.groupName || b.pharmacyName
    const billToAddress = b.billingAddress || b.pharmacyAddress || [b.onboardingAddress, b.onboardingPostcode].filter(Boolean).join(', ') || null
    const billToEmail = b.billingEmail || b.pharmacyEmail || b.contactEmail || null
    const description = `Get Real Health PGD platform subscription: ${b.pharmacyName}, ${monthLabel(start)}`
    try {
      const [row] = await db
        .insert(invoices)
        .values({
          invoiceNumber: sql`'GRH-' || nextval('invoice_number_seq')::text`,
          pharmacyId: b.pharmacyId,
          subscriptionRowId: b.rowId,
          billToName,
          billToAddress,
          billToEmail,
          periodStart: start,
          periodEnd: end,
          issuedOn,
          dueOn: method === 'bank_transfer' ? addDays(issuedOn, BANK_TRANSFER_TERMS_DAYS) : start,
          description,
          amountPence: b.fee,
          paymentMethod: method,
          status: 'issued',
        })
        .onConflictDoNothing()
        .returning({ id: invoices.id, invoiceNumber: invoices.invoiceNumber })
      if (!row) { skipped++; continue }
      created.push({ id: row.id, invoiceNumber: row.invoiceNumber, pharmacyName: b.pharmacyName, amountPence: b.fee, method })
    } catch (e) {
      console.error(`[invoices] could not issue for ${b.pharmacyName}:`, e)
    }
  }
  return { period: start, created, skipped }
}

/** The PDF for an invoice, with the GoCardless charge date when we know it. */
export async function invoicePdf(inv: InvoiceRow): Promise<Uint8Array> {
  let collectionDate: string | null = null
  if (inv.paymentMethod === 'direct_debit' && inv.status === 'issued') {
    collectionDate = await directDebitChargeDate(inv).catch(() => null)
  }
  const input: InvoicePdfInput = { ...inv, collectionDate }
  return renderInvoicePdf(input)
}

async function subscriptionIdFor(inv: InvoiceRow): Promise<string | null> {
  const [s] = await db
    .select({ id: pharmacySubscriptions.gocardlessSubscriptionId })
    .from(pharmacySubscriptions)
    .where(eq(pharmacySubscriptions.pharmacyId, inv.pharmacyId))
    .limit(1)
  return s?.id ?? null
}

const DEAD_STATUSES = new Set(['cancelled', 'customer_approval_denied', 'failed', 'charged_back'])

/**
 * GoCardless payments for this invoice's subscription with a charge date
 * inside its month, earliest first. Strictly inside: a 28th-of-the-month
 * collection must never be matched to the following month's invoice.
 */
async function paymentsInPeriod(inv: InvoiceRow): Promise<GoCardlessPayment[]> {
  const subId = await subscriptionIdFor(inv)
  if (!subId) return []
  const payments = await listPayments({ subscription: subId, limit: 50 })
  return payments
    .filter((p) => p.charge_date >= inv.periodStart && p.charge_date <= inv.periodEnd)
    .sort((a, b) => a.charge_date.localeCompare(b.charge_date))
}

async function directDebitChargeDate(inv: InvoiceRow): Promise<string | null> {
  const ps = await paymentsInPeriod(inv)
  return ps.find((p) => !DEAD_STATUSES.has(p.status))?.charge_date ?? null
}

export interface ReconcileResult {
  paid: number
  checked: number
  /** Collected amount differs from the invoice: left open for an admin to void and reissue. */
  mismatched: Array<{ invoiceNumber: string; pharmacyName: string; invoiced: number; collected: number; paymentId: string }>
  /** Open direct-debit invoices whose month ended more than 10 days ago with nothing confirmed. */
  stale: Array<{ invoiceNumber: string; pharmacyName: string; periodStart: string }>
}

/**
 * Mark direct-debit invoices paid once GoCardless has confirmed the
 * month's payment. A payment already linked to another invoice is never
 * reused; an amount that differs from the invoice is reported, not
 * applied. One GoCardless call per open DD invoice; fine at our scale.
 */
export async function reconcileDirectDebitInvoices(): Promise<ReconcileResult> {
  const open = await db
    .select(selectShape)
    .from(invoices)
    .innerJoin(pharmacies, eq(pharmacies.id, invoices.pharmacyId))
    .where(and(eq(invoices.status, 'issued'), eq(invoices.paymentMethod, 'direct_debit')))
  const linked = new Set(
    (await db.select({ id: invoices.gocardlessPaymentId }).from(invoices).where(sql`${invoices.gocardlessPaymentId} IS NOT NULL`)).map((r) => r.id as string),
  )
  const result: ReconcileResult = { paid: 0, checked: open.length, mismatched: [], stale: [] }
  const staleBefore = addDays(todayLondon(), -10)
  for (const r of open) {
    const inv = toRow({ ...r.inv, pharmacyName: r.pharmacyName, groupSlug: r.groupSlug })
    try {
      const ps = (await paymentsInPeriod(inv)).filter((p) => !linked.has(p.id))
      const confirmed = ps.filter((p) => p.status === 'confirmed' || p.status === 'paid_out')
      const exact = confirmed.find((p) => p.amount === inv.amountPence)
      if (exact) {
        const [done] = await db.update(invoices).set({
          status: 'paid',
          paidAt: new Date(exact.charge_date + 'T00:00:00Z'),
          paidNote: `GoCardless payment ${exact.id}`,
          gocardlessPaymentId: exact.id,
          updatedAt: new Date(),
        }).where(and(eq(invoices.id, inv.id), eq(invoices.status, 'issued'))).returning({ id: invoices.id })
        if (done) { result.paid++; linked.add(exact.id) }
      } else if (confirmed[0]) {
        result.mismatched.push({ invoiceNumber: inv.invoiceNumber, pharmacyName: inv.pharmacyName, invoiced: inv.amountPence, collected: confirmed[0].amount, paymentId: confirmed[0].id })
      } else if (inv.periodEnd < staleBefore) {
        result.stale.push({ invoiceNumber: inv.invoiceNumber, pharmacyName: inv.pharmacyName, periodStart: inv.periodStart })
      }
    } catch (e) {
      console.error(`[invoices] reconcile ${inv.invoiceNumber} failed:`, e)
    }
  }
  return result
}

/**
 * Invoices for the month that were issued but never emailed (a Resend or
 * PDF failure on the day), for the cron to retry. Void and address-less
 * ones are excluded.
 */
export async function unsentInvoiceIds(periodStart: string): Promise<string[]> {
  const rows = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.periodStart, periodStart), ne(invoices.status, 'void'), isNull(invoices.emailedAt), sql`${invoices.billToEmail} IS NOT NULL`))
  return rows.map((r) => r.id)
}

export async function markInvoicePaid(id: string, note: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await db
    .update(invoices)
    .set({ status: 'paid', paidAt: new Date(), paidNote: note, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.status, 'issued')))
    .returning({ id: invoices.id })
  return row ? { ok: true } : { ok: false, error: 'Invoice is not open (already paid or void)' }
}

export async function voidInvoice(id: string, note: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await db
    .update(invoices)
    .set({ status: 'void', paidNote: note, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), ne(invoices.status, 'void')))
    .returning({ id: invoices.id })
  return row ? { ok: true } : { ok: false, error: 'Already void' }
}

/** Reopen a paid invoice (a mistaken "mark paid"). */
export async function reopenInvoice(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await db
    .update(invoices)
    .set({ status: 'issued', paidAt: null, paidNote: null, gocardlessPaymentId: null, updatedAt: new Date() })
    .where(and(eq(invoices.id, id), eq(invoices.status, 'paid')))
    .returning({ id: invoices.id })
  return row ? { ok: true } : { ok: false, error: 'Only a paid invoice can be reopened' }
}

/**
 * Email the invoice as a PDF. `to` overrides the stored bill-to email for
 * a one-off resend. Records when and where it went.
 */
export async function emailInvoice(id: string, to?: string | null): Promise<{ ok: true; to: string } | { ok: false; error: string }> {
  const inv = await getInvoice(id)
  if (!inv) return { ok: false, error: 'Not found' }
  if (inv.status === 'void') return { ok: false, error: 'Void invoices are not sent' }
  const recipient = (to || inv.billToEmail || '').trim()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return { ok: false, error: 'No billing email address on record for this branch' }
  let pdf: Uint8Array
  try {
    pdf = await invoicePdf(inv)
  } catch (e) {
    return { ok: false, error: `PDF could not be rendered: ${e instanceof Error ? e.message : String(e)}` }
  }
  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const month = monthLabel(inv.periodStart)
  const dd = inv.paymentMethod === 'direct_debit'
  const html =
    `<p>Hello,</p>` +
    `<p>Please find attached invoice <strong>${escapeHtml(inv.invoiceNumber)}</strong> for ${escapeHtml(inv.pharmacyName)}, ${escapeHtml(month)}: <strong>${gbp(inv.amountPence)}</strong>.</p>` +
    (dd
      ? `<p>This is settled by Direct Debit through GoCardless, so there is nothing to do; it is for your records.</p>`
      : inv.status === 'paid'
        ? `<p>This invoice has been paid. Thank you.</p>`
        : `<p>Payment is by bank transfer by <strong>${escapeHtml(longDate(inv.dueOn))}</strong>, quoting ${escapeHtml(inv.invoiceNumber)} as the reference. The bank details are on the invoice. If you would rather pay by Direct Debit, reply to this email and we will send a secure link; future months are then collected automatically.</p>`) +
    `<p>Every invoice is also available under Billing in your dashboard: <a href="${appUrl}/for-pharmacies/dashboard/billing">${appUrl}/for-pharmacies/dashboard/billing</a></p>` +
    `<p>Kind regards,<br>Get Real Health<br>info@getrealhealthpgd.co.uk</p>`
  try {
    await sendEmail({
      to: recipient,
      replyTo: 'info@getrealhealthpgd.co.uk',
      subject: `Invoice ${inv.invoiceNumber}: ${inv.pharmacyName}, ${month}${dd ? ' (paid by Direct Debit)' : ''}`,
      html,
      attachments: [{ filename: `${inv.invoiceNumber}.pdf`, content: Buffer.from(pdf), contentType: 'application/pdf' }],
    })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  try {
    await db.update(invoices).set({ emailedAt: new Date(), emailedTo: recipient, updatedAt: new Date() }).where(eq(invoices.id, id))
  } catch (e) {
    // The email went; a failed marker only means a possible duplicate send tomorrow.
    console.error(`[invoices] sent ${inv.invoiceNumber} but could not record it:`, e)
  }
  return { ok: true, to: recipient }
}

/** Pharmacy ids this user's group covers, for the dashboard list. */
export async function groupPharmacyIds(pharmacyId: string): Promise<string[]> {
  const [p] = await db.select({ groupSlug: pharmacies.groupSlug }).from(pharmacies).where(eq(pharmacies.id, pharmacyId)).limit(1)
  if (!p) return []
  if (!p.groupSlug) return [pharmacyId]
  const rows = await db.select({ id: pharmacies.id }).from(pharmacies).where(eq(pharmacies.groupSlug, p.groupSlug))
  return rows.map((r) => r.id)
}
