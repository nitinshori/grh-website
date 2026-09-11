import React from 'react'
import { PgdPageActions } from '@/components/PgdPageActions'
import { FolicAcidClient } from './FolicAcidClient'

export const metadata = {
  title: 'Folic Acid 5mg ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for oral folic acid 5 mg in folate deficiency.',
}

export default function FolicAcidPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Folic Acid 5 mg ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              Oral folic acid 5 mg once daily for confirmed folate deficiency
              in adults aged 18 and over (PGD 3 of 3, version 008, issued 11
              September 2026).
            </p>
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
              <p className="text-sm text-lime-900 mb-2">
                <strong>Folic acid 5mg tablets, one daily.</strong> Usually 4
                months; up to 4 months supply under this PGD. Where the
                underlying cause persists (for example malabsorption), refer
                to the GP rather than continuing indefinitely. Vitamin B12
                status must be known: B12 deficiency excluded, or treated
                first or at the same time under PGD 1 of 3. Pregnancy,
                planning pregnancy, malignancy and antifolate or antiepileptic
                medicines are exclusions.
              </p>
              <details className="text-xs text-lime-900">
                <summary className="cursor-pointer font-semibold">
                  Interpreting folate results (NICE CKS)
                </summary>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>Serum folate below 7 nmol/L (3 µg/L)</strong>:
                    deficiency.
                  </p>
                  <p>
                    <strong>Serum folate 7 to 10 nmol/L (3 to 4.5 µg/L)</strong>:
                    indeterminate; treat as suggestive of deficiency, not
                    diagnostic.
                  </p>
                  <p>
                    <strong>Red-cell folate below 340 nmol/L (150 µg/L)</strong>:
                    consistent with clinical folate deficiency in the
                    absence of B12 deficiency. Only request if serum folate
                    normal but clinical suspicion is strong.
                  </p>
                  <p>
                    <strong>CRITICAL:</strong> B12 deficiency must be
                    excluded before starting folate replacement:
                    high-dose folate can mask haematological signs of B12
                    deficiency while neurological damage progresses.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
        <FolicAcidClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD: Folic Acid | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
