import type { Metadata } from 'next';
import { PgdPageActions } from '@/components/PgdPageActions';
import PgdGate from '../PgdGate';
import { OralMinoxidilClient } from './OralMinoxidilClient';

export const metadata: Metadata = {
  title: 'Pattern Hair Loss (Low-Dose Oral Minoxidil) ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for the off-label supply of minoxidil 2.5 mg tablets (Loniten) at 1.25 mg to 5 mg daily for androgenetic alopecia in adults aged 18 to 65, men and women, in line with the Pattern Hair Loss (Low-Dose Oral Minoxidil) PGD version 001, issued 28 September 2026. Pharmacists only.',
};

export default function OralMinoxidilPage() {
  return (
    <PgdGate slug="oral-minoxidil" title="Pattern Hair Loss (Low-Dose Oral Minoxidil)">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PgdPageActions />

          <div className="mb-8 print:hidden">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
                For registered pharmacists only
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pattern Hair Loss (Low-Dose Oral Minoxidil) ePGD</h1>
              <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies. PGD version 001, issued 28 September 2026.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Off-label supply.</strong> Minoxidil tablets (Loniten 2.5 mg, PL 00057/1006) are licensed for severe hypertension only. This ePGD guides a registered pharmacist through the off-label supply of low-dose oral minoxidil (men 2.5 mg, women 1.25 mg once daily, one step up in the whole course at or after supply visit 4) to adults aged 18 to 65 at every supply with androgenetic alopecia, face to face on the premises: the diagnosis against Appendix 2, the cardiovascular screen, seated and standing blood pressure, pulse and weight at every supply, the women&apos;s ferritin, thyroid and pregnancy checks, the off-label consent script and signed consent statement, and the numbered 8 week supplies with full reviews at supply visits 4 and 6 and a maximum of six supplies (not reset by a gap or restart) before a prescriber review. It is not used by pharmacy technicians, and it does not cover remote consultations, the 5 mg or 10 mg tablets, or any use for blood pressure.
                </p>
              </div>
            </div>
          </div>

          <OralMinoxidilClient />

          <div className="mt-8 text-center text-xs text-gray-500 print:hidden">
            <p>Get Real Health ePGD, Pattern Hair Loss (Low-Dose Oral Minoxidil) | Confidential Patient Information</p>
            <p className="mt-2 text-[11px] text-gray-400 max-w-2xl mx-auto">
              This ePGD is a clinical decision support aid and does not replace professional clinical judgement. The pharmacist retains full responsibility for each consultation. Based on the Get Real Health PGD for Pattern Hair Loss (Low-Dose Oral Minoxidil), version 001, issued 28 September 2026.
            </p>
          </div>
        </div>
      </div>
    </PgdGate>
  );
}
