'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_PGDS, PGD_CATEGORIES } from '@/lib/pgd-access'

interface PharmacyData {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  users: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isActive: boolean
  }>
  pgdSlugs: string[]
  // Per-PGD usage. Keyed by slug. Slugs with zero usage are NOT in the map.
  pgdUsage: Record<
    string,
    { started: number; completed: number; lastUsed: string | null }
  >
  // Per-PGD document overrides — uploaded customised signed PDFs.
  // Slugs without an override are NOT in this map. The pharmacist sees the
  // override if present, otherwise the GRH master from /public/pgd-documents.
  pgdOverrides: Record<
    string,
    {
      id: string
      url: string
      filename: string | null
      fileSizeBytes: number | null
      version: number
      signedByNames: string | null
      notes: string | null
      uploadedAt: string
    }
  >
}

interface PharmacyDetailClientProps {
  pharmacy: PharmacyData
}

type TabType = 'details' | 'pgds' | 'staff'

export function PharmacyDetailClient({ pharmacy: initialPharmacy }: PharmacyDetailClientProps) {
  const router = useRouter()
  const [pharmacy, setPharmacy] = useState<PharmacyData>(initialPharmacy)
  const [activeTab, setActiveTab] = useState<TabType>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Details Tab State
  const [detailsForm, setDetailsForm] = useState({
    name: pharmacy.name,
    address: pharmacy.address || '',
    phone: pharmacy.phone || '',
    email: pharmacy.email || '',
    isActive: pharmacy.isActive,
  })

  // PGD Tab State
  const [selectedPgds, setSelectedPgds] = useState<Set<string>>(
    new Set(pharmacy.pgdSlugs)
  )

  // Override upload state
  const [overrides, setOverrides] = useState<PharmacyData['pgdOverrides']>(
    pharmacy.pgdOverrides ?? {},
  )
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null)
  const [removingSlug, setRemovingSlug] = useState<string | null>(null)

  async function handleOverrideUpload(slug: string, file: File, signedByNames: string, notes: string) {
    setUploadingSlug(slug)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('pgdSlug', slug)
      if (signedByNames) fd.append('signedByNames', signedByNames)
      if (notes) fd.append('notes', notes)
      const res = await fetch(`/api/admin/pharmacies/${pharmacy.id}/pgd-documents`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setOverrides((prev) => ({
        ...prev,
        [slug]: {
          id: data.documentId,
          url: data.url,
          filename: file.name,
          fileSizeBytes: file.size,
          version: data.version,
          signedByNames: signedByNames || null,
          notes: notes || null,
          uploadedAt: new Date().toISOString(),
        },
      }))
      showMessage(`Uploaded custom PDF for ${slug} (v${data.version})`)
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Upload failed', true)
    } finally {
      setUploadingSlug(null)
    }
  }

  async function handleOverrideRemove(slug: string) {
    if (!confirm(`Remove the custom PDF for ${slug}? Pharmacists at this pharmacy will revert to the GRH master.`)) return
    setRemovingSlug(slug)
    try {
      const res = await fetch(
        `/api/admin/pharmacies/${pharmacy.id}/pgd-documents?slug=${encodeURIComponent(slug)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Remove failed')
      }
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[slug]
        return next
      })
      showMessage(`Removed custom PDF for ${slug}`)
    } catch (e) {
      showMessage(e instanceof Error ? e.message : 'Remove failed', true)
    } finally {
      setRemovingSlug(null)
    }
  }

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setError(message)
      setSuccessMessage(null)
    } else {
      setSuccessMessage(message)
      setError(null)
    }
    setTimeout(() => {
      setError(null)
      setSuccessMessage(null)
    }, 5000)
  }

  // ────────────────────────────────────────────────────────────────
  // Details Tab Handlers
  // ────────────────────────────────────────────────────────────────

  const handleDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setDetailsForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  const handleSaveDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!detailsForm.name.trim()) {
        showMessage('Pharmacy name is required', true)
        setLoading(false)
        return
      }

      const response = await fetch(`/api/admin/pharmacies/${pharmacy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: detailsForm.name,
          address: detailsForm.address || undefined,
          phone: detailsForm.phone || undefined,
          email: detailsForm.email || undefined,
          isActive: detailsForm.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save pharmacy details')
      }

      const updated = await response.json()
      setPharmacy((prev) => ({ ...prev, ...updated }))
      showMessage('Pharmacy details saved successfully')
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : 'An error occurred',
        true
      )
    } finally {
      setLoading(false)
    }
  }

  // ────────────────────────────────────────────────────────────────
  // PGD Tab Handlers
  // ────────────────────────────────────────────────────────────────

  const togglePgd = (slug: string) => {
    setSelectedPgds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(slug)) {
        newSet.delete(slug)
      } else {
        newSet.add(slug)
      }
      return newSet
    })
  }

  const selectAllInCategory = (category: string) => {
    const categoryPgds = ALL_PGDS.filter((pgd) => pgd.category === category)
    setSelectedPgds((prev) => {
      const newSet = new Set(prev)
      categoryPgds.forEach((pgd) => newSet.add(pgd.slug))
      return newSet
    })
  }

  const clearAllInCategory = (category: string) => {
    const categoryPgds = ALL_PGDS.filter((pgd) => pgd.category === category)
    setSelectedPgds((prev) => {
      const newSet = new Set(prev)
      categoryPgds.forEach((pgd) => newSet.delete(pgd.slug))
      return newSet
    })
  }

  const selectAllPgds = () => {
    setSelectedPgds(new Set(ALL_PGDS.map((pgd) => pgd.slug)))
  }

  const clearAllPgds = () => {
    setSelectedPgds(new Set())
  }

  const handleSavePgds = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/pharmacies/${pharmacy.id}/pgds`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slugs: Array.from(selectedPgds),
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save PGD assignments')
      }

      setPharmacy((prev) => ({
        ...prev,
        pgdSlugs: Array.from(selectedPgds),
      }))
      showMessage(`PGD assignments saved (${selectedPgds.size} PGDs assigned)`)
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : 'An error occurred',
        true
      )
    } finally {
      setLoading(false)
    }
  }

  const isSaveDisabled =
    JSON.stringify(selectedPgds) ===
    JSON.stringify(new Set(pharmacy.pgdSlugs))

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/admin/pharmacies"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Pharmacies
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{pharmacy.name}</h1>
              <p className="text-gray-600 mt-2">
                {pharmacy.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('pgds')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'pgds'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              PGD Access ({pharmacy.pgdSlugs.length})
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Staff ({pharmacy.users.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacy Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={detailsForm.name}
                    onChange={handleDetailsChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={detailsForm.address}
                    onChange={handleDetailsChange}
                    disabled={loading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={detailsForm.phone}
                      onChange={handleDetailsChange}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={detailsForm.email}
                      onChange={handleDetailsChange}
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={detailsForm.isActive}
                    onChange={handleDetailsChange}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Pharmacy
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveDetails}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: loading ? '#999' : '#25b4b4' }}
                  >
                    {loading ? 'Saving...' : 'Save Details'}
                  </button>
                </div>
              </div>
            )}

            {/* PGDs Tab */}
            {activeTab === 'pgds' && (
              <div className="space-y-6">
                {/* Usage Summary — only relevant once at least one consultation exists */}
                {Object.keys(pharmacy.pgdUsage).length > 0 && (() => {
                  const totalConsultations = Object.values(pharmacy.pgdUsage).reduce((a, u) => a + u.started, 0)
                  const totalCompleted = Object.values(pharmacy.pgdUsage).reduce((a, u) => a + u.completed, 0)
                  const activePgds = Object.keys(pharmacy.pgdUsage).length

                  // Build a ranked list (most-used first) to show "top 5"
                  const ranked = Object.entries(pharmacy.pgdUsage)
                    .map(([slug, u]) => ({
                      slug,
                      title: ALL_PGDS.find((p) => p.slug === slug)?.title ?? slug,
                      started: u.started,
                      completed: u.completed,
                      lastUsed: u.lastUsed,
                    }))
                    .sort((a, b) => b.started - a.started)

                  return (
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-5 mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Total consultations</p>
                          <p className="text-3xl font-bold text-gray-900">{totalConsultations}</p>
                          <p className="text-xs text-gray-600">{totalCompleted} completed · {totalConsultations - totalCompleted} in-progress / abandoned</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">PGDs in use</p>
                          <p className="text-3xl font-bold text-gray-900">{activePgds}</p>
                          <p className="text-xs text-gray-600">of {pharmacy.pgdSlugs.length} assigned ({pharmacy.pgdSlugs.length - activePgds} never used)</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Most used</p>
                          <p className="text-lg font-bold text-gray-900 truncate">{ranked[0]?.title ?? '—'}</p>
                          <p className="text-xs text-gray-600">{ranked[0]?.started ?? 0} consultations</p>
                        </div>
                      </div>

                      {/* Top 5 used */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-2">Top {Math.min(5, ranked.length)} by usage</p>
                        <div className="space-y-1">
                          {ranked.slice(0, 5).map((r) => (
                            <div key={r.slug} className="flex items-center justify-between text-sm bg-white rounded px-3 py-2 border border-gray-100">
                              <span className="font-medium text-gray-900 truncate">{r.title}</span>
                              <span className="text-gray-600 whitespace-nowrap ml-2">
                                <span className="font-semibold text-teal-700">{r.started}</span>
                                <span className="text-gray-400"> started</span>
                                <span className="text-gray-300"> · </span>
                                <span className="font-semibold text-green-700">{r.completed}</span>
                                <span className="text-gray-400"> done</span>
                                {r.lastUsed && (
                                  <span className="text-gray-400"> · last {new Date(r.lastUsed).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Global Actions */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={selectAllPgds}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#25b4b4' }}
                  >
                    Select All ({ALL_PGDS.length})
                  </button>
                  <button
                    onClick={clearAllPgds}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Clear All
                  </button>
                </div>

                {/* PGD Categories Grid */}
                <div className="space-y-8">
                  {PGD_CATEGORIES.map((category) => {
                    const categoryPgds = ALL_PGDS.filter(
                      (pgd) => pgd.category === category
                    )
                    const selectedCount = categoryPgds.filter((pgd) =>
                      selectedPgds.has(pgd.slug)
                    ).length

                    return (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        {/* Category Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {category}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({selectedCount}/{categoryPgds.length})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => selectAllInCategory(category)}
                              disabled={loading}
                              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                            >
                              All
                            </button>
                            <button
                              onClick={() => clearAllInCategory(category)}
                              disabled={loading}
                              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                            >
                              None
                            </button>
                          </div>
                        </div>

                        {/* PGD Checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryPgds.map((pgd) => {
                            const usage = pharmacy.pgdUsage[pgd.slug]
                            const override = overrides[pgd.slug]
                            return (
                              <div key={pgd.slug} className="flex flex-col gap-1">
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedPgds.has(pgd.slug)}
                                    onChange={() => togglePgd(pgd.slug)}
                                    disabled={loading}
                                    className="w-4 h-4 text-blue-600 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1 disabled:opacity-50"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-medium text-gray-900">
                                        {pgd.title}
                                      </p>
                                      {usage && usage.started > 0 && (
                                        <span
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800"
                                          title={
                                            `${usage.started} started, ${usage.completed} completed` +
                                            (usage.lastUsed ? ` · last used ${new Date(usage.lastUsed).toLocaleDateString('en-GB')}` : '')
                                          }
                                        >
                                          {usage.started} used
                                        </span>
                                      )}
                                      {override && (
                                        <span
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800"
                                          title={
                                            `Custom PDF (v${override.version})` +
                                            (override.signedByNames ? ` — signed by ${override.signedByNames}` : '')
                                          }
                                        >
                                          custom PDF
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {pgd.subtitle}
                                    </p>
                                  </div>
                                </label>

                                {/* Custom PDF override controls — only show when the PGD is assigned */}
                                {selectedPgds.has(pgd.slug) && (
                                  <div className="ml-7 mt-1 mb-2 text-[11px]">
                                    {override ? (
                                      <div className="bg-purple-50 border border-purple-200 rounded-md p-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <a
                                            href={override.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-800 font-semibold hover:underline truncate block"
                                          >
                                            {override.filename ?? 'Custom PDF'}
                                          </a>
                                          {override.signedByNames && (
                                            <p className="text-purple-700">Signed by {override.signedByNames}</p>
                                          )}
                                          <p className="text-purple-500">
                                            v{override.version} · {new Date(override.uploadedAt).toLocaleDateString('en-GB')}
                                          </p>
                                        </div>
                                        <div className="flex flex-col gap-1 flex-shrink-0">
                                          <button
                                            type="button"
                                            disabled={removingSlug === pgd.slug}
                                            onClick={() => handleOverrideRemove(pgd.slug)}
                                            className="text-[10px] font-medium text-red-700 hover:text-red-900 underline disabled:opacity-50"
                                          >
                                            {removingSlug === pgd.slug ? 'Removing…' : 'Remove'}
                                          </button>
                                          <label className={`text-[10px] font-medium text-purple-700 hover:text-purple-900 underline cursor-pointer ${uploadingSlug === pgd.slug ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {uploadingSlug === pgd.slug ? 'Uploading…' : 'Replace'}
                                            <input
                                              type="file"
                                              accept="application/pdf,.pdf"
                                              className="hidden"
                                              onChange={(e) => {
                                                const f = e.target.files?.[0]
                                                if (f) {
                                                  const signed = prompt('Signed by (e.g. "Janey Tipping, Sarah Passmore")', override.signedByNames ?? '') ?? ''
                                                  const notes = prompt('Notes (optional)', override.notes ?? '') ?? ''
                                                  handleOverrideUpload(pgd.slug, f, signed, notes)
                                                }
                                                e.target.value = ''
                                              }}
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    ) : (
                                      <label className={`inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 cursor-pointer ${uploadingSlug === pgd.slug ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        {uploadingSlug === pgd.slug ? 'Uploading…' : 'Upload custom signed PDF'}
                                        <input
                                          type="file"
                                          accept="application/pdf,.pdf"
                                          className="hidden"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0]
                                            if (f) {
                                              const signed = prompt('Signed by (e.g. "Janey Tipping, Sarah Passmore")') ?? ''
                                              const notes = prompt('Notes (optional)') ?? ''
                                              handleOverrideUpload(pgd.slug, f, signed, notes)
                                            }
                                            e.target.value = ''
                                          }}
                                        />
                                      </label>
                                    )}
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

                {/* Save Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSavePgds}
                    disabled={loading || isSaveDisabled}
                    className="px-6 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: isSaveDisabled ? '#999' : '#25b4b4' }}
                  >
                    {loading ? 'Saving...' : `Save PGD Assignments (${selectedPgds.size})`}
                  </button>
                </div>
              </div>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pharmacy Staff
                  </h3>
                  <a
                    href={`/admin/users/new?pharmacy=${pharmacy.id}`}
                    className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-white"
                    style={{ backgroundColor: '#25b4b4' }}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Staff Member
                  </a>
                </div>

                {pharmacy.users.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20H9m6 0h6"
                      />
                    </svg>
                    <p className="text-gray-500 font-medium">No staff members</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Add your first staff member to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pharmacy.users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {user.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
