import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { B12InjectionClient } from './B12InjectionClient'

export const metadata = {
  title: 'Vitamin B12 Injection ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for hydroxocobalamin (vitamin B12) intramuscular injection.',
}

export default function B12InjectionPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vitamin B12 Injection ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              Hydroxocobalamin 1 mg/mL intramuscular injection — for confirmed
              B12 deficiency or established maintenance therapy.
            </p>
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
              <p className="text-sm text-lime-900">
                This ePGD covers loading therapy (1 mg IM three times weekly
                for two weeks) and maintenance therapy (1 mg IM every 2–3
                months, depending on the presence of neurological involvement).
                Suitable for patients aged 18 and over with documented B12
                deficiency, post-bariatric surgery, atrophic gastritis, or
                established vegan / vegetarian dietary deficiency. Not
                appropriate for unconfirmed symptomatic patients without
                laboratory evidence — refer to GP for diagnostic workup.
              </p>
            </div>
          </div>
        </div>
        <B12InjectionClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Vitamin B12 Injection | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
