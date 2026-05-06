import type { Metadata } from "next";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "TRT - Testosterone Replacement Therapy ePGD",
  description: "TRT - Testosterone Replacement Therapy ePGD - Coming Soon. Topical testosterone (Testogel/Tostran) for men with confirmed hypogonadism.",
};

export default function TRTToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
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
            <span className="text-navy-900 font-medium">TRT Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Testosterone Replacement Therapy (TRT)</h1>
          <p className="text-sm text-gray-600 mt-1">Topical testosterone (Testogel/Tostran) for men with confirmed hypogonadism</p>
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
              <span>Topical testosterone (Testogel/Tostran) supply for men with confirmed hypogonadism</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Symptom assessment and clinical indication review</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Baseline blood work check and documentation review</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Contraindication screening and safety assessment</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Monitoring schedule (PSA, haematocrit, lipids, testosterone levels)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Application counselling and adherence support</span>
            </li>
          </ul>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm">
            This ePGD consultation tool is currently in development. We're building a comprehensive men's health framework to support testosterone replacement therapy consultation and monitoring.
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
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD is provided as clinical decision support for male patients with confirmed low testosterone.</p>
        </div>
      </div>
    </div>
  );
}
