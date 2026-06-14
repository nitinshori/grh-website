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
              Oral folic acid 5 mg once daily for confirmed folate deficiency.
            </p>
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
              <p className="text-sm text-lime-900 mb-2">
                <strong>Folic Acid 5 mg tablets, one daily.</strong> Standard
                treatment course 4 months for most patients (longer in chronic
                haemolysis or malabsorption — refer to GP).
              </p>
              <details className="text-xs text-lime-900">
                <summary className="cursor-pointer font-semibold">
                  Interpreting folate results (NICE CKS)
                </summary>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>Serum folate &lt;7 nmol/L (3 µg/L)</strong> —
                    deficiency.
                  </p>
                  <p>
                    <strong>Serum folate 7–10 nmol/L (3–4.5 µg/L)</strong> —
                    indeterminate; treat as suggestive of deficiency, not
                    diagnostic.
                  </p>
                  <p>
                    <strong>Red-cell folate &lt;340 nmol/L (150 µg/L)</strong>{" "}
                    — consistent with clinical folate deficiency in the
                    absence of B12 deficiency. Only request if serum folate
                    normal but clinical suspicion is strong.
                  </p>
                  <p>
                    <strong>CRITICAL:</strong> B12 deficiency must be
                    excluded before starting folate replacement —
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
          <p>Get Real Health ePGD — Folic Acid | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  )
}
