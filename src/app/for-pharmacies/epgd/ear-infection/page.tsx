import type { Metadata } from "next";
import EarInfectionClient from "./EarInfectionClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "Ear Infection (Otitis) ePGD Consultation", description: "Digital consultation tool for otitis externa using Cetraxal (ciprofloxacin) ear drops under Patient Group Direction." };
export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-[color:var(--tenant-primary)] transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Ear Infection (Otitis) ePGD</span>
          </div>
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Ear Infection (Otitis) — PGD Consultation</h1>
          <p className="text-sm text-gray-500 mt-1">Cetraxal (ciprofloxacin) ear drops</p>
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
