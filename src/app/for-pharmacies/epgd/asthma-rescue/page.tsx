import type { Metadata } from "next";
import AsthmaClient from "./AsthmaClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Asthma Rescue Consultation ePGD",
  description:
    "Digital consultation tool for the Asthma Rescue PGD (version 007, 11 September 2026). Guides pharmacists through asthma assessment, observations, acute severe asthma exclusion, and supply of salbutamol 100mcg MDI and prednisolone 5mg tablets for an acute exacerbation of diagnosed asthma under UK Patient Group Direction.",
};

export default function AsthmaToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a
              href="/for-pharmacies"
              className="hover:text-[color:var(--tenant-primary)] transition-colors"
            >
              For Pharmacies
            </a>
            <span>/</span>
            <span className="text-navy-900 font-medium">
              Asthma Rescue Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Asthma Rescue PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Salbutamol 100mcg MDI and prednisolone 5mg tablets for an acute exacerbation of diagnosed asthma in adults. PGD version 007, issued 11 September 2026.
          </p>
        </div>

        {/* Wizard */}
        <AsthmaClient />

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK medicines
            guidance and the Get Real Health PGD for Asthma Rescue, version 007.
          </p>
        </div>
      </div>
    </div>
  );
}
