import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { NebidoClient } from './NebidoClient'

export const metadata = {
  title: 'TRT — Nebido ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction for Nebido (testosterone undecanoate) IM depot injection — long-acting testosterone replacement every 10–14 weeks.',
}

export default function NebidoPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TRT — Nebido ePGD</h1>
            <p className="text-gray-600 mb-4">
              Nebido (testosterone undecanoate) 1000 mg / 4 mL IM depot
              injection. Long-acting — loading then every 10–14 weeks maintenance.
              Adults 25–65 with confirmed hypogonadism. Same POME risks as Sustanon.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900">
                <strong>Nebido 1000 mg/4 mL solution for injection.</strong>{" "}
                Loading: first dose, then second 6 weeks later. Maintenance:
                every 10–14 weeks based on trough serum testosterone (sample
                taken at end of injection interval — aim for lower third of
                normal range). Inject VERY SLOWLY — risk of pulmonary oily
                microembolism. Anaphylactic reactions reported. Observe
                patient during AND immediately after each injection.
                Indefinite use with annual pharmacy review.
              </p>
            </div>
          </div>
        </div>
        <NebidoClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — TRT Nebido | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
