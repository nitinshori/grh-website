import PeriodDelayClient from './PeriodDelayClient';

export const metadata = {
  title: 'Period Delay ePGD Consultation',
  description: 'Digital consultation tool for pharmacist-led period delay PGD (Norethisterone 5mg). Step-by-step guidance for patient assessment and treatment.',
};

export default function PeriodDelayPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Period Delay Consultation</h1>
          <p className="text-gray-600">Norethisterone 5mg for short-term delay of menstruation</p>
        </div>
        <PeriodDelayClient />
      </div>
    </div>
  );
}
