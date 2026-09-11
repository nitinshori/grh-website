import type { Metadata } from "next";
import COPDClient from "./COPDClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "COPD Management Consultation ePGD",
  description:
    "Digital consultation tool for the COPD Management PGD (version 004, 11 September 2026). Guides pharmacists through COPD assessment, exacerbation review, red flag identification, and supply of salbutamol 100mcg MDI or amoxicillin 500mg capsules under UK Patient Group Direction.",
};

export default function COPDToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
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
              COPD Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            COPD Management PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Salbutamol 100mcg MDI for acute symptom relief, and amoxicillin 500mg capsules for infective exacerbation with purulent sputum, in adults with confirmed COPD. PGD version 004, issued 11 September 2026.
          </p>
        </div>

        <COPDClient />

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK medicines
            guidance and the Get Real Health PGD for COPD Management, version 004.
          </p>
        </div>
      </div>
    </div>
  );
}
