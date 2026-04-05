'use client'

import { ResourcesView } from '@/app/pharmacy-plus-health/PharmacyPlusDownloadClient'

export default function ClientResourcesPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Resources &amp; Downloads
        </h1>
        <p className="mt-1 text-gray-500">
          PGD documents, training videos, SOPs, and compliance resources.
        </p>
      </div>

      {/* Reuse the existing ResourcesView component (no password gate) */}
      <ResourcesView />
    </div>
  )
}
