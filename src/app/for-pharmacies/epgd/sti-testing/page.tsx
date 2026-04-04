import type { Metadata } from "next";
import STIClient from "./STIClient";

export const metadata: Metadata = {
  title: "STI Testing Consultation ePGD",
  description:
    "Digital consultation tool for STI Testing. Guides pharmacists through risk assessment, clinical assessment, test selection, and counselling for sexually transmitted infection testing under UK Patient Group Direction.",
};

export default function STIToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a
              href="/for-pharmacies"
              className="hover:text-teal-600 transition-colors"
            >
              For Pharmacies
            </a>
            <span>/</span>
            <span className="text-navy-900 font-medium">
              STI Testing Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            STI Testing — Consultation and Test Ordering
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Risk assessment, test selection, and counselling for STI testing under Patient Group Direction
          </p>
        </div>

        {/* Wizard */}
        <STIClient />

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK sexual health
            guidance and the Get Real Health PGD for STI Testing.
          </p>
        </div>
      </div>
    </div>
  );
}
