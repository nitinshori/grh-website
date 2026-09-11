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
              Daily subcutaneous liraglutide for weight management under the Patient
              Group Direction (version 004, issued 11 September 2026). Adults aged 18
              years and over (aged 75 years or over excludes) with BMI ≥30, or ≥27 with
              at least one weight-related comorbidity, who are willing and motivated to
              undertake lifestyle modifications.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                <strong>Saxenda (Liraglutide 6mg/ml) solution for injection in pre-filled pen.</strong>{" "}
                Once-daily subcutaneous injection, titrated from 0.6 mg to 3.0 mg over 5 weeks
                (one-week increments). Up to 5 pre-filled pens per supply. Review at 12 weeks
                on the 3.0 mg maintenance dose: discontinue if &lt;5% body weight loss; if
                continued, review at least every 6 months. Before first use refrigerate at
                2 to 8°C; after first use store below 30°C for up to 30 days. Do not freeze;
                protect from light.
              </p>
            </div>
          </div>
        </div>
        <SaxendaClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD: Saxenda (Liraglutide) PGD v004, issued 11 September 2026 | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
