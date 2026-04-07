import { WegovyToolClient } from "./WegovyToolClient";

export const metadata = {
  title: "Semaglutide Weight Management ePGD | Get Real Health",
  description:
    "ePGD consultation tool for semaglutide weight management in UK pharmacy settings. For use by registered pharmacy professionals only.",
  robots: { index: false, follow: false },
};

export default function WegovyToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
              Semaglutide Weight Management
            </h1>
            <p className="text-gray-600 mb-4">
              ePGD Consultation for UK Pharmacies
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This tool guides a registered pharmacist through a structured
                assessment for semaglutide weight management. It includes
                eligibility checks (BMI &ge;30 or &ge;27 with comorbidities),
                contraindication screening, dose selection, and patient
                counselling documentation. Follow all 10 steps to complete the
                consultation record.
              </p>
            </div>
          </div>
        </div>

        {/* Tool */}
        <WegovyToolClient />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Get Real Health ePGD &mdash; Semaglutide Weight Management |
            Confidential Patient Information
          </p>
        </div>
      </div>
    </div>
  );
}
