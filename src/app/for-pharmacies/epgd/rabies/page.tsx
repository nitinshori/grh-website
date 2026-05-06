import React from 'react';
import RabiesClient from './RabiesClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Rabies Pre-exposure Vaccination ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for rabies pre-exposure vaccination',
};

export default function RabiesPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rabies Pre-exposure Vaccination ePGD
            </h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists through safe and effective administration of inactivated rabies vaccine for pre-exposure prophylaxis. Suitable for all ages with thorough risk assessment for high-risk activities and travel destinations.
              </p>
            </div>
          </div>
        </div>
        <RabiesClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Rabies Pre-exposure Vaccination | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
