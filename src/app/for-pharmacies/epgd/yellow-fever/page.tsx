import { PgdPageActions } from "@/components/PgdPageActions";

export const metadata = {
  title: 'Yellow Fever ePGD | Pharmacy PGD',
  description:
    'Yellow fever vaccination consultation tool, withdrawn pending clinical rebuild',
};

// ─────────────────────────────────────────────────────────────────────────
// WITHDRAWN 6 Aug 2026.
//
// The consultation tool that sat here was a copy of the MenACWY tool with
// the names changed and the clinical content left untouched. It offered
// Nimenrix and Menveo (meningococcal vaccines) as the products, allowed
// patients from 6 weeks of age, applied a 5 year certificate validity and
// Hajj entry rules, and treated immunosuppression as a caution rather than
// a contraindication. Yellow fever vaccine is Stamaril, a LIVE attenuated
// vaccine given subcutaneously from 9 months, where immunosuppression is a
// hard exclusion and the certificate is valid for life.
//
// Found during the full tool audit that followed Moin's report of the same
// defect in the typhoid tool. Withdrawn rather than patched, because
// yellow fever also requires the pharmacy to be a designated Yellow Fever
// Vaccination Centre and needs its own signed PGD before it can be
// rebuilt.
// ─────────────────────────────────────────────────────────────────────────

export default function YellowFeverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
            For registered pharmacy professionals only
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yellow Fever ePGD</h1>

          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-900 mb-2">
              This consultation tool has been withdrawn
            </p>
            <p className="text-sm text-amber-900">
              The tool previously published here did not reflect yellow fever
              vaccination and has been taken out of service on clinical safety
              grounds. Please do not use any record produced by it. If you have
              used it for a patient, contact Get Real Health so the consultation
              can be reviewed.
            </p>
            <p className="text-sm text-amber-900 mt-3">
              Yellow fever vaccination also requires the pharmacy to be a
              designated Yellow Fever Vaccination Centre. Speak to Get Real
              Health about designation and about the replacement tool, which
              will follow its own signed PGD.
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-6">
            For other travel vaccinations, see the Travel Health PGDs on your
            dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
