'use client'

import { Fragment, useMemo, useState } from 'react'
import type { InvoiceRow } from '@/lib/invoices'

const gbp = (p: number) => '£' + (p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const month = (iso: string) => { const [y, m] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }) }
const day = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? `${m[3]}/${m[2]}/${m[1]}` : iso }

const STATUS: Record<string, { label: string; cls: string }> = {
  issued: { label: 'Open', cls: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  void: { label: 'Void', cls: 'bg-gray-200 text-gray-600' },
}

export default function InvoicesClient({ rows: initial, today, currentPeriod }: { rows: InvoiceRow[]; today: string; currentPeriod: string }) {
  const [rows, setRows] = useState(initial)
  const [filter, setFilter] = useState('')
  const [show, setShow] = useState<'all' | 'open' | 'paid' | 'void'>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, setPending] = useState<{ key: string; text: string; input?: { label: string; value: string }; run: (input: string) => Promise<void> } | null>(null)
  const [period, setPeriod] = useState(currentPeriod)
  const [reissueVoid, setReissueVoid] = useState(false)

  const visible = useMemo(() => rows.filter((r) => {
    if (show === 'open' && !(r.status === 'issued')) return false
    if (show === 'paid' && r.status !== 'paid') return false
    if (show === 'void' && r.status !== 'void') return false
    if (filter && !`${r.invoiceNumber} ${r.pharmacyName} ${r.billToName} ${r.billToEmail ?? ''}`.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  }), [rows, show, filter])

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Failed (${res.status})`)
    return data
  }

  function generate() {
    setPending({
      key: 'generate',
      text: `Issue ${month(period)} invoices now for every billable branch that has none${reissueVoid ? ', including branches whose invoice for that month was voided' : ''}, and email each one to its billing contact?`,
      run: async () => {
        setPending(null); setBusy('generate')
        try {
          const d = await post('/api/admin/invoices', { action: 'generate', period, reissueVoid })
          const n = d.created?.length ?? 0
          setNotice({ kind: n ? 'ok' : 'error', text: n ? `${n} issued, ${d.sent?.length ?? 0} emailed${d.unsent?.length ? `, ${d.unsent.length} not emailed: ${d.unsent.map((u: { invoiceNumber: string; error: string }) => `${u.invoiceNumber} (${u.error})`).join('; ')}` : ''}. Reloading…` : `Nothing to issue for ${month(period)}: ${d.skipped} branch(es) already invoiced.` })
          if (n) setTimeout(() => window.location.reload(), 1800)
        } catch (e) { setNotice({ kind: 'error', text: e instanceof Error ? e.message : String(e) }) } finally { setBusy(null) }
      },
    })
  }

  function act(r: InvoiceRow, action: 'paid' | 'void' | 'reopen' | 'send') {
    const texts = {
      paid: `Mark ${r.invoiceNumber} (${r.pharmacyName}, ${gbp(r.amountPence)}) as paid?`,
      void: `Void ${r.invoiceNumber}? It stays on record marked void and is not re-issued automatically; use "Issue invoices now" with the re-issue box ticked if a replacement is wanted.`,
      reopen: `Reopen ${r.invoiceNumber} as unpaid?`,
      send: `Email ${r.invoiceNumber} as a PDF?`,
    }
    const input = action === 'send'
      ? { label: 'Send to', value: r.billToEmail ?? '' }
      : action === 'paid' || action === 'void'
        ? { label: 'Note (optional)', value: '' }
        : undefined
    setPending({
      key: r.id, text: texts[action], input,
      run: async (val) => {
        setPending(null); setBusy(r.id)
        try {
          const d = await post(`/api/admin/invoices/${r.id}`, { action, ...(action === 'send' ? { to: val } : { note: val }) })
          const now = new Date().toISOString()
          setRows((prev) => prev.map((x) => x.id !== r.id ? x :
            action === 'paid' ? { ...x, status: 'paid', paidAt: now, paidNote: val || null }
            : action === 'void' ? { ...x, status: 'void', paidNote: val || null }
            : action === 'reopen' ? { ...x, status: 'issued', paidAt: null, paidNote: null }
            : { ...x, emailedAt: now, emailedTo: d.to ?? x.emailedTo }))
          setNotice({ kind: 'ok', text: action === 'send' ? `${r.invoiceNumber} sent to ${d.to}.` : `${r.invoiceNumber} ${action === 'paid' ? 'marked paid' : action === 'void' ? 'voided' : 'reopened'}.` })
        } catch (e) { setNotice({ kind: 'error', text: e instanceof Error ? e.message : String(e) }) } finally { setBusy(null) }
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-700">Month</label>
          <input type="month" value={period.slice(0, 7)} onChange={(e) => setPeriod(e.target.value ? `${e.target.value}-01` : currentPeriod)} className="mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
        </div>
        <button onClick={generate} disabled={busy === 'generate'} className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50">Issue {month(period)} invoices now</button>
        <label className="flex items-center gap-2 text-xs text-gray-700"><input type="checkbox" checked={reissueVoid} onChange={(e) => setReissueVoid(e.target.checked)} /> Re-issue where that month was voided</label>
        <p className="text-xs text-gray-500">A branch already invoiced for the month is skipped. The daily run (07:00 UTC) does this automatically and never re-issues a voided month.</p>
      </div>
      {pending && pending.key === 'generate' && <Confirm pending={pending} busy={busy === 'generate'} onCancel={() => setPending(null)} />}
      {notice && (
        <div className={`rounded-lg p-3 text-sm border ${notice.kind === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
          {notice.text}<button onClick={() => setNotice(null)} className="ml-3 text-xs underline">Dismiss</button>
        </div>
      )}
      <div className="flex gap-2 items-center flex-wrap">
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by number, pharmacy, bill-to" className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm" />
        {(['all', 'open', 'paid', 'void'] as const).map((s) => (
          <button key={s} onClick={() => setShow(s)} className={`px-3 py-1.5 text-xs rounded-md border ${show === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>{s[0].toUpperCase() + s.slice(1)}</button>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="text-left px-3 py-2">Invoice</th>
              <th className="text-left px-3 py-2">Branch / bill to</th>
              <th className="text-left px-3 py-2">Month</th>
              <th className="text-right px-3 py-2">Amount</th>
              <th className="text-left px-3 py-2">Method</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Emailed</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500">No invoices{rows.length ? ' match' : ' yet'}.</td></tr>}
            {visible.map((r) => {
              const s = STATUS[r.status] ?? STATUS.issued
              const overdue = r.status === 'issued' && r.paymentMethod === 'bank_transfer' && r.dueOn < today
              return (
                <Fragment key={r.id}>
                  <tr className={r.status === 'void' ? 'text-gray-400' : ''}>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.invoiceNumber}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{r.pharmacyName}</div>
                      <div className="text-xs text-gray-500">{r.billToName}{r.billToEmail ? `, ${r.billToEmail}` : ', no email'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{month(r.periodStart)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{gbp(r.amountPence)}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{r.paymentMethod === 'direct_debit' ? 'Direct Debit' : `Bank transfer, due ${day(r.dueOn)}`}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${overdue ? 'bg-red-100 text-red-800' : s.cls}`}>{overdue ? 'Overdue' : s.label}</span>
                      {r.status === 'paid' && r.paidAt && <div className="text-[11px] text-gray-500">{day(r.paidAt)}{r.paidNote ? `, ${r.paidNote}` : ''}</div>}
                      {r.status === 'void' && r.paidNote && <div className="text-[11px] text-gray-500">{r.paidNote}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.emailedAt ? `${day(r.emailedAt)} to ${r.emailedTo}` : 'not sent'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex gap-1 justify-end">
                        <a href={`/api/invoices/${r.id}/pdf`} target="_blank" rel="noopener" className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">PDF</a>
                        {r.status !== 'void' && <button onClick={() => act(r, 'send')} disabled={busy === r.id} className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50">Email</button>}
                        {r.status === 'issued' && <button onClick={() => act(r, 'paid')} disabled={busy === r.id} className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50">Mark paid</button>}
                        {r.status === 'paid' && <button onClick={() => act(r, 'reopen')} disabled={busy === r.id} className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50">Reopen</button>}
                        {r.status !== 'void' && <button onClick={() => act(r, 'void')} disabled={busy === r.id} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50">Void</button>}
                      </div>
                    </td>
                  </tr>
                  {pending && pending.key === r.id && (
                    <tr><td colSpan={8} className="px-3 pb-3"><Confirm pending={pending} busy={busy === r.id} onCancel={() => setPending(null)} /></td></tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Confirm({ pending, busy, onCancel }: { pending: { text: string; input?: { label: string; value: string }; run: (input: string) => Promise<void> }; busy: boolean; onCancel: () => void }) {
  const [val, setVal] = useState(pending.input?.value ?? '')
  return (
    <div className="rounded-lg border border-teal-300 bg-teal-50 p-3 text-sm text-teal-900">
      <p>{pending.text}</p>
      {pending.input && (
        <div className="mt-2">
          <label className="block text-xs font-medium text-teal-900">{pending.input.label}</label>
          <input type="text" value={val} onChange={(e) => setVal(e.target.value)} className="mt-1 w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white" />
        </div>
      )}
      <div className="mt-2 flex gap-2 justify-end">
        <button onClick={onCancel} disabled={busy} className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded-md">Cancel</button>
        <button onClick={() => pending.run(val.trim())} disabled={busy} className="px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50">{busy ? 'Working…' : 'Yes, go ahead'}</button>
      </div>
    </div>
  )
}
