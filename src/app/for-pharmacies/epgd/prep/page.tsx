import type { Metadata } from "next";
import PrEPClient from "./PrEPClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "PrEP (HIV Pre-exposure Prophylaxis) Consultation ePGD",
  description:
    "Digital consultation tool for PrEP (HIV Pre-exposure Prophylaxis). Guides pharmacists through risk assessment, baseline testing, contraindications, medicine supply, and counselling for emtricitabine/tenofovir under UK Patient Group Direction.",
};

export default function PrEPToolPage() {
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
              PrEP Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            PrEP — HIV Pre-exposure Prophylaxis Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Emtricitabine/Tenofovir disoproxil supply for HIV prevention under Patient Group Direction
          </p>
        </div>

        {/* Wizard */}
        <PrEPClient />

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK sexual health
            guidance and the Get Real Health PGD for PrEP.
          </p>
        </div>
      </div>
    </div>
  );
}
