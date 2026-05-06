import OrlistatClient from './OrlistatClient';

export const metadata = {
  title: 'Orlistat ePGD Consultation',
  description: 'Orlistat Patient Group Direction consultation tool',
};

export default function OrlistatPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Dashboard */}
        <div className="mb-4 print:hidden">
          <a
            href="/for-pharmacies/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Orlistat Consultation</h1>
          <p className="text-gray-600">Lipase inhibitor for weight management</p>
        </div>
        <OrlistatClient />
      </div>
    </div>
  );
}
