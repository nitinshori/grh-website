import type { Metadata } from "next";
import WoundCareClient from "./WoundCareClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "Minor Wound Care Consultation ePGD", description: "Minor Wound Care PGD v007: co-amoxiclav for infected bites and heavily contaminated wounds (12 and over), flucloxacillin for infected non-bite wounds (2 and over)." };
export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-[color:var(--tenant-primary)] transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Wound Care Management Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Minor Wound Care: PGD Consultation</h1>
        </div>
        <WoundCareClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
