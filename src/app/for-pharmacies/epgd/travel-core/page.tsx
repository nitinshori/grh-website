import type { Metadata } from "next";
import TravelCoreClient from "./TravelCoreClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Hepatitis A, Typhoid and Cholera Travel Health ePGD",
  description:
    "Digital consultation tool for administration of Hepatitis A (Havrix/Avaxim), Typhoid (Typhim Vi) and Cholera (Dukoral) vaccines to adults aged 18 and over, with pre-travel risk assessment.",
};

export default function TravelCorePage() {
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
              Hepatitis A, Typhoid and Cholera Travel Health ePGD
            </span>
          </div>
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Hepatitis A, Typhoid and Cholera Travel Health, PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pre-travel risk assessment and administration of Hepatitis A (Havrix/Avaxim), Typhoid (Typhim Vi) and Cholera (Dukoral) vaccines to adults aged 18 and over, with malaria, bite avoidance and food and water advice
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Travel Health PGD v005, issued 11 September 2026
          </p>
        </div>

        <TravelCoreClient />

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on the Get Real Health
            Hepatitis A, Typhoid and Cholera Travel Health PGD v005, issued 11 September 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
