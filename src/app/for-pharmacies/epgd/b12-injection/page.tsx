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
              <p className="text-sm text-lime-900 mb-3">
                <strong>Hydroxocobalamin 1 mg/mL Solution for Injection.</strong>{" "}
                This ePGD covers loading therapy (1 mg IM three times weekly
                for two weeks) and lifelong maintenance therapy via PGD for
                patients with non-diet-related B12 deficiency. For patients
                aged 18 and over with documented B12 deficiency,
                post-bariatric surgery, atrophic gastritis, or established
                vegan / vegetarian dietary deficiency. Not appropriate for
                unconfirmed symptomatic patients without laboratory evidence
                — refer to GP for diagnostic workup. Annual pharmacy review
                with patient is recommended even on lifelong therapy.
              </p>
              <details className="text-xs text-lime-900">
                <summary className="cursor-pointer font-semibold">
                  Interpreting blood test results (CKS guidance)
                </summary>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>Vitamin B12 thresholds</strong> (NICE / CKS):
                    confirmed deficiency at total B12 &lt;180 ng/L (133
                    pmol/L) or active B12 (holoTC) &lt;25 pmol/L; possible
                    deficiency at 180–350 ng/L (133–258 pmol/L) or active
                    25–70 pmol/L; unlikely at &gt;350 ng/L (258 pmol/L) or
                    active &gt;70 pmol/L. Where total/active B12 is
                    indeterminate but symptoms suggest deficiency, consider
                    serum methylmalonic acid (MMA).
                  </p>
                  <p>
                    <strong>FBC:</strong> high MCV (&gt;100 fL) suggests
                    macrocytosis but MCV may be normal in concurrent iron
                    deficiency or rapid-onset anaemia. A normal MCV does
                    NOT exclude B12 deficiency — 25% of neuro cases have
                    normal MCV.
                  </p>
                  <p>
                    <strong>Folate:</strong> serum folate &lt;7 nmol/L (3
                    µg/L) suggests deficiency; 7–10 nmol/L is indeterminate
                    (treat as suggestive). If suspecting folate deficiency
                    but normal serum levels, request red-cell folate AFTER
                    excluding B12 deficiency.
                  </p>
                  <p>
                    <strong>Note:</strong> people of Black ethnicity may
                    have a higher normal range for serum B12. Pregnant
                    women have physiologically lower B12 levels — less
                    reliable in pregnancy. People on oral contraceptives
                    may show decreased B12 due to reduced carrier protein
                    (not necessarily deficient).
                  </p>
                </div>
              </details>
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
