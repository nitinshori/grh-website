import type { Metadata } from "next";
import StatinsClient from "./StatinsClient";

export const metadata: Metadata = {
  title: "Statin Continuation Consultation ePGD",
  description: "Digital consultation tool for continuation supply of atorvastatin. Guides pharmacists through lipid assessment, liver function review, red flag screening, and statin management.",
};

export default function StatinsToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Statin Continuation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Statin Continuation PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Continuation supply of atorvastatin with lipid and liver function review under Patient Group Direction
          </p>
        </div>
        <StatinsClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement. The pharmacist retains full responsibility for each consultation. Based on UK medicines guidance and the Get Real Health PGD for Statin Continuation.
          </p>
        </div>
      </div>
    </div>
  );
}
