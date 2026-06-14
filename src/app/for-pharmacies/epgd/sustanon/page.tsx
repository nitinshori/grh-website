import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { SustanonClient } from './SustanonClient'

export const metadata = {
  title: 'TRT — Sustanon ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction for Sustanon 250 (testosterone esters IM injection) — every 3 weeks testosterone replacement therapy.',
}

export default function SustanonPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TRT — Sustanon ePGD</h1>
            <p className="text-gray-600 mb-4">
              Sustanon 250 mg/mL IM injection — combined testosterone esters
              (decanoate, isocaproate, phenylpropionate, propionate). 1 mL deep
              IM every 3 weeks. Adults 25–65 with biochemically and clinically
              confirmed hypogonadism.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                <strong>EXCLUSION — peanut / soya allergy.</strong> Sustanon
                contains arachis (peanut) oil and is contraindicated in
                patients allergic to peanuts or soya. Always check before
                administration.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-3">
              <p className="text-sm text-purple-900">
                <strong>Sustanon 250 mg/mL solution for injection.</strong>{" "}
                One injection of 1 mL deep IM every 3 weeks. Adjust to clinical
                response and serum trough levels. Inject very slowly to avoid
                pulmonary oily microembolism — observe patient during and
                immediately after each injection. 3-month supply = 4 ampoules.
                Indefinite use with annual pharmacy review and bloods.
              </p>
            </div>
          </div>
        </div>
        <SustanonClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — TRT Sustanon | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
