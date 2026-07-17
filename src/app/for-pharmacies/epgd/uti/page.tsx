import type { Metadata } from "next";
import { UTIToolClient } from "./UTIToolClient";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata: Metadata = {
  title: "UTI Consultation ePGD | PGD Consultation",
  description:
    "Digital consultation tool for pharmacist-led UTI PGD (Uncomplicated UTI - Nitrofurantoin/Trimethoprim). Step-by-step guidance for patient assessment, symptom evaluation, and treatment recommendation.",
};

export default function UTIToolPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PgdPageActions />

        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <a href="/for-pharmacies" className="text-[color:var(--tenant-primary)] hover:underline">
            For Pharmacies
          </a>
          {" > "}
          <a href="/for-pharmacies/epgd" className="text-[color:var(--tenant-primary)] hover:underline">
            ePGD Consultations
          </a>
          {" > "}
          <span className="text-gray-900">UTI Consultation</span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-4xl font-bold text-navy-900 mb-2">
            UTI Consultation ePGD
          </h1>
          <p className="text-lg text-gray-600">
            Patient Group Direction: Nitrofurantoin & Trimethoprim for Uncomplicated Urinary Tract Infection
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-6 py-4 mb-8">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Important:</span> This ePGD is designed to support pharmacist-led consultations under the PGD for uncomplicated UTI in women aged 16-64. It provides clinical guidance and alerts but does not replace professional clinical judgment. All consultations must be conducted by an accredited pharmacist with appropriate training and supervision.
          </p>
        </div>

        {/* Main Consultation Tool */}
        <UTIToolClient />
      </div>
    </div>
  );
}
