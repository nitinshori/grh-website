import { MeningitisACWYClient } from './MeningitisACWYClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Meningitis ACWY Travel ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for meningitis ACWY vaccination in travel situations',
};

export default function MeningitisACWYPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meningitis ACWY Travel ePGD</h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists in the administration of meningococcal ACWY conjugate vaccine (Nimenrix from 6 weeks, MenQuadfi from 12 months, Menveo from 2 years) for travel-related protection, including the certificate required for entry to Saudi Arabia for Hajj and Umrah. Meningococcal ACWY (Travel and Hajj/Umrah) PGD v006, issued 11 September 2026.
              </p>
            </div>
          </div>
        </div>
        <MeningitisACWYClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD, Meningitis ACWY Travel | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
