import { TBEClient } from './TBEClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Tick-borne Encephalitis ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for tick-borne encephalitis (TicoVac) vaccination in travel situations',
};

export default function TBEPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tick-borne Encephalitis ePGD</h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-amber-900">
                <strong>Draft — pending clinical sign-off.</strong> This tool is provided for review by the named clinician before use.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists through the supply and administration of tick-borne encephalitis vaccine (TicoVac / TicoVac Junior) to eligible patients travelling to TBE-endemic areas or with outdoor/occupational exposure.
              </p>
            </div>
          </div>
        </div>
        <TBEClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — TBE | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
