import { YellowFeverClient } from './YellowFeverClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Yellow Fever ePGD | Pharmacy PGD',
  description:
    'Consultation tool for yellow fever vaccination (Stamaril) at designated Yellow Fever Vaccination Centres',
};

export default function YellowFeverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yellow Fever ePGD</h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This tool supports vaccination with Stamaril, a live attenuated
                yellow fever vaccine, at designated Yellow Fever Vaccination
                Centres. It applies the NaTHNaC contraindications and
                precautions and Green Book chapter 35, and covers issue of the
                International Certificate of Vaccination or Prophylaxis.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
              <p className="text-sm text-amber-900">
                Yellow fever vaccine may only be given at a centre designated by
                NaTHNaC. The consultation begins by asking you to confirm your
                designation. It cannot be completed without it.
              </p>
            </div>
          </div>
        </div>
        <YellowFeverClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD, Yellow Fever. Confidential patient information</p>
        </div>
      </div>
    </div>
  );
}
