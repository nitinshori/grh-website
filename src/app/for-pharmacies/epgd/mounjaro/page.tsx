import MounjaroClient from './MounjaroClient';

export const metadata = {
  title: 'Mounjaro ePGD Consultation',
  description: 'Tirzepatide (Mounjaro) Patient Group Direction consultation tool',
};

export default function MounjaroPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Mounjaro (Tirzepatide) Consultation</h1>
          <p className="text-gray-600">Dual GIP/GLP-1 receptor agonist for weight management</p>
        </div>
        <MounjaroClient />
      </div>
    </div>
  );
}
