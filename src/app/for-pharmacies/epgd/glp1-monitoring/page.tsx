import { PgdPageActions } from "@/components/PgdPageActions";
import { GLP1MonitoringClient } from "./GLP1MonitoringClient";

export const metadata = {
  title: "GLP-1 Monitoring & Dose Titration ePGD | Pharmacy PGD",
  description:
    "UK Pharmacy PGD for ongoing monitoring and dose-titration follow-up of patients on Wegovy (semaglutide), Mounjaro (tirzepatide), or licensed Oral Wegovy. Weight-loss assessment, side-effect review, dose decisions.",
};

export default function GLP1MonitoringPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              GLP-1 Monitoring &amp; Dose Titration ePGD
            </h1>
            <p className="text-gray-600 mb-4">
              Follow-up consultation for patients already on semaglutide,
              tirzepatide, or Oral Wegovy.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Structured monitoring covering Wegovy (semaglutide
                0.25&ndash;2.4 mg weekly), Mounjaro (tirzepatide
                2.5&ndash;15 mg weekly), and Oral Wegovy (oral semaglutide 1.5–25 mg
                daily). Weight-loss assessment against the NICE 5%-by-12-weeks
                gate, side-effect screening, dose decisions
                (continue/step-up/hold/step-down/stop/refer), and red-flag
                triggers built in.
              </p>
            </div>
          </div>
        </div>

        <GLP1MonitoringClient />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Get Real Health ePGD &mdash; GLP-1 Monitoring | Confidential Patient
            Information
          </p>
        </div>
      </div>
    </div>
  );
}
