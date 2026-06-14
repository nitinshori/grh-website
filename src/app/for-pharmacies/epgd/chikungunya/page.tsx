import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { ChikungunyaClient } from './ChikungunyaClient'

export const metadata = {
  title: 'Chikungunya Vaccination ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for chikungunya vaccination (VIMKUNYA or IXCHIQ).',
}

export default function ChikungunyaPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Chikungunya Vaccination ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              Single-dose chikungunya vaccine for travellers to endemic /
              outbreak areas. Two licensed products: VIMKUNYA (Bavarian Nordic,
              VLP non-live) and IXCHIQ (Valneva, live-attenuated).
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>VIMKUNYA</strong> is the preferred default — it&apos;s
                a VLP (virus-like particle) vaccine, not live, suitable from
                age 12 and recommended for travellers aged 65+. <strong>IXCHIQ</strong>
                {" "}is live-attenuated and acceptable in fit adults aged 18–64
                without contraindications. MHRA has flagged caution with IXCHIQ
                in older adults (Drug Safety Update, 2024) — use VIMKUNYA in
                those groups.
              </p>
            </div>
          </div>
        </div>
        <ChikungunyaClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Chikungunya Vaccination | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
