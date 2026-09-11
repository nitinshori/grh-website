import type { Metadata } from "next";
import EyeInfectionsClient from "./EyeInfectionsClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "Eye Infections, Chloramphenicol Consultation ePGD", description: "Digital consultation tool for bacterial conjunctivitis: chloramphenicol 0.5% eye drops and 1% eye ointment under the Get Real Health PGD, version 003, issued 11 September 2026." };
export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-6 print:hidden">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-[color:var(--tenant-primary)] transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Eye Infections, Chloramphenicol Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Eye Infections, Chloramphenicol, PGD Consultation</h1>
          <p className="text-sm text-gray-500 mt-1">Bacterial conjunctivitis in adults and children aged 2 years and over: chloramphenicol 0.5% eye drops and 1% eye ointment. PGD version 003, issued 11 September 2026.</p>
        </div>
        <EyeInfectionsClient />
        <div className="mt-8 text-center print:hidden">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
