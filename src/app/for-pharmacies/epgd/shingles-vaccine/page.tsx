import type { Metadata } from "next";
import ShinglesClient from "./ShinglesClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "Shingles Vaccination (Shingrix) Consultation ePGD",
  description:
    "Digital consultation tool for Shingrix (recombinant zoster vaccine) under Patient Group Direction version 007. Screens for eligibility, assesses contraindications, and provides counselling for adults aged 50 and over (Arm 1) and severely immunosuppressed adults aged 18 to 49 (Arm 2).",
};

export default function ShinglesToolPage() {
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
              Shingles Vaccination Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Shingles: Shingrix PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Two doses of 0.5 mL: 2 to 6 months apart for adults aged 50 and over (Arm 1), 8 weeks to 6 months apart for severely immunosuppressed adults aged 18 to 49 (Arm 2), under the Patient Group Direction (version 007, issued 11 September 2026)
          </p>
        </div>

        <ShinglesClient />

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on UK medicines
            guidance and the Get Real Health PGD for Shingles Vaccination (Shingrix), version 007, issued 11 September 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
