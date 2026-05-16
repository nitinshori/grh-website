import ThrushClient from '../thrush/ThrushClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Vaginal Thrush Combi (Pessary + Cream) ePGD',
  description: 'Generic clotrimazole 500mg pessary + 1% external cream — combo pack consultation',
};

export default function ThrushCombiPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Vaginal Thrush — Combi Pack</h1>
          <p className="text-gray-600">
            Clotrimazole 500mg pessary + clotrimazole 1% external cream (generic combo)
          </p>
        </div>
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900 font-medium">
            Combi pack pathway
          </p>
          <p className="text-xs text-purple-800 mt-1">
            This consultation supplies the pessary + external cream combo. Use the standard
            thrush PGD if the patient prefers the oral fluconazole route — see Vaginal Thrush — Duo.
          </p>
        </div>
        <ThrushClient lockedMedicine="clotrimazole-pessary" />
      </div>
    </div>
  );
}
