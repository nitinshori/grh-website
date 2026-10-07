'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PgdAuthRow } from '@/lib/authorisations'

const ukDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export function AuthorisationsClient({ rows, defaultName, defaultGphc, pharmacyName, declaration, canManage }: {
  rows: PgdAuthRow[]
  defaultName: string
  defaultGphc: string
  pharmacyName: string
  declaration: string
  canManage: boolean
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [name, setName] = useState(defaultName)
  const [gphc, setGphc] = useState(defaultGphc)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'todo'>('todo')

  const todo = useMemo(() => rows.filter((r) => r.state !== 'signed'), [rows])
  const visible = filter === 'todo' ? todo : rows
  const byCategory = useMemo(() => {
    const m = new Map<string, PgdAuthRow[]>()
    for (const r of visible) m.set(r.category, [...(m.get(r.category) ?? []), r])
    return [...m.entries()]
  }, [visible])
  const counts = {
    signed: rows.filter((r) => r.state === 'signed').length,
    updated: rows.filter((r) => r.state === 'updated').length,
    unsigned: rows.filter((r) => r.state === 'unsigned').length,
  }

  function toggle(slug: string) {
    setSelected((prev) => { const n = new Set(prev); if (n.has(slug)) n.delete(slug); else n.add(slug); return n })
  }
  function selectAllTodo() { setSelected(new Set(todo.map((r) => r.slug))) }

  async function sign() {
    setNotice(null)
    if (selected.size === 0) { setNotice({ kind: 'error', text: 'Tick the PGDs you have read.' }); return }
    if (!agree) { setNotice({ kind: 'error', text: 'Tick the declaration to sign.' }); return }
    setBusy(true)
    try {
      const res = await fetch('/api/dashboard/authorisations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: [...selected], signedName: name, gphcNumber: gphc || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setNotice({ kind: 'error', text: data.error || `Failed (${res.status})` }); return }
      setNotice({ kind: 'ok', text: `Signed ${data.signed} PGD${data.signed === 1 ? '' : 's'}${data.skipped ? ` (${data.skipped} already signed at this version)` : ''}. Your manager will countersign.` })
      setSelected(new Set()); setAgree(false)
      router.refresh()
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Failed' })
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Signed" value={counts.signed} cls="text-green-700" />
        <Tile label="Reissued, re-sign" value={counts.updated} cls={counts.updated ? 'text-amber-700' : 'text-gray-900'} />
        <Tile label="Not yet signed" value={counts.unsigned} cls={counts.unsigned ? 'text-red-700' : 'text-gray-900'} />
      </div>
      {canManage && (
        <p className="text-xs text-gray-600">You are a pharmacy admin: countersign your team and download the register on the <a href="/for-pharmacies/dashboard/authorisations/team" className="text-[color:var(--tenant-primary)] underline">team page</a>.</p>
      )}
      {notice && (
        <div className={`rounded-lg p-3 text-sm border ${notice.kind === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-900'}`}>
          {notice.text} <button onClick={() => setNotice(null)} className="ml-2 text-xs underline">Dismiss</button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter('todo')} className={`px-3 py-1.5 text-xs rounded-md border ${filter === 'todo' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>To sign ({todo.length})</button>
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs rounded-md border ${filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>All ({rows.length})</button>
        {todo.length > 0 && <button onClick={selectAllTodo} className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white text-gray-700">Select all to sign</button>}
        {selected.size > 0 && <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white text-gray-700">Clear</button>}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-600">
          {rows.length === 0 ? `No PGDs with a document are assigned to ${pharmacyName} yet.` : 'Everything is signed at its current version.'}
        </div>
      ) : byCategory.map(([cat, list]) => (
        <div key={cat} className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-2 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">{cat}</div>
          <ul className="divide-y divide-gray-100">
            {list.map((r) => (
              <li key={r.slug} className="px-4 py-2 flex items-center gap-3">
                {r.state !== 'signed' ? (
                  <input type="checkbox" checked={selected.has(r.slug)} onChange={() => toggle(r.slug)} className="h-4 w-4" aria-label={`Select ${r.title}`} />
                ) : <span className="h-4 w-4 inline-block" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-900 font-medium truncate">{r.title}</div>
                  <div className="text-[11px] text-gray-500">
                    Current {r.version.version}{r.version.source === 'override' ? ' (your pharmacy’s signed copy)' : ''}
                    {r.state === 'signed' && <> · signed {ukDate(r.signedAt)}{r.countersignedAt ? `, countersigned by ${r.countersignedName} ${ukDate(r.countersignedAt)}` : ', awaiting countersignature'}</>}
                    {r.state === 'updated' && <> · you signed {r.signedVersion} on {ukDate(r.signedAt)}; the PGD has been reissued since</>}
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${r.state === 'signed' ? 'bg-green-100 text-green-800' : r.state === 'updated' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                  {r.state === 'signed' ? 'Signed' : r.state === 'updated' ? 'Re-sign' : 'Not signed'}
                </span>
                <a href={`/api/dashboard/pgd-document/${r.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[color:var(--tenant-primary)] hover:underline whitespace-nowrap">Read PDF</a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {todo.length > 0 && (
        <div className="bg-white border-2 border-[color:var(--tenant-primary)]/40 rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Sign {selected.size} selected PGD{selected.size === 1 ? '' : 's'}</h2>
          <p className="text-xs text-gray-600">Read each PGD before you sign it. Your signature is recorded with the document version, the date and time, and is shown to your pharmacy&apos;s authorising manager for countersignature.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Your full name (as on the GPhC register)</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">GPhC registration number</label>
              <input type="text" inputMode="numeric" value={gphc} onChange={(e) => setGphc(e.target.value.replace(/\D/g, '').slice(0, 7))} placeholder="7 digits" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>{declaration}</span>
          </label>
          <div className="flex justify-end">
            <button onClick={sign} disabled={busy || selected.size === 0} className="px-4 py-2 text-sm bg-[color:var(--tenant-primary)] text-white font-semibold rounded-md disabled:opacity-50">
              {busy ? 'Signing…' : `Sign ${selected.size || ''} PGD${selected.size === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}
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
