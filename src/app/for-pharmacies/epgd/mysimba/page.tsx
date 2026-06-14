import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { MysimbaClient } from './MysimbaClient'

export const metadata = {
  title: 'Mysimba (Naltrexone/Bupropion) ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for Mysimba (naltrexone 8 mg / bupropion 90 mg) for chronic weight management.',
}

export default function MysimbaPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mysimba (Naltrexone / Bupropion) ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              Oral naltrexone 8 mg / bupropion 90 mg combination for chronic
              weight management. Adults 18–75 with BMI ≥30, or ≥27 with a
              weight-related comorbidity.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-900">
                <strong>Mysimba prolonged-release tablets (8 mg/90 mg).</strong>{" "}
                Dose titrated over 4 weeks (week 1: 1 tab AM; week 2: 1 AM + 1
                PM; week 3: 2 AM + 1 PM; week 4+: 2 AM + 2 PM). Treatment must
                be discontinued at 16 weeks if the patient has not lost at
                least 5% of their initial body weight.
              </p>
            </div>
          </div>
        </div>
        <MysimbaClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Mysimba (Naltrexone/Bupropion) | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
