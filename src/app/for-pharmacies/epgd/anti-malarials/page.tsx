import type { Metadata } from 'next';
import { AntiMalarialsClient } from './AntiMalarialsClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: 'Anti-malarials Consultation ePGD',
  description:
    'Digital consultation tool for malaria prophylaxis. Guides pharmacists through patient screening, travel assessment, medical history review, and antimalarial medicine selection under UK Patient Group Direction.',
};

export default function AntiMalarialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Anti-malarials ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              PGD Consultation for UK Pharmacies
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists through the Patient Group Direction for supply of
                antimalarial prophylaxis (Malarone, Doxycycline, Mefloquine) to patients
                travelling to malaria-endemic areas. Includes travel assessment, medical history
                review, contraindications screening, and counselling.
              </p>
            </div>
          </div>
        </div>

        {/* Main Wizard */}
        <AntiMalarialsClient />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Anti-malarials | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
