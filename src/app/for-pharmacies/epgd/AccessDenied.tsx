import Link from 'next/link'

export default function AccessDenied({ pgdTitle }: { pgdTitle?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 text-3xl mb-6">
          ✕
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          {pgdTitle
            ? `Your pharmacy does not have access to the ${pgdTitle} ePGD.`
            : 'Your pharmacy does not have access to this ePGD.'}
          {' '}Contact your administrator to request access.
        </p>
        <Link
          href="/for-pharmacies/epgd"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-colors"
          style={{ backgroundColor: 'var(--tenant-primary)' }}
        >
          &larr; Back to Your ePGDs
        </Link>
      </div>
    </div>
  )
}
