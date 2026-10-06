import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { todayLondon } from '@/lib/billing'
import { gbp } from '@/lib/invoice-pdf'
import { addDays, listInvoices, monthPeriod } from '@/lib/invoices'
import InvoicesClient from './InvoicesClient'

export const metadata = { title: 'Invoices — Admin' }
export const dynamic = 'force-dynamic'

/**
 * /admin/invoices: every invoice issued (migration 074), with issue-now,
 * mark paid, void and resend. The cron at 07:00 issues each month's
 * invoices and marks direct-debit ones paid as GoCardless confirms them.
 */
export default async function InvoicesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'super_admin') {
    return <div className="max-w-4xl mx-auto p-8"><p>Forbidden: admin only.</p></div>
  }
  const rows = await listInvoices({ limit: 1000 })
  const today = todayLondon()
  const { start } = monthPeriod(today)
  const thisMonth = rows.filter((r) => r.periodStart === start && r.status !== 'void')
  const open = rows.filter((r) => r.status === 'issued' && r.paymentMethod === 'bank_transfer')
  const staleBefore = addDays(today, -10)
  const overdue = rows.filter((r) => r.status === 'issued' && (r.paymentMethod === 'bank_transfer' ? r.dueOn < today : r.periodEnd < staleBefore))
  const bankDetails = !!process.env.INVOICE_BANK_DETAILS

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoices</h1>
        <p className="text-sm text-gray-500 mb-6">
          One invoice per billed branch per month, issued and emailed by the daily run at 07:00 UTC, starting on the 1st (a branch added mid-month is invoiced the next morning). Direct-debit invoices are marked paid automatically when GoCardless confirms the payment; bank-transfer invoices are marked paid here. No VAT: the company is not VAT registered.
        </p>
        {!bankDetails && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>INVOICE_BANK_DETAILS is not set in Vercel.</strong> Bank-transfer invoices will say &quot;email us for bank details&quot; until it is. Set it to, for example: <code>Account name: Get Real Health Limited; Sort code: 00-00-00; Account number: 00000000</code> (semicolon-separated lines).
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Tile label="This month" value={String(thisMonth.length)} sub={gbp(thisMonth.reduce((s, r) => s + r.amountPence, 0))} cls="text-teal-700" />
          <Tile label="Awaiting bank transfer" value={String(open.length)} sub={gbp(open.reduce((s, r) => s + r.amountPence, 0))} cls="text-indigo-700" />
          <Tile label="Overdue / not collected" value={String(overdue.length)} sub={`${gbp(overdue.reduce((s, r) => s + r.amountPence, 0))}; DD counts 10 days after month end`} cls={overdue.length ? 'text-red-700' : 'text-gray-900'} ring={overdue.length > 0} />
          <Tile label="All time" value={String(rows.filter((r) => r.status !== 'void').length)} sub={`${rows.filter((r) => r.status === 'void').length} void`} />
        </div>
        <InvoicesClient rows={rows} today={today} currentPeriod={start} />
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
