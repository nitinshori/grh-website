import type { Metadata } from "next";
import RosaceaClient from "./RosaceaClient";
export const metadata: Metadata = { title: "Rosacea Treatment Consultation ePGD", description: "Digital consultation tool for rosacea subtype assessment and treatment with ivermectin or metronidazole." };
export default function RosaceaPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600 transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Rosacea Treatment Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Rosacea Treatment — PGD Consultation</h1>
          <p className="text-sm text-gray-500 mt-1">Subtype assessment and treatment with ivermectin cream or metronidazole gel</p>
        </div>
        <RosaceaClient />
        <div className="mt-8 text-center"><p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.</p></div>
      </div>
    </div>
  );
}
