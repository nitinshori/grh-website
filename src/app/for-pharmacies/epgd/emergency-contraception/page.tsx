import type { Metadata } from "next";
import { ECToolClient } from "./ECToolClient";

export const metadata: Metadata = {
  title: "Emergency Contraception Consultation ePGD",
  description:
    "Digital consultation tool for the Emergency Hormonal Contraception PGD. Guides pharmacists through patient screening, clinical assessment, medicine selection, and counselling for levonorgestrel and ulipristal supply under UK Patient Group Direction.",
};

export default function ECToolPage() {
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
              Emergency Contraception Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Emergency Contraception — PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Levonorgestrel &amp; Ulipristal supply under Patient Group Direction
          </p>
        </div>

        {/* Wizard */}
        <ECToolClient />

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on NICE guidance,
            UK Medicines and Healthcare products Regulatory Agency (MHRA)
            recommendations, and the Get Real Health PGD for Emergency Hormonal
            Contraception.
          </p>
        </div>
      </div>
    </div>
  );
}
