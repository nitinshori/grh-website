import type { Metadata } from "next";
import HLClient from "./HLClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Hair Loss (Finasteride) Consultation ePGD",
  description:
    "Digital consultation tool for the Hair Loss (Finasteride) PGD. Guides pharmacists through patient screening, clinical assessment, and supply of finasteride 1mg for male-pattern baldness under UK Patient Group Direction.",
};

export default function HLToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
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
              Hair Loss Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Hair Loss — Finasteride PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Finasteride 1mg supply for male-pattern baldness under Patient Group Direction
          </p>
        </div>

        {/* Wizard */}
        <HLClient />

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK medicines
            guidance and the Get Real Health PGD for Hair Loss (Finasteride).
          </p>
        </div>
      </div>
    </div>
  );
}
