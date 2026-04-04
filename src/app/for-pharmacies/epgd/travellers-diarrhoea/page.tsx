import type { Metadata } from 'next';
import { TravellersDiarrhoeaClient } from './TravellersDiarrhoeaClient';

export const metadata: Metadata = {
  title: 'Travellers\' Diarrhoea Consultation ePGD',
  description:
    'Digital consultation tool for travellers\' diarrhoea standby treatment supply. Guides pharmacists through patient assessment, travel and dietary details, medical history review, and standby supply of loperamide and azithromycin under UK Patient Group Direction.',
};

export default function TravellersDiarrhoeaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Travellers' Diarrhoea ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              PGD Consultation for UK Pharmacies
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists through the Patient Group Direction for supply of
                standby treatment for travellers' diarrhoea: loperamide (antimotility) and
                azithromycin (antibiotic) for self-treatment if diarrhoea develops during travel.
                Includes travel assessment, medical history screening, drug interactions, and
                comprehensive patient counselling on oral rehydration and red flags.
              </p>
            </div>
          </div>
        </div>

        {/* Main Wizard */}
        <TravellersDiarrhoeaClient />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Travellers' Diarrhoea | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
