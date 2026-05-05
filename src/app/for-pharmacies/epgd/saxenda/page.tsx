import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saxenda (Liraglutide) Consultation ePGD",
  description: "Saxenda (Liraglutide) Consultation ePGD - Coming Soon. GLP-1 receptor agonist for weight management.",
  robots: { index: false, follow: false },
};

export default function SaxendaToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies/dashboard" className="hover:text-teal-600">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Saxenda Consultation ePGD</span>
          </div>
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Saxenda (Liraglutide) Consultation
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            GLP-1 receptor agonist for weight management
          </p>
        </div>

        {/* Coming Soon Badge */}
        <div className="mb-6">
          <span className="inline-block bg-amber-100 border border-amber-300 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full">
            Coming Soon
          </span>
        </div>

        {/* Clinical Description */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-3">What This Tool Will Include</h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>GLP-1 receptor agonist for weight management consultation</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>BMI eligibility screening and assessment</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Injection technique counselling and training</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Dose titration guidance (0.6mg to 3.0mg over 5 weeks)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Side effect monitoring and management</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>12-week efficacy review and escalation pathways</span>
            </li>
          </ul>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm">
            This ePGD consultation tool is currently in development. We're creating a comprehensive GLP-1 weight management system to support Saxenda consultation, titration, and monitoring.
          </p>
        </div>

        {/* Interim Guidance */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">In the meantime</h3>
          <p className="text-amber-900 text-sm">
            Please refer to the printed PGD documentation for clinical guidance.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as clinical decision support for weight management. Requires confirmed BMI &gt;30 or &gt;27 with comorbidity.
          </p>
        </div>
      </div>
    </div>
  );
}
