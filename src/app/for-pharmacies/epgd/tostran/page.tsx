import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { TostranClient } from './TostranClient'

export const metadata = {
  title: 'TRT — Tostran ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction for Tostran 20 mg/g transdermal gel — daily testosterone replacement therapy for hypogonadism.',
}

export default function TostranPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TRT — Tostran ePGD</h1>
            <p className="text-gray-600 mb-4">
              Daily topical testosterone gel (Tostran 20 mg/g) for confirmed male hypogonadism. Adults 25–65 with biochemically and clinically confirmed deficiency. Alternative to Testogel — applied to abdomen or inner thighs.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>Tostran 20 mg/g transdermal gel.</strong> 1 actuation = 0.5 g gel = 10 mg testosterone. Starting dose 3 g/day (60 mg, 6 actuations). Maximum 4 g/day (80 mg, 8 actuations). Apply to abdomen OR inner thighs (rotate daily). NOT to be applied to shoulders/upper arms (different product to Testogel). Indefinite use with annual pharmacy review and bloods. 3-month supply once stable.
              </p>
            </div>
          </div>
        </div>
        <TostranClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — TRT Tostran | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
