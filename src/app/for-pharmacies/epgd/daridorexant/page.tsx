import type { Metadata } from 'next';
import { PgdPageActions } from '@/components/PgdPageActions';
import PgdGate from '../PgdGate';
import { DaridorexantClient } from './DaridorexantClient';

export const metadata: Metadata = {
  title: 'Long-Term Insomnia (Daridorexant, QUVIVIQ) ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for the supply of daridorexant 50 mg or 25 mg (QUVIVIQ, a black triangle medicine) to adults aged 18 to 75 with long-term insomnia meeting NICE TA922, as an initiation course of up to three 30-tablet supplies followed by a prescriber. Daridorexant (QUVIVIQ) PGD v001, issued 15 October 2026. Pharmacists only.',
};

export default function DaridorexantPage() {
  return (
    <PgdGate slug="daridorexant" title="Long-Term Insomnia (Daridorexant)">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PgdPageActions />

          <div className="mb-8 print:hidden">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">For registered pharmacists only</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Long-Term Insomnia (Daridorexant) ePGD</h1>
              <p className="text-gray-600 mb-4">Daridorexant (QUVIVIQ) PGD v001, issued 15 October 2026.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-amber-900">
                  <strong>QUVIVIQ is a black triangle medicine ▼.</strong> It is subject to additional monitoring: report every suspected adverse reaction, however minor, via the MHRA Yellow Card scheme.
                </p>
                <p className="text-sm text-amber-900">
                  This ePGD guides a registered pharmacist through an initiation course of daridorexant for adults aged 18 to 75 at the first supply with long-term insomnia, where CBT-I has been tried and has not worked, or is not available, or is unsuitable (NICE TA922): three numbered supplies of 30 tablets, 25 to 35 days apart, with an early safety review at supply visit 2 and the effectiveness assessment at supply visit 3, followed by a handover to a prescriber. 50 mg once nightly; 25 mg only for a patient who regularly takes a moderate CYP3A4 inhibitor. Face to face on the premises only. It is not used by pharmacy technicians.
                </p>
              </div>
            </div>
          </div>

          <DaridorexantClient />

          <div className="mt-8 text-center text-xs text-gray-500 print:hidden">
            <p>Get Real Health ePGD, Long-Term Insomnia (Daridorexant) | Confidential Patient Information</p>
            <p className="mt-2 text-[11px] text-gray-400 max-w-2xl mx-auto">
              This ePGD is a clinical decision support aid and does not replace professional clinical judgement. The pharmacist retains full responsibility for each consultation. Based on the Get Real Health PGD for Long-Term Insomnia (Daridorexant), version 001, issued 15 October 2026.
            </p>
          </div>
        </div>
      </div>
    </PgdGate>
  );
}
