import type { Metadata } from "next";
import AlopeciaMinoxidilClient from "./AlopeciaMinoxidilClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "Alopecia (Finasteride) Consultation ePGD", description: "Digital consultation tool for androgenetic alopecia: finasteride 1 mg tablets for men aged 18 to 65 under the Get Real Health PGD, version 002, issued 11 September 2026. One document serves both the alopecia-minoxidil and hair-loss catalogue entries." };
export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-[color:var(--tenant-primary)] transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Alopecia (Finasteride) Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Androgenetic Alopecia, Finasteride PGD Consultation</h1>
          <p className="text-sm text-gray-500 mt-1">Finasteride 1 mg tablets for androgenetic alopecia (male pattern hair loss) in men aged 18 to 65 years. PGD version 002, issued 11 September 2026. This document has no minoxidil arm; minoxidil is not supplied under it.</p>
        </div>
        <AlopeciaMinoxidilClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
