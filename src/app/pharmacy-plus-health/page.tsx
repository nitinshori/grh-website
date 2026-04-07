import type { Metadata } from 'next'
import Link from 'next/link'
import { PharmacyPlusDownloadClient } from './PharmacyPlusDownloadClient'

export const metadata: Metadata = {
  title: 'Pharmacy Plus Health — Resource Hub | Get Real Health',
  description:
    'PGD documents, training videos, and compliance resources for Pharmacy Plus Health pharmacies.',
  robots: { index: false, follow: false },
}

export default function PharmacyPlusHealthPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f1a3d] via-[#1e3a5f] to-[#134e4a] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/10 border border-white/20">
              <span className="text-sm font-semibold text-teal-200 tracking-wide">
                PHARMACY PLUS HEALTH
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Resource Hub
            </h1>
            <p className="text-lg text-blue-100/90 mb-8 max-w-xl leading-relaxed">
              Access PGD documents, training videos, SOPs, and compliance resources
              for all Pharmacy Plus Health locations.
            </p>
            <div className="flex items-center gap-2 text-sm text-teal-200/80">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Password-protected — authorised pharmacies only
            </div>
          </div>
        </div>
      </section>

      {/* Password gate + Download section (client) */}
      <PharmacyPlusDownloadClient />

      {/* Footer CTA */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Need something else?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact your local Pharmacy Plus Health coordinator for additional resources.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold rounded-lg transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  )
}
