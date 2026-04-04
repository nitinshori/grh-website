import type { Metadata } from 'next';
import { AltitudeSicknessClient } from './AltitudeSicknessClient';

export const metadata: Metadata = {
  title: 'Altitude Sickness Consultation ePGD',
  description:
    'Digital consultation tool for acute mountain sickness (AMS) prevention. Guides pharmacists through patient assessment, altitude travel details, medical history review, and acetazolamide medicine selection under UK Patient Group Direction.',
};

export default function AltitudeSicknessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Altitude Sickness ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              PGD Consultation for UK Pharmacies
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists through the Patient Group Direction for supply of
                acetazolamide (Diamox) to patients travelling to high-altitude destinations for
                acute mountain sickness (AMS) prevention. Includes altitude assessment, medical
                history screening, contraindications review, and patient counselling on altitude
                acclimatisation and warning signs.
              </p>
            </div>
          </div>
        </div>

        {/* Main Wizard */}
        <AltitudeSicknessClient />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Altitude Sickness | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
