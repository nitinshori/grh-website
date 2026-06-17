import Link from "next/link";
import { PgdPageActions } from "@/components/PgdPageActions";

// ─────────────────────────────────────────────────────────────────────────
// TEMPORARILY GATED — 16 June 2026
//
// The previous HepABClient tool was a duplicate of the MenACWY tool with
// the file/symbol names rewritten but the underlying clinical content
// (Nimenrix, Menveo, sub-Saharan meningitis belt, hajj/university
// indications) unchanged. A pharmacist following the wizard would have
// recorded a MenACWY consult while believing they were vaccinating
// against Hepatitis A/B — a patient-safety risk. Reported by Moin,
// June 2026.
//
// Until the proper Hepatitis A/B PGD is written (Twinrix combined +
// Havrix monocomponent + Engerix-B Hep B-alone, plus the correct
// indications), this route shows an explanatory notice and redirects
// pharmacists to the Travel Core PGD or to wait for the rebuild.
//
// To restore: delete this notice and restore the import + render of
// <HepABClient />, but only AFTER the tool's clinical content has been
// rewritten to actually be Hep A/B.
// ─────────────────────────────────────────────────────────────────────────

export const metadata = {
  title: 'Hepatitis A/B Travel ePGD (being rewritten) | Pharmacy PGD',
  description:
    'UK Pharmacy PGD for hepatitis A/B vaccination — currently being rewritten following an internal clinical audit. Please use the Travel Core PGD in the interim.',
  robots: { index: false, follow: false },
};

export default function HepABPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
              Service temporarily unavailable
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hepatitis A/B Travel ePGD
            </h1>
            <p className="text-gray-600 mb-6">
              This consultation tool is being rewritten.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900 font-semibold mb-2">
                Do not use this tool for patient consultations right now.
              </p>
              <p className="text-sm text-amber-900">
                An internal clinical audit identified that the previous version of
                this tool displayed Meningitis ACWY (Nimenrix / Menveo) clinical
                content rather than Hepatitis A/B content. We&apos;ve taken it offline
                while the correct Hepatitis A/B workflow (Twinrix, Havrix,
                Engerix-B) is prepared. The rebuilt tool will be available shortly.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                In the meantime
              </p>
              <ul className="text-sm text-blue-900 list-disc ml-5 space-y-1">
                <li>
                  For travel vaccinations including Hepatitis A and Hepatitis B,
                  use the{" "}
                  <Link
                    href="/for-pharmacies/epgd/travel-core"
                    className="font-semibold underline hover:text-blue-700"
                  >
                    Travel Core ePGD
                  </Link>{" "}
                  — it covers Hep A, Hep B, typhoid, diphtheria, polio,
                  tetanus, cholera and yellow fever under the existing PGD.
                </li>
                <li>
                  For occupational Hepatitis B vaccination, use the{" "}
                  <Link
                    href="/for-pharmacies/epgd/hep-b-occupational"
                    className="font-semibold underline hover:text-blue-700"
                  >
                    Hep B Occupational ePGD
                  </Link>
                  .
                </li>
                <li>
                  Meningitis ACWY consultations should be conducted via the{" "}
                  <Link
                    href="/for-pharmacies/epgd/meningitis-acwy-travel"
                    className="font-semibold underline hover:text-blue-700"
                  >
                    Meningitis ACWY Travel ePGD
                  </Link>{" "}
                  — that tool is correctly configured.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Get Real Health ePGD — Hepatitis A/B Travel | Service being rewritten
          </p>
        </div>
      </div>
    </div>
  );
}
