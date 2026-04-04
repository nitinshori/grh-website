import OrlistatClient from './OrlistatClient';

export const metadata = {
  title: 'Orlistat ePGD Consultation',
  description: 'Orlistat Patient Group Direction consultation tool',
};

export default function OrlistatPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Orlistat Consultation</h1>
          <p className="text-gray-600">Lipase inhibitor for weight management</p>
        </div>
        <OrlistatClient />
      </div>
    </div>
  );
}
