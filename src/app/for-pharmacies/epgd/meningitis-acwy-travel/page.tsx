import { MeningitisACWYClient } from './MeningitisACWYClient';

export const metadata = {
  title: 'Meningitis ACWY Travel ePGD | Pharmacy PGD',
  description:
    'UK Pharmacy Group Protocol Direction (PGD) consultation tool for meningitis ACWY vaccination in travel situations',
};

export default function MeningitisACWYPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
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

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meningitis ACWY Travel ePGD</h1>
            <p className="text-gray-600 mb-4">PGD Consultation for UK Pharmacies</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This ePGD guides pharmacists in the supply and administration of meningitis ACWY (MenACWY) conjugate vaccines to eligible patients, particularly those travelling to high-risk regions or attending university.
              </p>
            </div>
          </div>
        </div>
        <MeningitisACWYClient />
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Get Real Health ePGD — Meningitis ACWY Travel | Confidential Patient Information</p>
        </div>
      </div>
    </div>
  );
}
