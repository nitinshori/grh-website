import type { Metadata } from "next";
import EyeInfectionsClient from "./EyeInfectionsClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "Eye Infections — Chloramphenicol Consultation ePGD", description: "Digital consultation tool for Eye Infections — Chloramphenicol under Patient Group Direction." };
export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600 transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Eye Infections — Chloramphenicol Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Eye Infections — Chloramphenicol — PGD Consultation</h1>
        </div>
        <EyeInfectionsClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
