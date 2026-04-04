import type { Metadata } from "next";
import SleepMelatoninClient from "./SleepMelatoninClient";

export const metadata: Metadata = {
  title: "Sleep Support - Melatonin Consultation ePGD",
  description: "Digital consultation tool for melatonin supply to adults 55+ with prolonged-release formulation for sleep support.",
};

export default function SleepMelatoninPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600 transition-colors">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Sleep Support - Melatonin Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            Sleep Support — Melatonin — PGD Consultation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Prolonged-release melatonin 2mg for adults 55+ with sleep dysfunction
          </p>
        </div>
        <SleepMelatoninClient />
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">
            This ePGD is provided as a clinical decision support aid and does not replace professional clinical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
