import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { SaxendaClient } from './SaxendaClient'

export const metadata = {
  title: 'Saxenda (Liraglutide) ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for Saxenda (liraglutide) for chronic weight management.',
}

export default function SaxendaPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Saxenda (Liraglutide) ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              Daily subcutaneous liraglutide for chronic weight management. Adults
              aged 18–75 with BMI ≥30, or ≥27 with a weight-related comorbidity.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                <strong>Saxenda 6 mg/mL solution for injection in pre-filled pen.</strong>{" "}
                Daily SC injection, titrated from 0.6 mg to 3.0 mg over 5 weeks
                (one-week increments). Treatment must be discontinued if the
                patient has not lost ≥5% of initial body weight after 12 weeks
                on the 3.0 mg maintenance dose. After first use, the pen may
                be stored up to 28 days at &lt;30°C; otherwise refrigerate 2–8°C.
                Keep cap on when not in use to protect from light.
              </p>
            </div>
          </div>
        </div>
        <SaxendaClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Saxenda (Liraglutide) | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
