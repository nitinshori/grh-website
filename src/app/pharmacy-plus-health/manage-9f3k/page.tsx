'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { PharmacyPlusResource, ResourceCategory } from '@/types/pharmacy-plus'

const CATEGORIES: ResourceCategory[] = ['PGD', 'Video', 'Training', 'Compliance', 'SOP']

type UploadMode = 'file' | 'link'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Password Gate ────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }
    onAuth(password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a3d] to-[#1e3a5f] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 mb-3 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] text-xs font-semibold tracking-wide">
            PHARMACY PLUS HEALTH
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your password to manage resources</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-pw" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="admin-pw"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold rounded-lg transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Admin Dashboard ──────────────────────────────────────────────

function AdminDashboard({ adminKey }: { adminKey: string }) {
  const [resources, setResources] = useState<PharmacyPlusResource[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload form state
  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ResourceCategory>('PGD')
  const [description, setDescription] = useState('')

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/pharmacy-plus/resources', {
        headers: { 'x-admin-key': adminKey },
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setResources(data.resources || [])
    } catch {
      // Silently fail, list will be empty
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => { fetchResources() }, [fetchResources])

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      if (!name) setName(dropped.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    if (selected && !name) {
      setName(selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
    }
  }

  const resetForm = () => {
    setFile(null)
    setExternalUrl('')
    setName('')
    setDescription('')
    setCategory('PGD')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate based on mode
    if (uploadMode === 'file' && (!file || !name.trim())) return
    if (uploadMode === 'link' && (!externalUrl.trim() || !name.trim())) return

    setUploading(true)
    setAuthError(false)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('category', category)
      formData.append('description', description.trim())

      if (uploadMode === 'link') {
        formData.append('externalUrl', externalUrl.trim())
      } else {
        formData.append('file', file!)
      }

      const res = await fetch('/api/pharmacy-plus/upload', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: formData,
      })

      if (res.status === 401) {
        setAuthError(true)
        return
      }

      if (!res.ok) throw new Error('Upload failed')

      resetForm()
      await fetchResources()
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, resourceName: string) => {
    if (!confirm(`Delete "${resourceName}"? This cannot be undone.`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/pharmacy-plus/delete/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      })
      if (res.status === 401) {
        setAuthError(true)
        return
      }
      if (!res.ok) throw new Error('Delete failed')
      await fetchResources()
    } catch {
      alert('Delete failed. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const totalDownloads = resources.reduce((sum, r) => sum + r.downloads, 0)

  const canSubmit = uploadMode === 'file'
    ? !!file && !!name.trim() && !uploading
    : !!externalUrl.trim() && !!name.trim() && !uploading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#14b8a6] tracking-wide uppercase">Pharmacy Plus Health</p>
            <h1 className="text-xl font-bold text-gray-900">Resource Admin</h1>
          </div>
          <a
            href="/pharmacy-plus-health"
            className="text-sm text-[#14b8a6] hover:text-[#0d9488] font-medium"
          >
            View Public Page &rarr;
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Incorrect password. Please reload the page and try again.
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{resources.length}</p>
            <p className="text-xs text-gray-500">Resources</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-[#14b8a6]">{totalDownloads}</p>
            <p className="text-xs text-gray-500">Total Downloads</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {new Set(resources.map((r) => r.category)).size}
            </p>
            <p className="text-xs text-gray-500">Categories</p>
          </div>
        </div>

        {/* Upload form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Add New Resource</h2>
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => { setUploadMode('file'); setExternalUrl('') }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  uploadMode === 'file'
                    ? 'bg-[#14b8a6] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => { setUploadMode('link'); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  uploadMode === 'link'
                    ? 'bg-[#14b8a6] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                External Link
              </button>
            </div>
          </div>

          <form onSubmit={handleUpload} className="p-6 space-y-5">
            {uploadMode === 'file' ? (
              /* File drop zone */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[#14b8a6] bg-[#14b8a6]/5'
                    : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.mp4,.mov,.avi,.pptx,.xlsx,.zip"
                />
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-green-700">{file.name}</p>
                    <p className="text-xs text-green-600 mt-1">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-gray-400 mt-2">Click or drop to replace</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Drop a file here or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, Word, PowerPoint, Excel, Video, ZIP &mdash; max ~4 MB
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* External link input */
              <div>
                <label htmlFor="ext-url" className="block text-sm font-medium text-gray-700 mb-1">
                  External URL *
                </label>
                <input
                  id="ext-url"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://youtu.be/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  Use for large files (videos, presentations). Upload to Google Drive, YouTube, or Vimeo and paste the sharing link here. Clicks are still tracked.
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="res-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Name *
                </label>
                <input
                  id="res-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Influenza PGD 2025-26"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="res-cat" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="res-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="res-desc" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="res-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the resource"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full px-4 py-2.5 bg-[#14b8a6] hover:bg-[#0d9488] disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {uploading
                ? (uploadMode === 'file' ? 'Uploading...' : 'Saving...')
                : (uploadMode === 'file' ? 'Upload Resource' : 'Add External Link')}
            </button>
          </form>
        </div>

        {/* Resource list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">All Resources ({resources.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : resources.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No resources yet. Upload one above!</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {resources.map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{r.name}</p>
                      {r.isExternal && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold">
                          LINK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.category}
                      {r.fileSize > 0 && <> &middot; {formatFileSize(r.fileSize)}</>}
                      {' '}&middot; {r.downloads} {r.isExternal ? 'clicks' : 'downloads'} &middot;{' '}
                      {new Date(r.uploadedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id, r.name)}
                    disabled={deletingId === r.id}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all disabled:opacity-50"
                  >
                    {deletingId === r.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page Export ───────────────────────────────────────────────────

export default function PharmacyPlusAdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null)

  if (!adminKey) {
    return <PasswordGate onAuth={setAdminKey} />
  }

  return <AdminDashboard adminKey={adminKey} />
}
