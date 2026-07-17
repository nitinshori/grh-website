import type { Metadata } from "next";
import ADHDMonitoringClient from "./ADHDMonitoringClient";
import { PgdPageActions } from "@/components/PgdPageActions";
export const metadata: Metadata = { title: "ADHD Monitoring Consultation ePGD", description: "Digital consultation tool for ADHD medication monitoring and titration support." };
export default function ADHDMonitoringPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PgdPageActions />
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-[color:var(--tenant-primary)] transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">ADHD Monitoring Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">ADHD Medication Monitoring — PGD Consultation</h1>
          <p className="text-sm text-gray-500 mt-1">Monitoring and titration support for Methylphenidate or Lisdexamfetamine</p>
        </div>
        <ADHDMonitoringClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.</p>
        </div>
      </div>
    </div>
  );
}
