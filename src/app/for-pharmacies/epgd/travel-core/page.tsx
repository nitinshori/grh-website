import type { Metadata } from "next";
import TravelCoreClient from "./TravelCoreClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Travel Health Core Package Consultation ePGD",
  description:
    "Digital consultation tool for travel health risk assessment and supply of preventive measures including anti-malarials advice, bite avoidance kit, and travellers' first aid guidance.",
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
              className="hover:text-teal-600 transition-colors"
            >
              For Pharmacies
            </a>
            <span>/</span>
            <span className="text-navy-900 font-medium">
              Travel Health Core Package Consultation ePGD
            </span>
          </div>
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Travel Health Core Package — PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Travel risk assessment &amp; supply of preventive supplies: anti-malarials advice, bite avoidance, first aid guidance
          </p>
        </div>

        <TravelCoreClient />

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on Get Real Health
            Travel Health PGD.
          </p>
        </div>
      </div>
    </div>
  );
}
