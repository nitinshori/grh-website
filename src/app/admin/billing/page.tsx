import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listBilling, monthlyRecurringPence, pounds, todayLondon } from '@/lib/billing'
import BillingClient from './BillingClient'

export const metadata = { title: 'Billing — Admin' }
export const dynamic = 'force-dynamic'

/**
 * /admin/billing: what every pharmacy pays, grouped by group_slug, with the
 * fee editable, scheduled changes visible and a retry for any subscription
 * GoCardless refused at approval. Migration 069.
 */
export default async function BillingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'super_admin') {
    return <div className="max-w-4xl mx-auto p-8"><p>Forbidden: admin only.</p></div>
  }

  const rows = await listBilling()
  const mrr = await monthlyRecurringPence()
  const today = todayLondon()
  const live = rows.filter((r) => !r.cancelledAt)
  const failed = live.filter((r) => !r.subscriptionId).length
  const due = live.filter((r) => r.feeChangeOn && r.feeChangePence != null && !r.feeChangeAppliedAt && r.feeChangeOn <= today).length
  const scheduled = live.filter((r) => r.feeChangeOn && r.feeChangePence != null && !r.feeChangeAppliedAt && r.feeChangeOn > today).length

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
        <p className="text-sm text-gray-500 mb-6">
          One row per billed pharmacy. Changing a monthly fee updates the GoCardless subscription; a scheduled change is applied automatically on its date (daily at 06:30 UK) or from the button here. GoCardless applies a new amount only to payments not yet created, so schedule a change at least a week before the collection it should affect.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Tile label="Recorded monthly fees" value={pounds(mrr)} sub="Our records, not a live GoCardless check" cls="text-teal-700" />
          <Tile label="Billed pharmacies" value={String(live.length)} sub={`${live.filter((r) => r.isActive).length} active, ${rows.length - live.length} cancelled`} />
          <Tile label="Scheduled changes" value={String(scheduled)} sub="Not yet due" cls="text-indigo-700" />
          <Tile label="Needs attention" value={String(failed + due)} sub={`${failed} no subscription, ${due} change overdue`} cls={failed + due ? 'text-red-700' : 'text-gray-900'} ring={failed + due > 0} />
        </div>
        <BillingClient rows={rows} today={today} />
      </div>
    </div>
  )
}

function Tile({ label, value, sub, cls = 'text-gray-900', ring = false }: { label: string; value: string; sub: string; cls?: string; ring?: boolean }) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${ring ? 'ring-2 ring-red-300' : ''}`}>
      <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${cls}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{sub}</p>
    </div>
  )
}
