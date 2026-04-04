import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saxenda (Liraglutide) Weight Management Consultation ePGD",
  description: "Digital consultation tool for Saxenda weight management under Patient Group Direction. 5-week dose escalation protocol with 3-month efficacy check.",
};

export default function SaxendaToolPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <a href="/for-pharmacies" className="hover:text-teal-600">For Pharmacies</a>
            <span>/</span>
            <span className="text-navy-900 font-medium">Saxenda Consultation ePGD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Saxenda — Liraglutide Weight Management PGD</h1>
          <p className="text-sm text-gray-500 mt-1">GLP-1 agonist with 5-week dose escalation (0.6-3.0mg) and pancreatitis monitoring</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-center text-gray-600 text-sm">ePGD consultation wizard coming soon. Clinical logic, contraindications, and dose titration framework in place.</p>
        </div>
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-400 max-w-2xl mx-auto">This ePGD is provided as clinical decision support for weight management. Requires confirmed BMI &gt;30 or &gt;27 with comorbidity.</p>
        </div>
      </div>
    </div>
  );
}
