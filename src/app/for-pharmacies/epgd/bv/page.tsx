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
          <p className="text-gray-600">Treatment of uncomplicated bacterial vaginosis</p>
        </div>
        <BVClient />
      </div>
    </div>
  );
}
