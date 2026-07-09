'use client'

import { Fragment, useMemo, useState } from 'react'

interface Pgd {
  slug: string
  title: string
  subtitle: string
  category: string
}

// Sticky-header checkbox grid. Each toggle saves immediately by PUTting
// the pharmacy's full slug list to the existing admin endpoint; a small
// per-pharmacy status dot shows saving / saved / error.

export function MatrixClient({
  pharmacies,
  pgds,
  initialAssigned,
}: {
  pharmacies: { id: string; name: string }[]
  pgds: Pgd[]
  initialAssigned: Record<string, string[]>
}) {
  const [assigned, setAssigned] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      pharmacies.map((p) => [p.id, new Set(initialAssigned[p.id] ?? [])])
    )
  )
  const [saving, setSaving] = useState<Record<string, 'saving' | 'saved' | 'error'>>({})
  const [filter, setFilter] = useState('')

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const visible = q
      ? pgds.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.slug.includes(q) ||
            p.category.toLowerCase().includes(q)
        )
      : pgds
    const m = new Map<string, Pgd[]>()
    for (const p of visible) {
      const list = m.get(p.category) ?? []
      list.push(p)
      m.set(p.category, list)
    }
    return m
  }, [pgds, filter])

  async function save(pharmacyId: string, next: Set<string>) {
    setSaving((s) => ({ ...s, [pharmacyId]: 'saving' }))
    try {
      const res = await fetch(`/api/admin/pharmacies/${pharmacyId}/pgds`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slugs: [...next] }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setSaving((s) => ({ ...s, [pharmacyId]: 'saved' }))
      setTimeout(
        () => setSaving((s) => ({ ...s, [pharmacyId]: undefined as never })),
        1500
      )
    } catch {
      setSaving((s) => ({ ...s, [pharmacyId]: 'error' }))
    }
  }

  function toggle(pharmacyId: string, slug: string) {
    setAssigned((prev) => {
      const next = new Set(prev[pharmacyId])
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      void save(pharmacyId, next)
      return { ...prev, [pharmacyId]: next }
    })
  }

  function setAllForPharmacy(pharmacyId: string, on: boolean) {
    setAssigned((prev) => {
      const next = on ? new Set(pgds.map((p) => p.slug)) : new Set<string>()
      void save(pharmacyId, next)
      return { ...prev, [pharmacyId]: next }
    })
  }

  return (
    <div className="p-6 md:p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">PGD Matrix</h1>
        <p className="text-sm text-gray-600 mt-1">
          Tick a box to allow that PGD for a pharmacy — this grants the signed
          document, the ePGD tool and the linked training together. Changes
          save instantly.
        </p>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter PGDs…"
          className="mt-3 w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </header>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="text-sm border-collapse min-w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="text-left px-3 py-2 border-b border-gray-200 min-w-[220px]">
                PGD
              </th>
              {pharmacies.map((ph) => (
                <th
                  key={ph.id}
                  className="px-2 py-2 border-b border-gray-200 text-xs font-semibold text-gray-700 align-bottom"
                >
                  <div className="max-w-[90px] mx-auto whitespace-normal leading-tight">
                    {ph.name}
                    <span className="block mt-0.5 h-2 text-[10px] font-normal">
                      {saving[ph.id] === 'saving' && (
                        <span className="text-amber-500">saving…</span>
                      )}
                      {saving[ph.id] === 'saved' && (
                        <span className="text-emerald-600">saved ✓</span>
                      )}
                      {saving[ph.id] === 'error' && (
                        <span className="text-rose-600">failed — retry</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-center gap-1 text-[10px] font-normal">
                    <button
                      type="button"
                      onClick={() => setAllForPharmacy(ph.id, true)}
                      className="text-teal-600 hover:underline"
                    >
                      all
                    </button>
                    <span className="text-gray-300">/</span>
                    <button
                      type="button"
                      onClick={() => setAllForPharmacy(ph.id, false)}
                      className="text-gray-500 hover:underline"
                    >
                      none
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...grouped.entries()].map(([category, rows]) => (
              <Fragment key={category}>
                <tr>
                  <td
                    colSpan={pharmacies.length + 1}
                    className="px-3 py-1.5 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100"
                  >
                    {category}
                  </td>
                </tr>
                {rows.map((p) => (
                  <tr key={p.slug} className="hover:bg-teal-50/40">
                    <td className="px-3 py-1.5 border-b border-gray-100">
                      <span className="font-medium text-gray-900">
                        {p.title}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {p.subtitle}
                      </span>
                    </td>
                    {pharmacies.map((ph) => (
                      <td
                        key={ph.id}
                        className="px-2 py-1.5 text-center border-b border-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={assigned[ph.id]?.has(p.slug) ?? false}
                          onChange={() => toggle(ph.id, p.slug)}
                          className="w-4 h-4 accent-teal-600 cursor-pointer"
                          aria-label={`${p.title} for ${ph.name}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
