'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPharmacyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate required field
      if (!formData.name.trim()) {
        setError('Pharmacy name is required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/pharmacies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create pharmacy')
      }

      const newPharmacy = await response.json()
      router.push(`/admin/pharmacies/${newPharmacy.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-900">Create New Pharmacy</h1>
          <p className="text-gray-600 mt-2">Add a new pharmacy to the system</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Pharmacy Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Main Street Pharmacy"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Address Field */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main Street, City, State, ZIP"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., 020 7946 0958"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., admin@pharmacy.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: loading ? '#999' : '#25b4b4' }}
              >
                {loading ? 'Creating...' : 'Create Pharmacy'}
              </button>
              <a
                href="/admin/pharmacies"
                className="flex-1 px-4 py-2 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
