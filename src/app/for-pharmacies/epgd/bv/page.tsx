import BVClient from './BVClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Bacterial Vaginosis ePGD Consultation',
  description: 'Bacterial vaginosis treatment consultation tool',
};

export default function BVPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Bacterial Vaginosis Consultation</h1>
          <p className="text-gray-600">Treatment of uncomplicated bacterial vaginosis in non-pregnant women (oral metronidazole 400 mg, 16 to 65; metronidazole 0.75% vaginal gel, 18 to 65). PGD version 003, issued 11 September 2026.</p>
        </div>
        <BVClient />
      </div>
    </div>
  );
}
