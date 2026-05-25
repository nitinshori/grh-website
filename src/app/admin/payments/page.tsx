import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { isNotNull } from 'drizzle-orm'
import { listPayments, type GoCardlessPayment } from '@/lib/gocardless'
import Link from 'next/link'

export const metadata = { title: 'Payments — Admin' }
export const dynamic = 'force-dynamic'

// ── Display helpers ─────────────────────────────────────────────────

const GBP = (pence: number) =>
  '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending_submission: { label: 'Pending submission', cls: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Submitted', cls: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmed', cls: 'bg-teal-100 text-teal-800' },
  paid_out: { label: 'Paid out', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', cls: 'bg-amber-100 text-amber-800' },
  customer_approval_denied: { label: 'Denied', cls: 'bg-red-100 text-red-800' },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-800' },
  charged_back: { label: 'Charged back', cls: 'bg-red-100 text-red-800' },
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function PaymentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'super_admin') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p>Forbidden — admin only.</p>
      </div>
    )
  }

  // ── 1) Pull all onboarding requests with a mandate, build mandate→pharmacy map ──
  const onboardings = await db
    .select({
      pharmacyName: onboardingRequests.pharmacyName,
      contactFirstName: onboardingRequests.contactFirstName,
      contactLastName: onboardingRequests.contactLastName,
      mandateId: onboardingRequests.gocardlessMandateId,
      subscriptionId: onboardingRequests.gocardlessSubscriptionId,
      customerId: onboardingRequests.gocardlessCustomerId,
    })
    .from(onboardingRequests)
    .where(isNotNull(onboardingRequests.gocardlessMandateId))

  const byMandate = new Map<string, typeof onboardings[number]>()
  for (const o of onboardings) if (o.mandateId) byMandate.set(o.mandateId, o)

  // ── 2) Fetch payments live from GoCardless ──────────────────────
  let payments: GoCardlessPayment[] = []
  let fetchError: string | null = null
  try {
    payments = await listPayments({ limit: 200 })
    // Sort by charge_date desc (most recent first), then created_at desc as tiebreaker
    payments.sort((a, b) => {
      const d = (b.charge_date ?? '').localeCompare(a.charge_date ?? '')
      if (d !== 0) return d
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    })
  } catch (e) {
    fetchError = e instanceof Error ? e.message : String(e)
  }

  // ── 3) Aggregate tiles ──────────────────────────────────────────
  let collectedPence = 0
  let pendingPence = 0
  let failedPence = 0
  let paidCount = 0
  let pendingCount = 0
  let failedCount = 0

  // "This month" = current calendar month based on charge_date
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  let thisMonthPence = 0

  for (const p of payments) {
    if (p.status === 'paid_out' || p.status === 'confirmed') {
      collectedPence += p.amount
      paidCount++
    } else if (p.status === 'pending_submission' || p.status === 'submitted') {
      pendingPence += p.amount
      pendingCount++
    } else if (p.status === 'failed' || p.status === 'cancelled' || p.status === 'charged_back' || p.status === 'customer_approval_denied') {
      failedPence += p.amount
      failedCount++
    }
    if ((p.charge_date ?? '').startsWith(ym) && (p.status === 'paid_out' || p.status === 'confirmed' || p.status === 'submitted')) {
      thisMonthPence += p.amount
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        <div className="flex items-baseline justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <Link href="/admin/onboarding" className="text-sm text-blue-600 hover:text-blue-800">
            Onboarding queue →
          </Link>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Live read from GoCardless ({process.env.GOCARDLESS_ENVIRONMENT === 'live' ? 'live mode' : 'sandbox'}). Up to 200 most recent payments.
        </p>

        {fetchError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-800">Couldn&apos;t fetch payments: {fetchError}</p>
            <p className="text-xs text-red-700 mt-1">Check GOCARDLESS_ACCESS_TOKEN and GOCARDLESS_ENVIRONMENT env vars in Vercel.</p>
          </div>
        )}

        {/* Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Total collected</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{GBP(collectedPence)}</p>
            <p className="text-[10px] text-gray-500">{paidCount} payment{paidCount === 1 ? '' : 's'} confirmed / paid out</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">This month</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">{GBP(thisMonthPence)}</p>
            <p className="text-[10px] text-gray-500">Submitted, confirmed or paid out</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{GBP(pendingPence)}</p>
            <p className="text-[10px] text-gray-500">{pendingCount} awaiting submission/clear</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Failed / cancelled</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{GBP(failedPence)}</p>
            <p className="text-[10px] text-gray-500">{failedCount} unsuccessful</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900">All payments <span className="text-gray-500 font-normal">({payments.length})</span></h2>
          </div>
          {payments.length === 0 && !fetchError ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500 italic">
              No payments yet. Once an onboarded pharmacy&apos;s subscription generates its first collection, it&apos;ll show here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Charge date</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Pharmacy</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Contact</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => {
                    const onboarding = p.links.mandate ? byMandate.get(p.links.mandate) : undefined
                    const statusInfo = STATUS_STYLE[p.status] ?? { label: p.status, cls: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-700">
                          {p.charge_date ? fmtDate(p.charge_date) : '—'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{onboarding?.pharmacyName ?? <span className="text-gray-400 italic">Unknown</span>}</div>
                          {!onboarding && <div className="text-[10px] text-gray-400 font-mono">{p.links.mandate?.slice(0, 16)}…</div>}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-600">
                          {onboarding ? `${onboarding.contactFirstName} ${onboarding.contactLastName}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right font-semibold text-gray-900">
                          {GBP(p.amount)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-500">{p.reference ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Statuses: <strong>Paid out</strong> = money has cleared into your account.{' '}
          <strong>Confirmed</strong> = customer&apos;s bank has accepted, awaiting payout (typically next business day).{' '}
          <strong>Submitted</strong> = sent to bank, will collect in ~3 working days.{' '}
          <strong>Pending submission</strong> = scheduled but not yet sent. Failed payments need following up directly with the customer.
        </p>
      </div>
    </div>
  )
}
