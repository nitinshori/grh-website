import type { Metadata } from "next";
import EarInfectionClient from "./EarInfectionClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "Acute Otitis Externa ePGD Consultation", description: "Digital consultation tool for acute otitis externa: ciprofloxacin 2mg/ml ear drops or dexamethasone, neomycin and acetic acid ear spray under Patient Group Direction (version 006, 11 September 2026)." };
export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-[color:var(--tenant-primary)] transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Acute Otitis Externa ePGD</span>
          </div>
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Acute Otitis Externa: PGD Consultation</h1>
          <p className="text-sm text-gray-500 mt-1">Ciprofloxacin 2mg/ml single-dose ear drops, or dexamethasone with neomycin and acetic acid ear spray. Otitis externa only; otoscopy required. PGD version 006, issued 11 September 2026.</p>
        </div>
        <EarInfectionClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
