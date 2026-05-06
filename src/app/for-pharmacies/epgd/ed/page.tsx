import type { Metadata } from "next";
import { EDToolClient } from "./EDToolClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "ED Consultation ePGD",
  description:
    "Digital consultation tool for the Erectile Dysfunction PGD. Guides pharmacists through patient screening, assessment, medicine selection, and counselling for Sildenafil and Tadalafil supply.",
};

export default function EDToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        {/* Page header */}
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
              ED Consultation ePGD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Erectile Dysfunction — PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sildenafil &amp; Tadalafil supply under Patient Group Direction
          </p>
        </div>

        {/* Wizard */}
        <EDToolClient />

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does
            not replace professional clinical judgement. The pharmacist retains
            full responsibility for each consultation. Based on NICE CKS
            guidelines for Erectile Dysfunction and the Get Real Health PGD for
            Sildenafil/Tadalafil.
          </p>
        </div>
      </div>
    </div>
  );
}
