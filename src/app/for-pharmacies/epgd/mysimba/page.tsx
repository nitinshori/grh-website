import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mysimba (Naltrexone-Bupropion) Consultation ePGD",
  description:
    "Digital consultation tool for Mysimba weight management under Patient Group Direction. 4-week titration protocol with careful BP and seizure risk monitoring.",
};

export default function MySIMBAToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Mysimba — Naltrexone-Bupropion PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Weight management with 4-week titration protocol
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            ePGD consultation wizard coming soon. Core clinical logic and validation in place.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement. Based on UK medicines guidance and the Get Real Health PGD for Mysimba (Naltrexone-Bupropion).
          </p>
        </div>
      </div>
    </div>
  );
}
