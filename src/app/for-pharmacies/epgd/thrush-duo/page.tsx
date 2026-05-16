import ThrushClient from '../thrush/ThrushClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Vaginal Thrush Duo (Oral + Cream) ePGD',
  description: 'Generic fluconazole 150mg oral + clotrimazole 1% cream — duo pack consultation',
};

export default function ThrushDuoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Vaginal Thrush — Duo Pack</h1>
          <p className="text-gray-600">
            Fluconazole 150mg single oral dose + clotrimazole 1% external cream (generic duo)
          </p>
        </div>
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900 font-medium">
            Duo pack pathway
          </p>
          <p className="text-xs text-purple-800 mt-1">
            This consultation supplies oral fluconazole + external cream. Oral fluconazole is
            CONTRAINDICATED in pregnancy and has key drug interactions (warfarin, simvastatin/atorvastatin,
            midazolam, ergots). The contraindications screen will flag these — use the Combi pack
            (pessary + cream) instead if any of these apply.
          </p>
        </div>
        <ThrushClient lockedMedicine="fluconazole-oral" />
      </div>
    </div>
  );
}
