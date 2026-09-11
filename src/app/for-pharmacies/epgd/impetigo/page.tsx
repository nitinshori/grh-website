import { ImpetigoConsultationClient } from './ImpetigoConsultationClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Impetigo ePGD | GRH Pharmacy',
  description: 'Impetigo PGD v009: fusidic acid 2% cream, flucloxacillin oral suspension (children 3 months to 17), or a macrolide where penicillin-allergic',
};

export default function ImpetigoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PgdPageActions />
      </div>
      <ImpetigoConsultationClient />
    </div>
  );
}
