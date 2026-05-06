'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PatientRecord {
  id: string
  pgdSlug: string
  patientFirstName: string
  patientLastName: string
  patientDob: string
  patientNhsNumber: string | null
  outcome: string
  medicineSupplied: string | null
  pharmacistName: string
  consultationDate: string
  createdAt: string
}

interface PatientRecordsClientProps {
  pgdTitles: Record<string, string>
}

export default function PatientRecordsClient({ pgdTitles }: PatientRecordsClientProps) {
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/consultation-records?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by patient name or NHS number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-white transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {total} record{total !== 1 ? 's' : ''} found
          {search && <span> for &ldquo;{search}&rdquo;</span>}
        </p>
      </div>

      {/* Records table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              {search
                ? 'No records match your search.'
                : 'No consultation records yet. Records are automatically saved when you complete an ePGD consultation.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">PGD</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacist</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r) => (
                    <tr key={r.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/for-pharmacies/dashboard/records/${r.id}`}
                          className="text-gray-900 font-medium group-hover:text-teal-600 transition-colors"
                        >
                          {r.patientFirstName} {r.patientLastName}
                        </Link>
                        <p className="text-xs text-gray-400">
                          DOB: {r.patientDob}
                          {r.patientNhsNumber && ` | NHS: ${r.patientNhsNumber}`}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {pgdTitles[r.pgdSlug] || r.pgdSlug}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {r.medicineSupplied || '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {r.pharmacistName}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(r.consultationDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.outcome === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.outcome === 'referred'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {r.outcome === 'completed' ? 'Supplied' : r.outcome === 'referred' ? 'Referred' : 'Not supplied'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  &larr; Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
