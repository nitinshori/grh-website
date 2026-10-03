'use client'

import { useMemo, useState } from 'react'
import type { BillingRow } from '@/lib/billing'

function gbp(pence: number | null | undefined): string {
  if (pence == null) return ''
  return '£' + (pence / 100).toLocaleString('en-GB', { maximumFractionDigits: 2 })
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/London' })
}

interface EditState {
  feePounds: string
  changePounds: string
  changeOn: string
  notes: string
}

export default function BillingClient({ rows: initial, today }: { rows: BillingRow[]; today: string }) {
  const [rows, setRows] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<EditState>({ feePounds: '', changePounds: '', changeOn: '', notes: '' })
  const [busy, setBusy] = useState<string | null>(null)
  // In-page confirmation and messages: Chrome silences alert/confirm/prompt
  // for a site once "prevent this page from creating additional dialogs"
  // has been ticked (3 Oct 2026), so nothing here uses a browser dialog.
  const [notice, setNotice] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null)
  const [pending, setPending] = useState<{ rowId: string; text: string; run: () => Promise<void> } | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [branch, setBranch] = useState({ name: '', address: '', gphc: '', feePounds: '' })
  const [filter, setFilter] = useState('')

  // Group by group_slug; a single-site pharmacy is a group of one.
  const groups = useMemo(() => {
    const m = new Map<string, BillingRow[]>()
    for (const r of rows) {
      if (filter && !`${r.pharmacyName} ${r.groupName ?? ''} ${r.groupSlug ?? ''}`.toLowerCase().includes(filter.toLowerCase())) continue
      const k = r.groupSlug ?? r.pharmacyId
      m.set(k, [...(m.get(k) ?? []), r])
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length || a[1][0].pharmacyName.localeCompare(b[1][0].pharmacyName))
  }, [rows, filter])

  function startEdit(r: BillingRow) {
    setEditing(r.id)
    setForm({
      feePounds: String(r.monthlyFeePence / 100),
      changePounds: r.feeChangePence != null && !r.feeChangeAppliedAt ? String(r.feeChangePence / 100) : '',
      changeOn: r.feeChangeOn && !r.feeChangeAppliedAt ? r.feeChangeOn : '',
      notes: r.notes ?? '',
    })
  }

  async function save(r: BillingRow) {
    const fee = Math.round(parseFloat(form.feePounds) * 100)
    if (!Number.isFinite(fee) || fee < 100) { setNotice({ kind: 'error', text: 'Monthly fee must be at least £1' }); return }
    const hasChange = form.changePounds.trim() !== '' || form.changeOn.trim() !== ''
    const changePence = hasChange ? Math.round(parseFloat(form.changePounds) * 100) : null
    if (hasChange && (!Number.isFinite(changePence as number) || (changePence as number) < 100 || !form.changeOn)) {
      setNotice({ kind: 'error', text: 'A scheduled change needs both a fee and a date' }); return
    }
    // Only send the schedule when it differs from the pending one, so a
    // notes-only edit does not erase an already-applied change's history.
    const pendingPence = r.feeChangeAppliedAt ? null : r.feeChangePence
    const pendingOn = r.feeChangeAppliedAt ? null : r.feeChangeOn
    const scheduleChanged = changePence !== pendingPence || (hasChange ? form.changeOn : null) !== pendingOn
    const payload: Record<string, unknown> = { notes: form.notes.trim() || null }
    if (fee !== r.monthlyFeePence) payload.monthlyFeePence = fee
    if (scheduleChanged) { payload.feeChangePence = changePence; payload.feeChangeOn = hasChange ? form.changeOn : null }
    const doSave = async () => { await saveConfirmed(r, fee, changePence, hasChange, scheduleChanged, payload) }
    if (fee !== r.monthlyFeePence && !pending) {
      setPending({ rowId: r.id, text: `Change ${r.pharmacyName} from ${gbp(r.monthlyFeePence)} to ${gbp(fee)} per month in GoCardless now? GoCardless allows 10 amount changes over a subscription's life, and the new amount applies to payments not yet created (they are created a few working days before collection).`, run: doSave })
      return
    }
    await doSave()
  }

  async function saveConfirmed(r: BillingRow, fee: number, changePence: number | null, hasChange: boolean, scheduleChanged: boolean, payload: Record<string, unknown>) {
    setPending(null)
    setBusy(r.id)
    try {
      const res = await fetch(`/api/admin/billing/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) { setNotice({ kind: 'error', text: body.error || 'Could not save' }); if (/no longer active/.test(body.error || '')) setTimeout(() => window.location.reload(), 2500); return }
      setNotice({ kind: 'ok', text: `${r.pharmacyName} saved.` })
      setRows((prev) => prev.map((x) => x.id === r.id ? {
        ...x,
        monthlyFeePence: fee,
        notes: form.notes.trim() || null,
        ...(scheduleChanged ? { feeChangePence: changePence, feeChangeOn: hasChange ? form.changeOn : null, feeChangeAppliedAt: null } : {}),
      } : x))
      setEditing(null)
    } finally { setBusy(null) }
  }

  function openAddBranch(r: BillingRow) {
    setAdding(r.id)
    setBranch({ name: '', address: '', gphc: '', feePounds: String(r.monthlyFeePence / 100) })
    setNotice(null)
  }

  async function addBranch(r: BillingRow) {
    const name = branch.name.trim()
    if (name.length < 2) { setNotice({ kind: 'error', text: 'Give the branch a name' }); return }
    const fee = Math.round(parseFloat(branch.feePounds) * 100)
    if (!Number.isFinite(fee) || fee < 100) { setNotice({ kind: 'error', text: 'Enter a fee, e.g. 100' }); return }
    const run = async () => {
      setPending(null)
      setBusy(r.id)
      try {
        const res = await fetch('/api/admin/billing/add-branch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceRowId: r.id, name, address: branch.address.trim() || null, gphc: branch.gphc.trim() || null, monthlyFeePence: fee }),
        })
        const body = await res.json()
        if (!res.ok) { setNotice({ kind: 'error', text: body.error || 'Failed' }); return }
        setNotice(body.error
          ? { kind: 'error', text: `Branch created but the GoCardless subscription failed: ${body.error}. Use Retry on its row.` }
          : { kind: 'ok', text: `${name} created on ${r.pharmacyName}'s Direct Debit at ${gbp(fee)}/month. Reloading…` })
        setAdding(null)
        setTimeout(() => window.location.reload(), 1500)
      } finally { setBusy(null) }
    }
    setPending({ rowId: r.id, text: `Create "${name}" in group ${r.groupSlug ?? '(none)'}, assign every PGD, and start a ${gbp(fee)}/month subscription on mandate ${r.mandateId}?`, run })
  }

  async function act(r: BillingRow, action: 'apply' | 'retry' | 'cancel') {
    const msg = action === 'apply'
      ? `Apply the scheduled change for ${r.pharmacyName} now: ${gbp(r.monthlyFeePence)} to ${gbp(r.feeChangePence)} per month?`
      : action === 'retry'
        ? `Create the GoCardless subscription for ${r.pharmacyName} at ${gbp(r.monthlyFeePence)} per month?`
        : `Cancel billing for ${r.pharmacyName}? The GoCardless subscription is cancelled; no further payments are collected.`
    setPending({ rowId: r.id, text: msg, run: () => actConfirmed(r, action) })
  }

  async function actConfirmed(r: BillingRow, action: 'apply' | 'retry' | 'cancel') {
    setPending(null)
    setBusy(r.id)
    try {
      const res = await fetch(`/api/admin/billing/${r.id}?action=${action}`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) { setNotice({ kind: 'error', text: body.error || 'Failed' }); return }
      setNotice({ kind: 'ok', text: action === 'cancel' ? `Billing cancelled for ${r.pharmacyName}.` : action === 'retry' ? `Subscription created for ${r.pharmacyName}.` : `Fee change applied for ${r.pharmacyName}.` })
      setRows((prev) => prev.map((x) => x.id !== r.id ? x : action === 'apply'
        ? { ...x, monthlyFeePence: x.feeChangePence ?? x.monthlyFeePence, feeChangeAppliedAt: new Date().toISOString() }
        : action === 'retry'
          ? { ...x, subscriptionId: body.subscriptionId, subscriptionError: null }
          : { ...x, cancelledAt: new Date().toISOString() }))
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-4">
      <input
        type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by pharmacy or group"
        className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
      {notice && (
        <div className={`rounded-lg p-3 text-sm border ${notice.kind === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-3 text-xs underline">Dismiss</button>
        </div>
      )}
      {groups.length === 0 && <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">No billed pharmacies yet.</div>}
      {groups.map(([key, list]) => {
        const total = list.filter((r) => r.isActive && r.subscriptionId && !r.cancelledAt).reduce((s, r) => s + r.monthlyFeePence, 0)
        const title = list.length > 1 ? (list[0].groupName || key) : list[0].pharmacyName
        return (
          <div key={key} className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-500">{list.length > 1 ? `Group of ${list.length}, ` : ''}group slug <code className="select-all">{list[0].groupSlug ?? 'none'}</code></p>
              </div>
              <div className="text-sm font-semibold text-teal-700">{gbp(total)}/month</div>
            </div>
            <div className="divide-y divide-gray-100">
              {list.map((r) => {
                const pendingChange = r.feeChangePence != null && r.feeChangeOn && !r.feeChangeAppliedAt && !r.cancelledAt
                const overdue = pendingChange && r.feeChangeOn! <= today
                return (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{r.pharmacyName}</span>
                          {!r.isActive && <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">inactive</span>}
                          {r.cancelledAt && <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">CANCELLED {fmtDate(r.cancelledAt)}</span>}
                          {!r.subscriptionId && !r.cancelledAt && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">NO SUBSCRIPTION</span>}
                          {overdue && <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">CHANGE OVERDUE</span>}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          <span className="font-semibold">{gbp(r.monthlyFeePence)}</span> per month
                          {pendingChange && <span className="text-indigo-700">, {gbp(r.feeChangePence)} from {r.feeChangeOn}</span>}
                          {r.feeChangeAppliedAt && r.feeChangePence != null && <span className="text-gray-500">, changed to {gbp(r.feeChangePence)} on {fmtDate(r.feeChangeAppliedAt)}</span>}
                        </div>
                        {r.subscriptionError && <div className="text-xs text-red-700 mt-0.5">GoCardless: {r.subscriptionError}</div>}
                        {r.notes && <div className="text-xs text-gray-500 mt-0.5">{r.notes}</div>}
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {r.mandateId && <>Mandate <code>{r.mandateId}</code> </>}
                          {r.subscriptionId && <>Subscription <code>{r.subscriptionId}</code></>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!r.subscriptionId && !r.cancelledAt && r.mandateId && (
                          <button onClick={() => act(r, 'retry')} disabled={busy === r.id} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-md disabled:opacity-50">Retry subscription</button>
                        )}
                        {pendingChange && (
                          <button onClick={() => act(r, 'apply')} disabled={busy === r.id} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md disabled:opacity-50">Apply change now</button>
                        )}
                        {r.mandateId && !r.cancelledAt && (
                          <button onClick={() => (adding === r.id ? setAdding(null) : openAddBranch(r))} disabled={busy === r.id} className="px-3 py-1.5 text-xs bg-white border border-teal-300 text-teal-700 hover:bg-teal-50 font-medium rounded-md disabled:opacity-50">{adding === r.id ? 'Close' : 'Add a branch on this DD'}</button>
                        )}
                        {r.subscriptionId && !r.cancelledAt && (
                          <button onClick={() => act(r, 'cancel')} disabled={busy === r.id} className="px-3 py-1.5 text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-md disabled:opacity-50">Cancel billing</button>
                        )}
                        <button onClick={() => (editing === r.id ? setEditing(null) : startEdit(r))} disabled={busy === r.id} className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-md disabled:opacity-50">
                          {editing === r.id ? 'Close' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    {pending && pending.rowId === r.id && (
                      <div className="mt-3 rounded-lg border border-teal-300 bg-teal-50 p-3 text-sm text-teal-900">
                        <p>{pending.text}</p>
                        <div className="mt-2 flex gap-2 justify-end">
                          <button onClick={() => setPending(null)} disabled={busy === r.id} className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded-md">Cancel</button>
                          <button onClick={() => pending.run()} disabled={busy === r.id} className="px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50">{busy === r.id ? 'Working…' : 'Yes, go ahead'}</button>
                        </div>
                      </div>
                    )}
                    {adding === r.id && (
                      <div className="mt-3 grid sm:grid-cols-2 gap-3 bg-teal-50 border border-teal-200 rounded-lg p-3">
                        <div className="sm:col-span-2 text-xs text-teal-900">New branch billed on <strong>{r.pharmacyName}</strong>&apos;s Direct Debit (mandate <code>{r.mandateId}</code>), in group <code>{r.groupSlug ?? 'none'}</code>, with every PGD.</div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Branch name</label>
                          <input type="text" value={branch.name} onChange={(e) => setBranch((b) => ({ ...b, name: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Monthly fee (£ ex VAT)</label>
                          <input type="number" min={1} step="0.01" value={branch.feePounds} onChange={(e) => setBranch((b) => ({ ...b, feePounds: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Address and postcode</label>
                          <input type="text" value={branch.address} onChange={(e) => setBranch((b) => ({ ...b, address: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">GPhC premises number (and ODS if known)</label>
                          <input type="text" value={branch.gphc} onChange={(e) => setBranch((b) => ({ ...b, gphc: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                          <button onClick={() => addBranch(r)} disabled={busy === r.id} className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50">Create branch and start billing</button>
                        </div>
                      </div>
                    )}
                    {editing === r.id && (
                      <div className="mt-3 grid sm:grid-cols-3 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Monthly fee (£)</label>
                          <input type="number" min={1} step="0.01" value={form.feePounds} onChange={(e) => setForm((f) => ({ ...f, feePounds: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Scheduled fee (£)</label>
                          <input type="number" min={1} step="0.01" value={form.changePounds} onChange={(e) => setForm((f) => ({ ...f, changePounds: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="blank = none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">On date</label>
                          <input type="date" value={form.changeOn} onChange={(e) => setForm((f) => ({ ...f, changeOn: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-gray-700">Notes</label>
                          <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                          <button onClick={() => save(r)} disabled={busy === r.id} className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50">
                            {busy === r.id ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
