import { WegovyToolClient } from "./WegovyToolClient";

export const metadata = {
  title: "Wegovy (Semaglutide) Weight Management eTool | Get Real Health",
  description:
    "PGD consultation eTool for Wegovy (semaglutide) weight management in UK pharmacy settings. Clinical assessment, dose selection, and patient counselling support.",
};

export default function WegovyToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
              Wegovy (Semaglutide) Weight Management
            </h1>
            <p className="text-gray-600 mb-4">
              PGD Consultation eTool for UK Pharmacies
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This tool guides you through a structured assessment for Wegovy (semaglutide)
                weight management. It includes eligibility checks (BMI ≥30 or ≥27 with
                comorbidities), contraindication screening, dose selection, and patient
                counselling documentation. Follow all 10 steps to complete the consultation
                record.
              </p>
            </div>
          </div>
        </div>

        {/* Tool */}
        <WegovyToolClient />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Get Real Health PGD eTool — Wegovy (Semaglutide) Weight Management | Confidential
            Patient Information
          </p>
        </div>
      </div>
    </div>
  );
}
