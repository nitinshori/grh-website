import { WegovyToolClient } from "./WegovyToolClient";
import { WEGOVY_PGD_VERSION } from "./lib/wegovy-types";
import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: "Semaglutide Weight Management ePGD",
  description:
    "ePGD consultation tool for semaglutide weight management in UK pharmacy settings. For use by registered pharmacy professionals only.",
  robots: { index: false, follow: false },
};

export default function WegovyToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-2">
              Semaglutide Weight Management
            </h1>
            <p className="text-gray-600 mb-1">
              ePGD Consultation for UK Pharmacies
            </p>
            <p className="text-xs text-gray-500 mb-4">{WEGOVY_PGD_VERSION}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                This tool guides a registered pharmacist or pharmacy technician
                through a structured assessment for Wegovy (semaglutide)
                injection for weight management in adults aged 18 to 75. It
                includes eligibility checks (BMI 30 or above, or 27 or above
                with at least one weight-related comorbidity), exclusion
                screening, dose selection and titration (0.25 mg to 2.4 mg, and
                7.2 mg where permitted), and patient counselling documentation.
                Follow all 10 steps to complete the consultation record.
              </p>
            </div>
          </div>
        </div>

        {/* Tool */}
        <WegovyToolClient />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Get Real Health ePGD: Wegovy (semaglutide) Injection for Weight Management |
            Confidential Patient Information
          </p>
        </div>
      </div>
    </div>
  );
}
