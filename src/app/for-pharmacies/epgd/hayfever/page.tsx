import type { Metadata } from "next";
import HayfeverClient from "./HayfeverClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Hayfever (Prescription Strength) Consultation ePGD",
  description:
    "Digital consultation tool for prescription-strength hayfever treatments. Guides pharmacists through symptom assessment, contraindication checks, and supply of fexofenadine 120 mg tablets and/or Dymista nasal spray under UK Patient Group Direction.",
};

export default function HayfeverToolPage() {
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
              Hayfever Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Hayfever, Prescription Strength PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fexofenadine 120 mg tablets and/or Dymista nasal spray for allergic rhinitis in patients aged 12 years and over.
            PGD version 005, issued 11 September 2026.
          </p>
        </div>

        <HayfeverClient />

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK medicines
            guidance and the Get Real Health PGD for Fexofenadine and/or Dymista (Allergic Rhinitis), version 005, 11 September 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
