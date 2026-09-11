import { HepABClient } from './HepABClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Hepatitis A/B Travel ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for hepatitis A and hepatitis B vaccination in travel and lifestyle-risk situations. Twinrix, Havrix, Avaxim and Engerix B with standard, accelerated and very rapid schedules. PGD v006, 11 September 2026.',
};

export default function HepABPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hepatitis A/B Travel ePGD
            </h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Guides pharmacists through the administration of Twinrix
                (combined Hep A + Hep B), Havrix and Avaxim (Hep A) and
                Engerix B (Hep B) to individuals aged 1 year and over at
                increased risk through travel or lifestyle, in line with the
                Hepatitis A and Hepatitis B Vaccination PGD v006, issued
                11 September 2026. Supports the standard (0, 1 and 6 months),
                accelerated (0, 1 and 2 months plus 12 months) and very rapid
                (0, 7 and 21 days plus 12 months; 18 and over) schedules, and
                the hepatitis A single dose with booster at 6 to 12 months.
                Occupational hepatitis B, renal patients and post-exposure
                situations are out of scope.
              </p>
            </div>
          </div>
        </div>
        <HepABClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD, Hepatitis A/B Travel | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
