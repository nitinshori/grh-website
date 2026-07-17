import type { Metadata } from "next";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Gonorrhoea Treatment Consultation ePGD",
  description: "Gonorrhoea Treatment Consultation ePGD - Coming Soon. Ceftriaxone IM administration under PGD following confirmed positive test.",
};

export default function GonorrhoeaToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-4 print:hidden">
          <a
            href="/for-pharmacies/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
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
            <a href="/for-pharmacies/dashboard" className="hover:text-[color:var(--tenant-primary)]">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Gonorrhoea Treatment Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Gonorrhoea Treatment Consultation</h1>
          <p className="text-sm text-gray-600 mt-1">Ceftriaxone IM administration under PGD</p>
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
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Ceftriaxone IM administration under PGD following confirmed positive NAAT test</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Antimicrobial stewardship checks and contraindication screening</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Partner notification guidance</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[color:var(--tenant-primary)] font-bold">•</span>
              <span>Test of cure scheduling</span>
            </li>
          </ul>
          <p className="text-amber-700 text-sm mt-4 pt-4 border-t border-gray-200">
            <strong>Note:</strong> Requires IM injection training and competency verification.
          </p>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 text-sm">
            This ePGD consultation tool is currently in development. We're creating a structured framework to support safe and effective gonorrhoea treatment delivery in pharmacy.
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
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD requires NAAT confirmation of gonorrhoea diagnosis. Partner notification and test of cure are essential components.</p>
        </div>
      </div>
    </div>
  );
}
