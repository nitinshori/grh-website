import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mysimba (Naltrexone/Bupropion) Consultation ePGD",
  description: "Mysimba (Naltrexone/Bupropion) Consultation ePGD - Coming Soon. Weight management with naltrexone/bupropion combination.",
  robots: { index: false, follow: false },
};

export default function MySIMBAToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600 transition-colors">
              For Pharmacies
            </a>
            <span>/</span>
            <span className="text-navy-900 font-medium">
              Mysimba Consultation ePGD
            </span>
          </div>
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Mysimba (Naltrexone/Bupropion) Consultation
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Weight management with naltrexone/bupropion combination
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
              <span>Weight management with naltrexone/bupropion combination therapy</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>BMI eligibility screening</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Contraindication screening (seizure history, eating disorders, opioid use)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>4-week dose titration schedule and management</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Blood pressure and seizure risk monitoring protocols</span>
            </li>
          </ul>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm">
            This ePGD consultation tool is currently in development. We're building a comprehensive weight management framework to support Mysimba consultation and monitoring.
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
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement. Based on UK medicines guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
