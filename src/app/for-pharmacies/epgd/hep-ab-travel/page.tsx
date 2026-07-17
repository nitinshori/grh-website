import { HepABClient } from './HepABClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Hepatitis A/B Travel ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Patient Group Direction (PGD) consultation tool for hepatitis A and hepatitis B vaccination in travel and lifestyle-risk situations. Twinrix, Havrix and Engerix-B with standard and accelerated schedules.',
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
                Guides pharmacists through the supply and administration of
                Twinrix (combined Hep A + Hep B), Havrix (Hep A monocomponent)
                and Engerix-B (Hep B monocomponent) to eligible patients
                travelling to endemic regions or at lifestyle-risk for
                Hepatitis B. Supports standard (0/1/6 months) and accelerated
                (0/7/21 days + 12-month booster) schedules.
              </p>
            </div>
          </div>
        </div>
        <HepABClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Hepatitis A/B Travel | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
