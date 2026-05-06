import ThrushClient from './ThrushClient';
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Vaginal Thrush ePGD Consultation',
  description: 'Vulvovaginal candidiasis treatment consultation tool',
};

export default function ThrushPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Vaginal Thrush Consultation</h1>
          <p className="text-gray-600">Uncomplicated vulvovaginal candidiasis treatment</p>
        </div>
        <ThrushClient />
      </div>
    </div>
  );
}
