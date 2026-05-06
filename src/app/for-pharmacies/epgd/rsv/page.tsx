import { RSVClient } from './RSVClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'RSV Vaccination ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for respiratory syncytial virus (RSV) vaccination in adults 60+ and pregnant women',
};

export default function RSVPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RSV Vaccination ePGD</h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists in the supply and administration of RSV vaccines (Abrysvo or mRESVIA) to eligible adults aged 60+ years and pregnant women.
              </p>
            </div>
          </div>
        </div>
        <RSVClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — RSV Vaccination | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
