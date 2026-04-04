import HRTClient from './HRTClient';

export const metadata = {
  title: 'HRT Initiation ePGD Consultation',
  description: 'Hormone Replacement Therapy initiation consultation tool',
};

export default function HRTPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">HRT Initiation Consultation</h1>
          <p className="text-gray-600">Hormone Replacement Therapy for menopausal symptoms</p>
        </div>
        <HRTClient />
      </div>
    </div>
  );
}
