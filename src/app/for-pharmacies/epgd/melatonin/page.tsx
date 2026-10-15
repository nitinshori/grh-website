import type { Metadata } from 'next';
import { PgdPageActions } from '@/components/PgdPageActions';
import PgdGate from '../PgdGate';
import { MelatoninClient } from './MelatoninClient';

export const metadata: Metadata = {
  title: 'Melatonin for Adults: Insomnia and Jet Lag ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for the supply of licensed immediate-release melatonin (Adaflex 3 mg and 5 mg; Melatonin 3 mg film-coated tablets for jet lag) to adults aged 18 and over: arm A, insomnia (off-label, pharmacists only), and arm B, jet lag (licensed, pharmacists or pharmacy technicians). Melatonin 5 mg for adults PGD v001, issued 15 October 2026.',
};

export default function MelatoninPage() {
  return (
    <PgdGate slug="melatonin" title="Melatonin for Adults: Insomnia and Jet Lag">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <PgdPageActions />

          <div className="mb-8 print:hidden">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
                Arm A: pharmacists only. Arm B: pharmacists or pharmacy technicians
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Melatonin for Adults: Insomnia and Jet Lag ePGD</h1>
              <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies. Melatonin 5 mg for adults PGD v001, issued 15 October 2026.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-amber-900">
                  <strong>Adults aged 18 and over only, face to face on the premises.</strong> Never more than 5 mg in 24 hours from all sources, one dose a night; 3 mg is the maximum at 65 or over and with any oestrogen.
                </p>
                <p className="text-sm text-amber-900">
                  <strong>Arm A, insomnia (OFF-LABEL, pharmacists only):</strong> Adaflex 3 mg nightly, increased once to 5 mg at review where the rules allow; up to three supplies of 30 tablets with an in-person review on day 21 to day 30 (accepted to day 37); a stop if sleep is no better; GP notification; and a documented GP review before any third or later course (Circadin courses count).
                </p>
                <p className="text-sm text-amber-900">
                  <strong>Arm B, jet lag (licensed):</strong> 3 mg (Adaflex or Colonis), or Adaflex 5 mg where the criteria are met, at destination bedtime for up to 5 nights per journey; up to 10 tablets per supply and no more than four supplies in any 12 months.
                </p>
                <p className="text-sm text-amber-900">
                  Not covered: anyone under 18, unlicensed melatonin or supplements, Circadin or any prolonged-release melatonin, a patient already prescribed melatonin, and remote consultations.
                </p>
              </div>
            </div>
          </div>

          <MelatoninClient />

          <div className="mt-8 text-center text-xs text-gray-500 print:hidden">
            <p>Get Real Health ePGD, Melatonin for Adults: Insomnia and Jet Lag | Confidential Patient Information</p>
            <p className="mt-2 text-[11px] text-gray-400 max-w-2xl mx-auto">
              This ePGD is a clinical decision support aid and does not replace professional clinical judgement. The practitioner retains full responsibility for each consultation. Based on the Get Real Health PGD Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, issued 15 October 2026.
            </p>
          </div>
        </div>
      </div>
    </PgdGate>
  );
}
