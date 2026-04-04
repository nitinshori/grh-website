import type { Metadata } from "next";
import TestosteroneWomenClient from "./TestosteroneWomenClient";

export const metadata: Metadata = {
  title: "Testosterone for Women Consultation ePGD",
  description:
    "Digital consultation tool for testosterone cream/gel supply to women 40+ with menopausal libido dysfunction. Includes assessment, monitoring, and counselling.",
};

export default function TestosteroneWomenPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600 transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Testosterone for Women Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Testosterone for Women — PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Testosterone 1% cream/gel for menopausal women age 40+ with libido dysfunction
          </p>
        </div>
        <TestosteroneWomenClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement. The pharmacist retains full responsibility for each consultation.
          </p>
        </div>
      </div>
    </div>
  );
}
