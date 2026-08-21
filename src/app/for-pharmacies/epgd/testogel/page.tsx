import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
// Access is decided by the TRT PGD, which covers all four preparations.
import PgdGate from '../PgdGate'
import { TestogelClient } from './TestogelClient'

export const metadata = {
  title: 'TRT — Testogel ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction for Testogel (testosterone gel) — daily topical testosterone replacement therapy for hypogonadism.',
}

export default function TestogelPage(): React.ReactNode {
  return (
    <PgdGate slug="trt" title="Testosterone Replacement Therapy">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TRT — Testogel ePGD</h1>
            <p className="text-gray-600 mb-4">
              Daily topical testosterone gel for confirmed male hypogonadism. Both
              Testogel 16.2 mg/g pump and Testogel 40.5 mg sachet are covered.
              Adults 25–65 with biochemically and clinically confirmed deficiency.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>Testogel 16.2 mg/g transdermal gel (pump) or Testogel 40.5 mg transdermal gel in sachet.</strong>{" "}
                Start at 2 pump actuations (40.5 mg / 1 sachet) once daily in the morning, applied to clean, dry, healthy skin of both shoulders or upper arms. Titrate to clinical response and blood levels, not exceeding 4 actuations (81 mg) per day. Indefinite use with annual pharmacy review and bloods. 3-month supply once stable.
              </p>
            </div>
          </div>
        </div>
        <TestogelClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — TRT Testogel | Confidential Patient Information</p>
        </div>
      </div>
    </div>
    </PgdGate>
  )
}
