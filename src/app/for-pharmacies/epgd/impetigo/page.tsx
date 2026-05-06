import { ImpetigoConsultationClient } from './ImpetigoConsultationClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Impetigo ePGD - UK Pharmacy PGD',
  description: 'Comprehensive Impetigo consultation and treatment tool for UK pharmacies',
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
