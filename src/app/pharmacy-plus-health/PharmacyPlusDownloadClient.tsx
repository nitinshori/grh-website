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

function FileIcon({ fileType }: { fileType: string }) {
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

export function PharmacyPlusDownloadClient() {
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
            return (
              <div
                key={resource.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <FileIcon fileType={resource.fileType} />
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${cat.colour}`}>
                      {cat.icon} {cat.label}
                    </span>
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
                    <span>{formatFileSize(resource.fileSize)}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{resource.downloads} downloads</span>
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
                    className="shrink-0 px-4 py-2 bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Download
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
