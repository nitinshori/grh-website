'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TeamMember } from '@/lib/authorisations'

const ukDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export function TeamClient({ members, branches, anchorPharmacyId, isSuperAdmin, selfUserId }: {
  members: TeamMember[]
  branches: Array<{ id: string; name: string }>
  anchorPharmacyId: string
  isSuperAdmin: boolean
  selfUserId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, setPending] = useState<{ key: string; text: string; input?: { label: string }; run: (val: string) => Promise<void> } | null>(null)
  const [registerBranch, setRegisterBranch] = useState(anchorPharmacyId)

  const pendingAll = useMemo(() => members.flatMap((m) => m.rows.filter((r) => r.state === 'signed' && !r.countersignedAt && r.authorisationId).map((r) => r.authorisationId as string)), [members])
  const totals = members.reduce((a, m) => ({ signed: a.signed + m.counts.signed, updated: a.updated + m.counts.updated, unsigned: a.unsigned + m.counts.unsigned }), { signed: 0, updated: 0, unsigned: 0 })

  async function post(body: unknown) {
    const res = await fetch('/api/dashboard/authorisations/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(body as object), ...(isSuperAdmin ? { pharmacyId: anchorPharmacyId } : {}) }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Failed (${res.status})`)
    return data
  }

  function countersign(ids: string[], label: string, key: string) {
    setPending({
      key,
      text: `Countersign ${ids.length} signature${ids.length === 1 ? '' : 's'} ${label} on behalf of the pharmacy? This records your name, the date and time against each one.`,
      run: async () => {
        setPending(null); setBusy(key)
        try {
          const d = await post({ action: 'countersign', ids })
          setNotice({ kind: 'ok', text: `${d.countersigned} countersigned.` })
          router.refresh()
        } catch (e) { setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Failed' }) } finally { setBusy(null) }
      },
    })
  }

  function revoke(id: string, who: string, title: string) {
    setPending({
      key: id,
      text: `Withdraw ${who}'s authorisation for ${title}? It stays on record as withdrawn; they can sign again.`,
      input: { label: 'Reason (goes on the record)' },
      run: async (reason) => {
        setPending(null); setBusy(id)
        try {
          await post({ action: 'revoke', id, reason })
          setNotice({ kind: 'ok', text: 'Authorisation withdrawn.' })
          router.refresh()
        } catch (e) { setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Failed' }) } finally { setBusy(null) }
      },
    })
  }

  const registerHref = `/api/dashboard/authorisations/team?format=pdf&pharmacyId=${registerBranch}`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Practitioners" value={members.length} cls="text-gray-900" />
        <Tile label="Signed" value={totals.signed} cls="text-green-700" />
        <Tile label="Re-sign after reissue" value={totals.updated} cls={totals.updated ? 'text-amber-700' : 'text-gray-900'} />
        <Tile label="Awaiting countersign" value={pendingAll.length} cls={pendingAll.length ? 'text-indigo-700' : 'text-gray-900'} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => countersign(pendingAll, 'across the group', 'all')} disabled={pendingAll.length === 0 || busy === 'all'} className="px-4 py-2 text-sm bg-[color:var(--tenant-primary)] text-white font-semibold rounded-md disabled:opacity-50">
          Countersign all pending ({pendingAll.length})
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-gray-600">Register for</label>
          <select value={registerBranch} onChange={(e) => setRegisterBranch(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <a href={registerHref} target="_blank" rel="noopener" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Download register PDF</a>
        </div>
      </div>
      {pending && pending.key === 'all' && <Confirm pending={pending} busy={busy === 'all'} onCancel={() => setPending(null)} />}
      {notice && (
        <div className={`rounded-lg p-3 text-sm border ${notice.kind === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-900'}`}>
          {notice.text} <button onClick={() => setNotice(null)} className="ml-2 text-xs underline">Dismiss</button>
        </div>
      )}

      {members.length === 0 && <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">No practitioners yet. Invite them from Manage Staff.</div>}
      {members.map((m) => {
        const mine = m.rows.filter((r) => r.state === 'signed' && !r.countersignedAt && r.authorisationId).map((r) => r.authorisationId as string)
        const isSelf = m.userId === selfUserId
        return (
          <div key={m.userId} className="bg-white border border-gray-200 rounded-lg">
            <button onClick={() => setOpen(open === m.userId ? null : m.userId)} className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{m.name}{m.gphcNumber ? <span className="font-normal text-gray-500"> · GPhC {m.gphcNumber}</span> : null}{isSelf && <span className="ml-2 text-[11px] text-gray-500">(you)</span>}</div>
                <div className="text-xs text-gray-500">{m.homePharmacyName}{m.alsoWorksAt.length ? `, also ${m.alsoWorksAt.join(', ')}` : ''} · {m.role === 'pharmacy_admin' ? 'Pharmacy admin' : 'Pharmacist'}</div>
              </div>
              <div className="flex items-center gap-2 text-[11px] whitespace-nowrap">
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">{m.counts.signed} signed</span>
                {m.counts.updated > 0 && <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">{m.counts.updated} re-sign</span>}
                {m.counts.unsigned > 0 && <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{m.counts.unsigned} not signed</span>}
                {mine.length > 0 && <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">{mine.length} to countersign</span>}
                <span className="text-gray-400">{open === m.userId ? '▲' : '▼'}</span>
              </div>
            </button>
            {open === m.userId && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                {mine.length > 0 && (
                  <button onClick={() => countersign(mine, isSelf ? 'of your own (recorded as self-countersigned)' : `for ${m.name}`, m.userId)} disabled={busy === m.userId} className="px-3 py-1.5 text-xs bg-[color:var(--tenant-primary)] text-white font-medium rounded-md disabled:opacity-50">Countersign {mine.length} for {m.name}</button>
                )}
                {pending && pending.key === m.userId && <Confirm pending={pending} busy={busy === m.userId} onCancel={() => setPending(null)} />}
                <table className="min-w-full text-xs">
                  <thead className="text-gray-500 uppercase tracking-wide">
                    <tr><th className="text-left py-1 pr-2">PGD</th><th className="text-left py-1 pr-2">Current</th><th className="text-left py-1 pr-2">Status</th><th className="text-left py-1 pr-2">Signed</th><th className="text-left py-1 pr-2">Countersigned</th><th></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {m.rows.map((r) => (
                      <tr key={r.slug}>
                        <td className="py-1 pr-2 text-gray-900">{r.title}</td>
                        <td className="py-1 pr-2 text-gray-600">{r.version.version}</td>
                        <td className="py-1 pr-2">
                          <span className={`px-1.5 py-0.5 rounded ${r.state === 'signed' ? 'bg-green-100 text-green-800' : r.state === 'updated' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>{r.state === 'signed' ? 'Signed' : r.state === 'updated' ? `Reissued since ${r.signedVersion}` : 'Not signed'}</span>
                        </td>
                        <td className="py-1 pr-2 text-gray-600">{r.state === 'signed' ? ukDate(r.signedAt) : ''}</td>
                        <td className="py-1 pr-2 text-gray-600">{r.state === 'signed' ? (r.countersignedAt ? `${r.countersignedName}, ${ukDate(r.countersignedAt)}` : <span className="text-indigo-700">awaiting</span>) : ''}</td>
                        <td className="py-1 text-right">
                          {r.state === 'signed' && r.authorisationId && (
                            <button onClick={() => revoke(r.authorisationId as string, m.name, r.title)} disabled={busy === r.authorisationId} className="text-[11px] text-red-600 hover:underline disabled:opacity-50">Withdraw</button>
                          )}
                          {pending && r.authorisationId && pending.key === r.authorisationId && (
                            <div className="mt-1"><Confirm pending={pending} busy={busy === r.authorisationId} onCancel={() => setPending(null)} /></div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Confirm({ pending, busy, onCancel }: { pending: { text: string; input?: { label: string }; run: (val: string) => Promise<void> }; busy: boolean; onCancel: () => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="rounded-lg border border-teal-300 bg-teal-50 p-3 text-sm text-teal-900 text-left">
      <p>{pending.text}</p>
      {pending.input && (
        <div className="mt-2">
          <label className="block text-xs font-medium">{pending.input.label}</label>
          <input type="text" value={val} onChange={(e) => setVal(e.target.value)} className="mt-1 w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white" />
        </div>
      )}
      <div className="mt-2 flex gap-2 justify-end">
        <button onClick={onCancel} disabled={busy} className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded-md">Cancel</button>
        <button onClick={() => pending.run(val.trim())} disabled={busy || (!!pending.input && val.trim().length < 3)} className="px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md disabled:opacity-50">{busy ? 'Working…' : 'Yes, go ahead'}</button>
      </div>
    </div>
  )
}

function Tile({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  )
}
