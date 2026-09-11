import type { Metadata } from "next";
import DentalBridgingClient from "./DentalBridgingClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "Acute Dental Infection Bridging Antibiotic ePGD", description: "Digital consultation tool for the supply of a bridging antibiotic in acute dental infection under Patient Group Direction (version 008, 11 September 2026)." };
export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-[color:var(--tenant-primary)] transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Acute Dental Infection Bridging Antibiotic ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Acute Dental Infection, Bridging Antibiotic: PGD Consultation</h1>
          <p className="text-sm text-gray-600 mt-1">Amoxicillin or metronidazole, adults 18 and over, spreading or systemic dental infection only. PGD version 008, issued 11 September 2026.</p>
        </div>
        <DentalBridgingClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
