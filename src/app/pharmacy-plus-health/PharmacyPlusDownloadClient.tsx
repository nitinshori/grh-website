'use client'

import { useEffect, useState, useCallback } from 'react'
import type { PharmacyPlusResource, ResourceCategory } from '@/types/pharmacy-plus'

const CATEGORY_CONFIG: Record<ResourceCategory, { colour: string; icon: string; label: string }> = {
  PGD:        { colour: 'bg-blue-100 text-blue-700',   icon: '\u{1F4CB}', label: 'PGD' },
  Video:      { colour: 'bg-purple-100 text-purple-700', icon: '\u{1F3A5}', label: 'Video' },
  Training:   { colour: 'bg-green-100 text-green-700',  icon: '\u{1F4DA}', label: 'Training' },
  Compliance: { colour: 'bg-amber-100 text-amber-700',  icon: '\u2714\uFE0F', label: 'Compliance' },
  SOP:        { colour: 'bg-red-100 text-red-700',      icon: '\u2699\uFE0F', label: 'SOP' },
}

const ALL_CATEGORIES: ResourceCategory[] = ['PGD', 'Video', 'Training', 'Compliance', 'SOP']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ fileType, isExternal }: { fileType: string; isExternal?: boolean }) {
  if (isExternal) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 bg-purple-50 text-purple-600">
        LINK
      </div>
    )
  }

  const isPdf = fileType.includes('pdf')
  const isVideo = fileType.startsWith('video/')
  const isDoc = fileType.includes('word') || fileType.includes('document')

  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
      isPdf ? 'bg-red-50 text-red-600' :
      isVideo ? 'bg-purple-50 text-purple-600' :
      isDoc ? 'bg-blue-50 text-blue-600' :
      'bg-gray-50 text-gray-600'
    }`}>
      {isPdf ? 'PDF' : isVideo ? 'VID' : isDoc ? 'DOC' : 'FILE'}
    </div>
  )
}

// ── Password Gate ────────────────────────────────────────────────

function AccessGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Please enter the access password')
      return
    }

    setChecking(true)
    setError('')

    try {
      const res = await fetch('/api/pharmacy-plus/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        onAuth()
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Unable to verify. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 mb-3 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] text-xs font-semibold tracking-wide">
            PHARMACY PLUS HEALTH
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Hub</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your access password to view resources
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="access-pw" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="access-pw"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none"
              placeholder="Enter access password"
              autoFocus
              disabled={checking}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={checking}
            className="w-full px-4 py-2.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {checking ? 'Verifying...' : 'Access Resources'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          Contact your Pharmacy Plus Health coordinator if you need access.
        </p>
      </div>
    </div>
  )
}

// ── Resources View ───────────────────────────────────────────────

function ResourcesView() {
  const [resources, setResources] = useState<PharmacyPlusResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ResourceCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/pharmacy-plus/resources')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setResources(data.resources || [])
    } catch {
      setError('Unable to load resources. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResources() }, [fetchResources])

  const filtered = resources
    .filter((r) => filter === 'all' || r.category === filter)
    .filter((r) =>
      searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const totalDownloads = resources.reduce((sum, r) => sum + r.downloads, 0)

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]" />
          <p className="mt-4 text-gray-500">Loading resources...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 text-center">
          {error}
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Which documents are these? Jane Wilkins asked (10 Aug 2026) how she
          and Sarah would tell the PPH versions apart from the standard ones
          offered to HubRx third-party pharmacies. This states it plainly at
          the top of the hub, and each document carries a PPH badge below. */}
      <div className="mb-10 rounded-xl border-2 border-[#14b8a6] bg-[#14b8a6]/5 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0f766e] mb-1">
          Pharmacy Plus Health versions
        </p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          These are your own PGDs, not the standard Get Real Health versions
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Every document here is the Pharmacy Plus Health version, carrying
          your amendments and signed by your own signatories, for use across
          PPH branches and on your intranet. They are held separately from the
          Get Real Health catalogue and are not visible to, or accessible by,
          your HubRx third-party pharmacies.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-2">
          Your HubRx third parties see the standard Get Real Health versions on
          the HubRx portal instead. If a document does not carry the PPH badge
          below, it is not a PPH version.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{resources.length}</p>
          <p className="text-sm text-gray-500 mt-1">Resources</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-[#14b8a6]">{totalDownloads}</p>
          <p className="text-sm text-gray-500 mt-1">Total Downloads</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center hidden sm:block">
          <p className="text-3xl font-bold text-gray-900">
            {new Set(resources.map((r) => r.category)).size}
          </p>
          <p className="text-sm text-gray-500 mt-1">Categories</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="mb-8 space-y-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#1e3a8a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === cat
                  ? 'bg-[#1e3a8a] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6">
        Showing {filtered.length} of {resources.length} resources
      </p>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-400 text-lg mb-2">No resources found</p>
          <p className="text-gray-400 text-sm">
            {resources.length === 0
              ? 'Resources will appear here once uploaded by an administrator.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((resource) => {
            const cat = CATEGORY_CONFIG[resource.category]
            const isExt = resource.isExternal
            return (
              <div
                key={resource.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <FileIcon fileType={resource.fileType} isExternal={isExt} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.colour}`}>
                        {cat.icon} {cat.label}
                      </span>
                      {/* Badge so a PPH version is identifiable at a glance,
                          per Jane Wilkins, 10 Aug 2026. */}
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14b8a6] text-white">
                        PPH version
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 group-hover:text-[#14b8a6] transition-colors truncate">
                      {resource.name}
                    </h3>
                    {resource.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {resource.fileSize > 0 && (
                      <>
                        <span>{formatFileSize(resource.fileSize)}</span>
                        <span aria-hidden="true">&middot;</span>
                      </>
                    )}
                    <span>{resource.downloads} {isExt ? 'views' : 'downloads'}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>
                      {new Date(resource.uploadedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <a
                    href={`/api/pharmacy-plus/download/${resource.id}`}
                    target={isExt ? '_blank' : undefined}
                    rel={isExt ? 'noopener noreferrer' : undefined}
                    className="shrink-0 px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {isExt ? 'Open' : 'Download'}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Exported ResourcesView for reuse in client portal ────────────

export { ResourcesView }

// ── Main Export ───────────────────────────────────────────────────

export function PharmacyPlusDownloadClient() {
  const [authenticated, setAuthenticated] = useState(false)

  if (!authenticated) {
    return <AccessGate onAuth={() => setAuthenticated(true)} />
  }

  return <ResourcesView />
}
