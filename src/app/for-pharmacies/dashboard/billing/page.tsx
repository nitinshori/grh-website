import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { groupPharmacyIds, listInvoices } from '@/lib/invoices'
import { gbp, longDate } from '@/lib/invoice-pdf'

export const metadata = { title: 'Billing & invoices | Get Real Health' }
export const dynamic = 'force-dynamic'

const STATUS: Record<string, { label: string; cls: string }> = {
  issued: { label: 'Due', cls: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  void: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-600' },
}

/**
 * Every invoice for the group the signed-in admin belongs to, newest
 * first, with a PDF for each. Direct-debit invoices are records (nothing
 * to pay); bank-transfer ones show the due date.
 */
export default async function BillingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing &amp; invoices</h1>
        <p className="text-sm text-gray-600">Only pharmacy admins can see invoices.</p>
      </div>
    )
  }
  const ids = session.user.pharmacyId ? await groupPharmacyIds(session.user.pharmacyId) : []
  const rows = await listInvoices({ pharmacyIds: ids, limit: 240 })
  const dd = rows.some((r) => r.paymentMethod === 'direct_debit')
  const bank = rows.some((r) => r.paymentMethod === 'bank_transfer' && r.status === 'issued')

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Billing &amp; invoices</h1>
        <p className="text-sm text-gray-600">
          One invoice per branch per month, issued on the 1st and emailed to your billing contact.
          {dd && ' Invoices marked "Direct Debit" are settled automatically through GoCardless; they are here for your records.'}
          {bank && ' Invoices marked "Bank transfer" are payable within 14 days; the bank details are on the PDF.'}
          {' '}Questions: info@getrealhealthpgd.co.uk.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">
          No invoices yet. The first one is issued on the 1st of the month after billing starts.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="text-left px-4 py-2">Invoice</th>
                <th className="text-left px-4 py-2">Branch</th>
                <th className="text-left px-4 py-2">Month</th>
                <th className="text-right px-4 py-2">Amount</th>
                <th className="text-left px-4 py-2">Payment</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const s = STATUS[r.status] ?? STATUS.issued
                return (
                  <tr key={r.id} className={r.status === 'void' ? 'text-gray-400' : ''}>
                    <td className="px-4 py-2 font-mono text-xs">{r.invoiceNumber}</td>
                    <td className="px-4 py-2">{r.pharmacyName}</td>
                    <td className="px-4 py-2">{longDate(r.periodStart).replace(/^1 /, '')}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{gbp(r.amountPence)}</td>
                    <td className="px-4 py-2">
                      {r.paymentMethod === 'direct_debit' ? 'Direct Debit' : r.status === 'issued' ? `Bank transfer, due ${longDate(r.dueOn)}` : 'Bank transfer'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>
                      {r.status === 'paid' && r.paidAt && <span className="ml-2 text-xs text-gray-500">{longDate(r.paidAt)}</span>}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <a href={`/api/invoices/${r.id}/pdf`} target="_blank" rel="noopener" className="text-[color:var(--tenant-primary)] hover:underline text-xs font-medium">Download PDF</a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
