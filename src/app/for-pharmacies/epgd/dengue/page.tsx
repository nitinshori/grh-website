import React from 'react';
import DengueClient from './DengueClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Dengue Fever Vaccination ePGD | Pharmacy PGD',
  description:
    'UK pharmacy Patient Group Direction (PGD) consultation tool for dengue fever vaccination with Qdenga (TAK-003)',
};

export default function DenguePage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dengue Fever Vaccination ePGD
            </h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists through administration of Qdenga (TAK-003) dengue vaccination under the Patient Group Direction (version 006, issued 11 September 2026) for adults aged 18 years and over travelling to or residing in dengue-endemic areas. Two doses, 3 months apart, subcutaneously. Live vaccine: any immune deficiency, pregnancy and breastfeeding exclude.
              </p>
            </div>
          </div>
        </div>
        <DengueClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD: Dengue Fever Vaccination | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
