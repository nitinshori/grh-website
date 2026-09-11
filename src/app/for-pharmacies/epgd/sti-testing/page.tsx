import type { Metadata } from "next";
import STIClient from "./STIClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "STI Testing Consultation ePGD",
  description:
    "Digital consultation tool for STI testing and chlamydia treatment. Guides pharmacists through risk assessment, clinical assessment, test selection, doxycycline or azithromycin supply, and counselling under the Get Real Health Chlamydia PGD (version 002, 11 September 2026).",
};

export default function STIToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        {/* Page header */}
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
              STI Testing Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            STI Testing and Chlamydia Treatment: Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Risk assessment, test selection, chlamydia treatment (doxycycline or azithromycin) and counselling under Patient Group Direction, version 002, issued 11 September 2026
          </p>
        </div>

        {/* Wizard */}
        <STIClient />

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK sexual health
            guidance and the Get Real Health PGD for the treatment of Chlamydia (doxycycline or azithromycin), version 002, issued 11 September 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
