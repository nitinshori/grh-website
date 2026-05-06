import type { Metadata } from "next";
import CovidBoosterClient from "./CovidBoosterClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "COVID-19 Booster Vaccination Consultation ePGD",
  description:
    "Digital consultation tool for COVID-19 variant-updated booster vaccination under Patient Group Direction. Screens for eligibility, assesses contraindications, and provides counselling for eligible adults.",
};

export default function CovidBoosterToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
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
              COVID-19 Booster Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            COVID-19 Booster — Variant-Updated Vaccination PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Single-dose booster vaccination for eligible adults under Patient Group Direction
          </p>
        </div>

        <CovidBoosterClient />

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK medicines
            guidance and the Get Real Health PGD for COVID-19 Booster Vaccination.
          </p>
        </div>
      </div>
    </div>
  );
}
